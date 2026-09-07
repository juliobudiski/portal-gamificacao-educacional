// frontend/src/services/api.js
import axios from 'axios';

/**
 * api
 * 
 * Architectural intent: Configures the core Axios HTTP client instance for the application.
 * It centralizes request interception to automatically inject authentication tokens and handles
 * base URL configuration, ensuring a unified and consistent communication layer with the backend.
 */
const envUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const baseUrl = envUrl.endsWith('/') ? envUrl.slice(0, -1) : envUrl;

const api = axios.create({
    baseURL: `${baseUrl}/api`,
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use(
    (config) => {
        // --- CORREÇÃO AQUI ---
        // Antes você buscava 'user', agora buscamos 'token' para alinhar com o AuthContext
        const token = localStorage.getItem('token');

        console.log(`[API DEBUG] Enviando para: ${config.url}`);

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
            console.log(`[API DEBUG] Token anexado: Bearer ${token.substring(0, 10)}...`);
        } else {
            console.warn("[API DEBUG] Nenhum token encontrado no localStorage ('token').");
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

api.interceptors.response.use(
    (response) => response,
    (error) => {
        const status = error?.response?.status;

        // Erros de validação, autenticação e regras de negócio: rejeita para exibição local (Toasts/Alertas)
        if (status === 400 || status === 401 || status === 403 || status === 422) {
            return Promise.reject(error);
        }

        // Erros críticos de rede/servidor ou recurso inexistente: redirecionamento global de emergência
        if (status === 404 || status === 500 || status === 502 || status === 503) {
            console.error(`[API ERROR INTERCEPTOR] Falha crítica (${status}) detectada:`, error?.config?.url);
            
            // Evita loops infinitos de redirecionamento caso já estejamos no fallback
            if (window.location.pathname !== '/404') {
                window.location.href = '/404';
            }
        }

        return Promise.reject(error);
    }
);

export default api;