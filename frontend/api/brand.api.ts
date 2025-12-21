import { api } from "./api";

export const brandAPI = {
  getBrands() {
    return api.get("/api/brands");
  },
  createBrand(brand_name: string){
    return api.post('/api/brands',{brand_name})
  }
};
