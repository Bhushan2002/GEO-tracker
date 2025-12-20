import { ModelResponse } from '../types';
import { api } from './api';
export const ModelResponseAPI = {
    getModelResponses(){
        return api.get<ModelResponse[]>('/api/modelresponse')
    }
}