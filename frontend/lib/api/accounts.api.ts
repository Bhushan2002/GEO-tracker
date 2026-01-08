import { api } from "./api";

/**
 * Service for managing connected accounts.
 */
export const accountsAPI = {
  /**
   * Lists all connected external accounts (e.g., Google Analytics properties).
   */
  listAccounts: async () => {
    return api.get("/api/accounts");
  },
};
