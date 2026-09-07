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
        const token = localStorage.getItem('token');

        // Guardrail estrito: Só anexa o header Authorization se o token for uma string válida e não-nula
        const isValidToken = typeof token === 'string' && 
                             token.trim() !== '' && 
                             token !== 'null' && 
                             token !== 'undefined';

        if (isValidToken) {
            config.headers = config.headers || {};
            config.headers.Authorization = `Bearer ${token.trim()}`;
        } else {
            // Se o header tiver sido setado previamente com valor inválido, remove
            if (config.headers?.Authorization) {
                delete config.headers.Authorization;
            }
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