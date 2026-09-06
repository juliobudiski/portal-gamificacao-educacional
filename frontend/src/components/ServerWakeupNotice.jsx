import React, { useState, useEffect } from 'react';
import { Server, X, Clock } from 'lucide-react';

/**
 * @component ServerWakeupNotice
 * @description
 * User experience (UX) enhancement component alerting users to potential cold-start delays.
 * 
 * Architectural Decisions:
 * - Local State Persistence: Uses `localStorage` to ensure the notice is shown only once per browser, preventing notification fatigue.
 * - Non-blocking UI: Renders absolutely positioned over the main UI without interrupting user workflows.
 */
const ServerWakeupNotice = () => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Verifica se o usuário já fechou este aviso anteriormente
        const hasSeenNotice = localStorage.getItem('has_seen_server_notice');

        // Se não viu, mostra o aviso após 1 segundo (para não competir com o carregamento inicial da UI)
        if (!hasSeenNotice) {
            const timer = setTimeout(() => setIsVisible(true), 1000);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleDismiss = () => {
        setIsVisible(false);
        // Salva no navegador que o usuário já viu o aviso
        localStorage.setItem('has_seen_server_notice', 'true');
    };

    if (!isVisible) return null;

    return (
        <div className="fixed bottom-4 right-4 z-50 w-full max-w-sm animate-bounce-in">
            <div className="bg-secondary-bg border-l-4 border-accent-yellow shadow-2xl rounded-r-lg p-4 flex items-start gap-3 relative">
                {/* Ícone Pulsante */}
                <div className="flex-shrink-0">
                    <div className="bg-accent-yellow/20 p-2 rounded-full">
                        <Server className="w-6 h-6 text-accent-yellow animate-pulse" />
                    </div>
                </div>

                <div className="flex-1 pr-6">
                    <h3 className="text-sm font-bold text-primary-text mb-1 flex items-center gap-2">
                        Servidor Inicializando...
                    </h3>
                    <p className="text-xs text-secondary-text leading-relaxed">
                        Este é um projeto acadêmico em hospedagem gratuita.
                        O primeiro acesso pode levar até <span className="font-bold text-accent-yellow">50 segundos</span> para "acordar" o servidor.
                        <br />
                        <span className="flex items-center gap-1 mt-1 text-xs opacity-70">
                            <Clock size={10} /> Agradecemos a paciência!
                        </span>
                    </p>
                </div>

                {/* Botão Fechar */}
                <button
                    onClick={handleDismiss}
                    className="absolute top-2 right-2 text-secondary-text hover:text-primary-text transition-colors p-1"
                    aria-label="Fechar aviso"
                >
                    <X size={16} />
                </button>
            </div>
        </div>
    );
};

export default ServerWakeupNotice;