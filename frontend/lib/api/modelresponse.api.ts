import { ModelResponse } from '@/types';
import { api } from './api';

/**
 * Service for fetching raw AI Model Responses.
 */
export const ModelResponseAPI = {
    /**
     * Retrieves all recorded responses from AI models.
     * Useful for the raw data view.
     */
    getModelResponses() {
        return api.get<ModelResponse[]>('/api/modelresponse');
    }
};
