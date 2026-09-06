// frontend/src/services/activityService.js
import api from './api';

/**
 * activityService
 * 
 * Architectural intent: Encapsulates API interactions specific to activity management (autosave, drafts, publishing).
 * By extracting these network calls into a dedicated service module, it decouples the UI components from the
 * underlying HTTP client, adhering to the Single Responsibility Principle.
 */
const activityService = {
    /**
     * Salva o rascunho automaticamente (Autosave).
     */
    autosaveActivity: async (data) => {
        try {
            const response = await api.post('/activities/autosave', data);
            return response.data;
        } catch (error) {
            console.error("Erro no autosave:", error);
            throw error;
        }
    },

    /**
     * Busca a lista de rascunhos do usuário.
     */
    getDrafts: async () => {
        try {
            const response = await api.get('/activities/drafts');
            return response.data;
        } catch (error) {
            console.error("Erro ao buscar rascunhos:", error);
            throw error;
        }
    },

    /**
     * Publica o rascunho final.
     */
    publishActivity: async (activityId, data) => {
        try {
            const response = await api.post(`/activities/${activityId}/publish`, data);
            return response.data;
        } catch (error) {
            console.error("Erro ao publicar atividade:", error);
            throw error;
        }
    }
};

export default activityService; // <--- O ERRO ESTAVA AQUI (Faltava esse default no seu arquivo)