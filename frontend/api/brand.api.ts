import { api } from "./api";

export const brandAPI = {
  getBrands() {
    return api.get("/api/brands");
  },
  getTargetBrand(){
    return api.get("/api/target-brands")
  },
  createTargetBrand(brand_name: string,official_url: string){
    return api.post('/api/target-brands',{brand_name, official_url})
  },
  scheduleRun(id: string) {
    return api.patch(`/api/target-brands/${id}`, { action: 'start' });
  },
  scheduleStop(id: string) {
    return api.patch(`/api/target-brands/${id}`, { action: 'stop' });
  }
};
