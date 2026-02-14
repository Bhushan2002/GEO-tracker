import { z } from 'zod';

/**
 * Centralized Zod validation schemas for API routes
 */

// ============================================================================
// AUTH SCHEMAS
// ============================================================================

export const loginSchema = z.object({
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(50, 'Username must be less than 50 characters')
    .trim(),
  password: z.string()
    .min(6, 'Password must be at least 6 characters')
    .max(100, 'Password must be less than 100 characters')
});

// ============================================================================
// BRAND SCHEMAS
// ============================================================================

export const createBrandSchema = z.object({
  brand_name: z.string()
    .min(1, 'Brand name is required')
    .max(100, 'Brand name must be less than 100 characters')
    .trim(),
  prominence_score: z.number()
    .min(0, 'Prominence score must be at least 0')
    .max(100, 'Prominence score must be at most 100')
    .optional(),
  context: z.string()
    .max(1000, 'Context must be less than 1000 characters')
    .optional(),
  associated_links: z.array(
    z.object({
      url: z.string().url('Invalid URL format'),
      is_direct_brand_link: z.boolean().optional(),
      citation_type: z.string().optional()
    })
  ).max(50, 'Too many associated links').optional(),
  color: z.string()
    .regex(/^#[0-9A-F]{6}$/i, 'Invalid color format (must be hex color)')
    .optional()
});

// ============================================================================
// PROMPT SCHEMAS
// ============================================================================

export const createPromptSchema = z.object({
  promptText: z.string()
    .min(10, 'Prompt text must be at least 10 characters')
    .max(5000, 'Prompt text must be less than 5000 characters')
    .trim(),
  topic: z.string()
    .min(1, 'Topic is required')
    .max(100, 'Topic must be less than 100 characters')
    .trim(),
  tags: z.array(z.string().max(50, 'Tag too long'))
    .max(20, 'Too many tags')
    .optional(),
  ipAddress: z.string().optional(),
  schedule: z.object({
    enabled: z.boolean(),
    frequency: z.enum(['daily', 'weekly', 'monthly']).optional()
  }).optional()
});

export const updatePromptTagsSchema = z.object({
  tags: z.array(z.string().max(50, 'Tag too long'))
    .max(20, 'Too many tags')
});

export const promptActionSchema = z.object({
  id: z.string()
    .min(24, 'Invalid prompt ID')
    .max(24, 'Invalid prompt ID'),
  action: z.enum(['start-schedule', 'stop-schedule', 'run'])
});

// ============================================================================
// TARGET BRAND SCHEMAS
// ============================================================================

export const createTargetBrandSchema = z.object({
  brand_name: z.string()
    .min(1, 'Brand name is required')
    .max(100, 'Brand name must be less than 100 characters')
    .trim(),
  official_url: z.string()
    .url('Invalid URL format')
    .max(500, 'URL too long'),
  actual_brand_name: z.string()
    .max(100, 'Actual brand name must be less than 100 characters')
    .optional(),
  brand_type: z.enum(['Main', 'Competitor', 'Partner']).optional(),
  brand_description: z.string()
    .max(1000, 'Description must be less than 1000 characters')
    .optional(),
  mainBrand: z.boolean().optional()
});

export const updateTargetBrandScheduleSchema = z.object({
  id: z.string()
    .min(24, 'Invalid brand ID')
    .max(24, 'Invalid brand ID'),
  action: z.enum(['start', 'stop'])
});

export const updateTargetBrandSchema = z.object({
  action: z.enum(['start', 'stop'])
});

// ============================================================================
// WORKSPACE SCHEMAS
// ============================================================================

export const createWorkspaceSchema = z.object({
  name: z.string()
    .min(1, 'Workspace name is required')
    .max(100, 'Workspace name must be less than 100 characters')
    .trim(),
  type: z.enum(['Free', 'Pro', 'Enterprise']).optional().default('Free')
});

// ============================================================================
// GA ACCOUNT SCHEMAS
// ============================================================================

export const updateGAAccountSchema = z.object({
  propertyId: z.string()
    .min(1, 'Property ID is required')
    .max(50, 'Property ID too long')
    .trim(),
  propertyName: z.string()
    .max(200, 'Property name too long')
    .optional()
});

export const linkSearchConsoleSchema = z.object({
  accountId: z.string()
    .min(24, 'Invalid account ID')
    .max(24, 'Invalid account ID'),
  siteUrl: z.string()
    .url('Invalid site URL')
    .max(500, 'URL too long')
});

// ============================================================================
// QUERY PARAMETER SCHEMAS
// ============================================================================

export const dateRangeSchema = z.object({
  startDate: z.union([
    z.literal('today'),
    z.literal('yesterday'),
    z.string().regex(/^\d+daysAgo$/, 'Invalid date format (use: today, yesterday, or XdaysAgo)'),
    z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (use: YYYY-MM-DD)')
  ]).optional(),
  endDate: z.union([
    z.literal('today'),
    z.literal('yesterday'),
    z.string().regex(/^\d+daysAgo$/, 'Invalid date format'),
    z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (use: YYYY-MM-DD)')
  ]).optional()
});

export const paginationSchema = z.object({
  page: z.string()
    .regex(/^\d+$/, 'Page must be a number')
    .transform(Number)
    .pipe(z.number().min(1, 'Page must be at least 1'))
    .optional(),
  limit: z.string()
    .regex(/^\d+$/, 'Limit must be a number')
    .transform(Number)
    .pipe(z.number().min(1, 'Limit must be at least 1').max(100, 'Limit cannot exceed 100'))
    .optional()
});

export const accountIdSchema = z.string()
  .min(24, 'Invalid account ID format')
  .max(24, 'Invalid account ID format')
  .regex(/^[0-9a-fA-F]{24}$/, 'Account ID must be a valid MongoDB ObjectId');

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Validates request body against a schema and returns formatted error response
 */
export function validateRequestBody<T>(schema: z.ZodSchema<T>, data: unknown) {
  try {
    return {
      success: true as const,
      data: schema.parse(data)
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false as const,
        error: {
          message: 'Validation failed',
          details: error.issues.map((err: z.ZodIssue) => ({
            field: err.path.join('.'),
            message: err.message
          }))
        }
      };
    }
    return {
      success: false as const,
      error: {
        message: 'Invalid request data',
        details: []
      }
    };
  }
}

/**
 * Validates query parameters against a schema
 */
export function validateQueryParams<T>(schema: z.ZodSchema<T>, searchParams: URLSearchParams) {
  const params = Object.fromEntries(searchParams.entries());
  return validateRequestBody(schema, params);
}
