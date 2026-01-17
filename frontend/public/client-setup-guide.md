# AI Overview Tracking Setup Guide

## What is AI Overview Tracking?

AI Overview tracking lets you see when visitors arrive at your website through Google's AI Overview feature. This gives you valuable insights into how AI is driving traffic to your site.

## Setup Instructions (5 minutes)

### Step 1: Locate Your Google Analytics Code

Find your existing Google Analytics (GA4) code in your website. It looks like this:

```html
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

### Step 2: Add AI Overview Detection

Add this **single line** right after your `gtag('config', ...)` line:

```html
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
  
  // AI Overview Detection - ADD THIS LINE
  if(location.hash.includes(':~:text='))gtag('event','ai_overview_click',{page_path:location.pathname+location.hash});
</script>
```

**That's it!** The tracking code is now active.

---

## What Does This Code Do?

- **Detects AI Overview visits**: When someone clicks a link from Google's AI Overview, the URL contains a special marker (`#:~:text=`)
- **Sends an event to GA4**: The code creates an `ai_overview_click` event in your Google Analytics
- **Zero performance impact**: The code runs instantly and doesn't slow down your site
- **Privacy compliant**: Only tracks page paths, no personal information

---

## Verification

### Option 1: Test Immediately
1. Visit your website with this URL format: `https://yourwebsite.com#:~:text=test`
2. Open browser console (F12)
3. Check Google Analytics Realtime report
4. Look for `ai_overview_click` event

### Option 2: Wait for Real Traffic
- Data appears in your analytics dashboard within 24-48 hours
- AI Overview clicks will be tracked automatically

---

## Frequently Asked Questions

**Q: Is this safe for my website?**  
A: Yes, it's a single line of JavaScript that works with your existing GA4 code. No security risks.

**Q: Does this slow down my site?**  
A: No, it runs instantly and has zero performance impact.

**Q: Do I need Google Tag Manager?**  
A: No, this works with your existing Google Analytics (GA4) setup.

**Q: What if I use WordPress/Shopify/etc?**  
A: The code works on any platform. Just add it wherever you added your GA4 code (usually in theme settings or a custom HTML widget).

**Q: Can I remove it later?**  
A: Yes, simply delete the added line. Your regular GA4 tracking continues normally.

---

## Need Help?

If you have questions or need assistance with setup, please contact our support team.
