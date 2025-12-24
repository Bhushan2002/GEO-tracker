import { api } from "./api";

export const brandAPI = {
  getBrands() {
    return api.get("/api/brands");
  },
  getTargetBrand(){
    return api.get("/api/target-brands")
  },
  createTargetBrand(data: { brand_name: string; official_url: string; actual_brand_name?: string; brand_type?: string }){
    return api.post('/api/target-brands', data)
  },
  scheduleRun(id: string) {
    return api.post('/api/target-brands/schedule', { id, action: 'start' });
  },
  scheduleStop(id: string) {
    return api.post('/api/target-brands/schedule', { id, action: 'stop' });
  }
};
