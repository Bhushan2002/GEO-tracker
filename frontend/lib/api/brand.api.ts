import { api } from "./api";

/**
 * Service for Brand Intelligence and Target Brand management.
 * Connects to `/api/brands` and `/api/target-brands`.
 */
export const brandAPI = {

  // --- Brand Monitoring Endpoints ---

  /**
   * Retrieves general brand data.
   */
  getBrands() {
    return api.get("/api/brands");
  },

  /**
   * Retrieves historical performance data for brands.
   * @param days - Number of days to look back (default: 30).
   */
  getBrandHistory(days: number = 30) {
    return api.get(`/api/brands/history?days=${days}`);
  },


  // --- Target Brand Management ---

  /**
   * Fetches the list of user-configured Target Brands.
   */
  getTargetBrand() {
    return api.get("/api/target-brands");
  },

  /**
   * Creates a new Target Brand for monitoring.
   * @param data - The brand details (name, URL, type, etc.).
   */
  createTargetBrand(data: {
    brand_name: string;
    official_url: string;
    actual_brand_name?: string;
    brand_type?: string;
    brand_description?: string;
    mainBrand?: boolean;
  }) {
    return api.post('/api/target-brands', data);
  },

  /**
   * Starts the automated monitoring schedule for a target brand.
   * @param id - The Target Brand ID.
   */
  scheduleRun(id: string) {
    return api.post('/api/target-brands/schedule', { id, action: 'start' });
  },

  /**
   * Stops the automated monitoring schedule.
   * @param id - The Target Brand ID.
   */
  scheduleStop(id: string) {
    return api.post('/api/target-brands/schedule', { id, action: 'stop' });
  }
};
