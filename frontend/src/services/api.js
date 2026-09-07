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

        // Limpeza absoluta do header de token
        if (token && token !== 'null' && token !== 'undefined' && token.trim() !== '') {
            config.headers = config.headers || {};
            config.headers.Authorization = `Bearer ${token.trim()}`;
        } else {
            // Remove qualquer resquício ou valor default que possa conter 'Bearer null'
            if (config.headers) {
                delete config.headers.Authorization;
                delete config.headers.authorization;
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
        const requestUrl = error?.config?.url || '';

        // 1. NUNCA redireciona para 404/Crash em status 400, 401, 403 ou 422
        if (status === 400 || status === 401 || status === 403 || status === 422) {
            return Promise.reject(error);
        }

        // 2. NUNCA redireciona se a chamada for de telemetria/log (/api/log) ou rota pública de contato (/api/contact)
        const isExemptRoute = requestUrl.includes('/log') || 
                              requestUrl.includes('/contact') || 
                              requestUrl.includes('/public');

        if (isExemptRoute) {
            return Promise.reject(error);
        }

        // 3. Redirecionamento de emergência restrito a quedas reais do servidor (500, 502, 503)
        // ou 404 em navegações essenciais
        if (status === 500 || status === 502 || status === 503 || status === 404) {
            console.error(`[API ERROR INTERCEPTOR] Falha crítica do servidor (${status}) detectada:`, requestUrl);
            
            // Evita loops infinitos de redirecionamento caso já estejamos no fallback
            if (window.location.pathname !== '/404') {
                window.location.href = '/404';
            }
        }

        return Promise.reject(error);
    }
);

export default api;