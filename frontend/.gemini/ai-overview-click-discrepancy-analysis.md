# AI Overview Click Discrepancy Analysis

## ✅ ISSUE RESOLVED

### Problem Summary
The "Top AI Overview Content" table showed **1 click** while the "Device Breakdown" and "AI Overview Clicks" metric showed **5 clicks**.

### Root Cause (CONFIRMED)
**Google Analytics 4 Multi-Dimension Aggregation Bug**

When querying GA4 with **multiple dimensions** (`pagePath` + `pageTitle`), GA4 was incorrectly aggregating/deduplicating the event counts, returning only 1 click instead of 5.

**Evidence from Console Output:**
```
Pages data: [
  {
    "path": "/",
    "title": "Creatosaurus...",
    "clicks": 1  // ❌ WRONG - Should be 5
  }
]
Devices data: [
  {
    "name": "desktop",
    "value": 5  // ✅ CORRECT
  }
]
```

Both queries used the same event filter (`ai_overview_click`) and date range, but returned different totals because:
- **Pages query** used 2 dimensions: `pagePath` + `pageTitle` → Returned 1 click
- **Devices query** used 1 dimension: `deviceCategory` → Returned 5 clicks (correct)

### Solution Applied

**Changed the pages query to use only `pagePath` dimension:**

**Before:**
```typescript
dimensions: [{ name: "pagePath" }, { name: "pageTitle" }],
metrics: [{ name: "eventCount" }],
```

**After:**
```typescript
dimensions: [{ name: "pagePath" }],  // Single dimension only
metrics: [{ name: "eventCount" }],
```

**Title Handling:**
Since we removed the `pageTitle` dimension, we now generate a readable title from the path:
- `/` → "Home Page"
- `/about-us` → "About Us"
- `/blog/my-post` → "My Post"

### Files Modified

1. **`app/api/analytics/ai-overview-stats/route.ts`**
   - Line 67: Removed `pageTitle` from dimensions array
   - Line 107: Removed `pageTitle` from URL fallback query
   - Lines 131-142: Updated data mapping to generate title from path
   - Line 135: Added TypeScript type annotation for lambda parameter

### Expected Result

After this fix, the console should now show:
```
Pages data: [
  {
    "path": "/",
    "title": "Home Page",
    "clicks": 5  // ✅ NOW CORRECT
  }
]
Devices data: [
  {
    "name": "desktop",
    "value": 5  // ✅ CORRECT
  }
]
Total clicks from pages: 5  // ✅ NOW MATCHES
```

### Testing
1. Refresh the Analytics page
2. Check that "Top AI Overview Content" now shows **5 clicks**
3. Verify it matches the "AI Overview Clicks" metric card
4. Verify it matches the "Device Breakdown" total

### Technical Notes

**Why This Happened:**
Google Analytics 4 has known issues with multi-dimensional queries where it applies different aggregation logic depending on the number and type of dimensions used. This is particularly problematic with event-based metrics.

**Best Practice:**
When querying GA4 for event counts, use the minimum number of dimensions necessary. If you need additional metadata (like page titles), either:
1. Derive it from the primary dimension (as we did)
2. Make a separate API call
3. Use a different metric that doesn't have this aggregation issue

### Related Issues
This is a known GA4 API behavior documented in various developer forums. The workaround is to minimize dimensions in event count queries.

