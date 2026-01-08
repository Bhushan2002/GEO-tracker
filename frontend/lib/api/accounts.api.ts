import { api } from "./api";


export const accountsAPI = {
  listAccounts: async () => {
    return api.get("/api/accounts");
  },
};
