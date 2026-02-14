# Error Response Standardization - Migration Guide

## ✅ Standardized Error Format

All API errors now follow this consistent structure:

```json
{
  "error": {
    "message": "Human-readable error message",
    "code": "ERROR_CODE",
    "statusCode": 400,
    "details": { /* optional additional context */ },
    "timestamp": "2026-02-14T10:30:00.000Z"  // optional
  }
}
```

## 🔄 Migration Pattern

### Before (Inconsistent)
```typescript
// ❌ Old patterns
return NextResponse.json({ message: "Error" }, { status: 500 });
return NextResponse.json({ error: "Error" }, { status: 400 });
return NextResponse.json(validation.error, { status: 400 });
```

### After (Standardized)
```typescript
// ✅ New pattern
import { handleError, notFound, badRequest, handleValidationError } from "@/lib/utils/error-response";

// Validation errors
if (!validation.success) {
  return handleValidationError(validation.error);
}

// Not found
if (!resource) {
  return notFound("Resource not found");
}

// Bad request
if (!requiredParam) {
  return badRequest("Parameter is required");
}

// Generic error handling
try {
  // logic
} catch (error) {
  return handleError(error, "operation description");
}
```

## 📚 Available Error Functions

### Common HTTP Errors
- `badRequest(message, options?)` - 400
- `unauthorized(message, options?)` - 401
- `forbidden(message, options?)` - 403
- `notFound(message, options?)` - 404
- `conflict(message, options?)` - 409
- `validationError(message, details?)` - 422
- `internalError(message, details?)` - 500
- `serviceUnavailable(message, options?)` - 503

### Specialized Handlers
- `handleValidationError(zodError)` - Zod validation errors
- `handleError(error, context)` - Generic error handler
- `workspaceError()` - Workspace context missing
- `databaseError(error, operation)` - MongoDB errors
- `externalApiError(error, service)` - External API errors

## ✅ Updated Routes

The following routes have been standardized:
- ✅ `/api/brands` - GET, POST
- ✅ `/api/prompt` - GET, POST
- ✅ `/api/prompt/[id]` - GET, PATCH
- ✅ `/api/target-brands` - GET, POST
- ✅ `/api/workspaces` - GET, POST
- ✅ `/api/modelresponse` - GET
- ✅ `/api/ga-accounts` - GET, DELETE (partial)

## 🔍 Error Codes

Standard error codes available via `ErrorCode` constant:

**Validation:**
- `VALIDATION_ERROR` - Schema validation failed
- `INVALID_INPUT` - Invalid request data
- `MISSING_FIELD` - Required field missing

**Authentication:**
- `UNAUTHORIZED` - Authentication required
- `FORBIDDEN` - Insufficient permissions
- `TOKEN_EXPIRED` - Access token expired

**Resources:**
- `NOT_FOUND` - Resource doesn't exist
- `ALREADY_EXISTS` - Duplicate resource
- `CONFLICT` - Resource conflict

**System:**
- `INTERNAL_ERROR` - Server error
- `DATABASE_ERROR` - Database operation failed
- `EXTERNAL_API_ERROR` - External service error
- `TIMEOUT` - Request timeout

## 💡 Best Practices

1. **Always provide context in handleError:**
   ```typescript
   catch (error) {
     return handleError(error, "creating brand"); // ✅ Clear context
   }
   ```

2. **Use specific functions for known errors:**
   ```typescript
   if (!resource) return notFound("Brand not found"); // ✅ Specific
   return handleError(new Error("not found"), "..."); // ❌ Generic
   ```

3. **Include details for debugging:**
   ```typescript
   return conflict("Brand already exists", {
     details: { brandName: brand_name }
   });
   ```

4. **Workspace errors:**
   ```typescript
   const workspaceId = await getWorkspaceId(req);
   if (!workspaceId) return workspaceError(); // Auto-standardized
   ```

## 🎯 Benefits

- ✅ Consistent error format across all endpoints
- ✅ Better error debugging with context
- ✅ Type-safe error responses
- ✅ Development vs production error filtering
- ✅ Frontend can parse errors predictably
- ✅ Automatic error logging with context
- ✅ Reduced code duplication

## 📝 Next Steps

To complete standardization across all routes:

1. Update remaining routes in `app/api/`
2. Search for `NextResponse.json` with status codes 400-500
3. Replace with appropriate error handler
4. Remove old error patterns
5. Update tests to expect new error format
