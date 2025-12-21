import { api } from "./api";

export const brandAPI = {
  getBrand() {
    return api.get("/api/brands");
  },
};
