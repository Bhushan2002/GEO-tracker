import { NextRequest } from "next/server";
import { Model, Document } from "mongoose";

/**
 * Pagination Utility
 * 
 * Provides consistent pagination functionality across all list endpoints.
 * Handles query parameter parsing, database queries, and response formatting.
 */

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Pagination query parameters from request
 */
export interface PaginationParams {
  page: number;
  limit: number;
}

/**
 * Pagination metadata included in API responses
 */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

/**
 * Paginated API response format
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMeta;
}

/**
 * Options for pagination query
 */
export interface PaginationOptions<T> {
  select?: string;
  sort?: string | { [key: string]: 1 | -1 };
  populate?: any;
  lean?: boolean;
}

// ============================================================================
// CONFIGURATION
// ============================================================================

/**
 * Default pagination settings
 */
export const PAGINATION_DEFAULTS = {
  PAGE: 1,
  LIMIT: 20,
  MAX_LIMIT: 100, // Prevent excessive data fetching
  MIN_LIMIT: 1,
} as const;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Extracts and validates pagination parameters from request URL
 * 
 * @param request - Next.js request object
 * @returns Validated pagination parameters
 * 
 * @example
 * ```typescript
 * const { page, limit } = getPaginationParams(request);
 * // With ?page=2&limit=50 → { page: 2, limit: 50 }
 * // With no params → { page: 1, limit: 20 }
 * ```
 */
export function getPaginationParams(request: NextRequest): PaginationParams {
  const { searchParams } = new URL(request.url);

  // Parse page number
  const pageParam = searchParams.get('page');
  let page = pageParam ? parseInt(pageParam, 10) : PAGINATION_DEFAULTS.PAGE;
  
  // Validate page number
  if (isNaN(page) || page < 1) {
    page = PAGINATION_DEFAULTS.PAGE;
  }

  // Parse limit
  const limitParam = searchParams.get('limit');
  let limit = limitParam ? parseInt(limitParam, 10) : PAGINATION_DEFAULTS.LIMIT;
  
  // Validate and cap limit
  if (isNaN(limit) || limit < PAGINATION_DEFAULTS.MIN_LIMIT) {
    limit = PAGINATION_DEFAULTS.LIMIT;
  }
  if (limit > PAGINATION_DEFAULTS.MAX_LIMIT) {
    limit = PAGINATION_DEFAULTS.MAX_LIMIT;
  }

  return { page, limit };
}

/**
 * Calculates pagination metadata
 * 
 * @param page - Current page number
 * @param limit - Items per page
 * @param total - Total number of items
 * @returns Pagination metadata object
 */
export function calculatePaginationMeta(
  page: number,
  limit: number,
  total: number
): PaginationMeta {
  const totalPages = Math.ceil(total / limit);
  
  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
}

/**
 * Calculates the number of documents to skip for pagination
 * 
 * @param page - Current page number
 * @param limit - Items per page
 * @returns Number of documents to skip
 */
export function calculateSkip(page: number, limit: number): number {
  return (page - 1) * limit;
}

// ============================================================================
// MAIN PAGINATION FUNCTION
// ============================================================================

/**
 * Executes a paginated database query
 * 
 * This is the main function used by API routes. It handles:
 * - Counting total documents
 * - Fetching paginated results
 * - Applying select, sort, and populate options
 * - Calculating pagination metadata
 * 
 * @param model - Mongoose model to query
 * @param filter - Query filter conditions
 * @param page - Current page number
 * @param limit - Items per page
 * @param options - Additional query options (select, sort, populate, lean)
 * @returns Paginated response with data and metadata
 * 
 * @example
 * ```typescript
 * // Basic usage
 * const result = await paginateQuery(
 *   Brand,
 *   { workspaceId },
 *   1,
 *   20
 * );
 * 
 * // With options
 * const result = await paginateQuery(
 *   ModelResponse,
 *   { workspaceId },
 *   page,
 *   limit,
 *   {
 *     sort: { createdAt: -1 },
 *     populate: 'identifiedBrands',
 *     lean: true
 *   }
 * );
 * ```
 */
export async function paginateQuery<T extends Document>(
  model: Model<T>,
  filter: any,
  page: number,
  limit: number,
  options: PaginationOptions<T> = {}
): Promise<PaginatedResponse<any>> {
  // Calculate pagination values
  const skip = calculateSkip(page, limit);

  // Build the base query
  const baseQuery = model.find(filter).skip(skip).limit(limit);

  // Apply options to get the final query
  const finalQuery = buildQueryWithOptions(baseQuery, options);

  // Execute queries in parallel for performance
  const [total, data] = await Promise.all([
    model.countDocuments(filter),
    finalQuery.exec(),
  ]);

  // Calculate pagination metadata
  const pagination = calculatePaginationMeta(page, limit, total);

  return {
    data,
    pagination,
  };
}

/**
 * Helper function to apply query options (internal use)
 */
function buildQueryWithOptions<T>(query: any, options: PaginationOptions<T>): any {
  if (options.select) {
    query = query.select(options.select);
  }

  if (options.sort) {
    query = query.sort(options.sort);
  }

  if (options.populate) {
    query = query.populate(options.populate);
  }

  if (options.lean) {
    query = query.lean();
  }

  return query;
}

/**
 * Alternative pagination function for when you already have the data
 * Useful for in-memory pagination or when data comes from external APIs
 * 
 * @param data - Array of data to paginate
 * @param page - Current page number
 * @param limit - Items per page
 * @returns Paginated response
 */
export function paginateArray<T>(
  data: T[],
  page: number,
  limit: number
): PaginatedResponse<T> {
  const skip = calculateSkip(page, limit);
  const paginatedData = data.slice(skip, skip + limit);
  const pagination = calculatePaginationMeta(page, limit, data.length);

  return {
    data: paginatedData,
    pagination,
  };
}

// ============================================================================
// UTILITY HELPERS
// ============================================================================

/**
 * Validates if pagination parameters are within acceptable ranges
 * 
 * @param page - Page number to validate
 * @param limit - Limit to validate
 * @returns Object with validation result and error message if invalid
 */
export function validatePaginationParams(
  page: number,
  limit: number
): { valid: boolean; error?: string } {
  if (page < 1) {
    return { valid: false, error: 'Page number must be at least 1' };
  }

  if (limit < PAGINATION_DEFAULTS.MIN_LIMIT) {
    return { valid: false, error: `Limit must be at least ${PAGINATION_DEFAULTS.MIN_LIMIT}` };
  }

  if (limit > PAGINATION_DEFAULTS.MAX_LIMIT) {
    return { valid: false, error: `Limit cannot exceed ${PAGINATION_DEFAULTS.MAX_LIMIT}` };
  }

  return { valid: true };
}

/**
 * Generates pagination links for HATEOAS-style APIs (optional enhancement)
 * 
 * @param baseUrl - Base URL of the endpoint
 * @param page - Current page
 * @param limit - Items per page
 * @param totalPages - Total number of pages
 * @returns Object with next/prev/first/last URLs
 */
export function generatePaginationLinks(
  baseUrl: string,
  page: number,
  limit: number,
  totalPages: number
): {
  next?: string;
  prev?: string;
  first: string;
  last: string;
} {
  const links: any = {
    first: `${baseUrl}?page=1&limit=${limit}`,
    last: `${baseUrl}?page=${totalPages}&limit=${limit}`,
  };

  if (page < totalPages) {
    links.next = `${baseUrl}?page=${page + 1}&limit=${limit}`;
  }

  if (page > 1) {
    links.prev = `${baseUrl}?page=${page - 1}&limit=${limit}`;
  }

  return links;
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  getPaginationParams,
  paginateQuery,
  paginateArray,
  calculatePaginationMeta,
  calculateSkip,
  validatePaginationParams,
  generatePaginationLinks,
  PAGINATION_DEFAULTS,
};
