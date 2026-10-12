import React, { useEffect } from 'react';
import { FaCheckCircle, FaExclamationTriangle, FaTimesCircle, FaTimes } from 'react-icons/fa';

/**
 * @component ToastNotification
 * @description
 * Reusable ephemeral notification (toast) component.
 * 
 * Architectural Decisions:
 * - Self-Dismissing Component: Manages its own lifecycle via `setTimeout` inside `useEffect`, emitting `onClose` to the parent to sync state.
 * - Configuration Object Pattern: Uses a dictionary (`config`) to map `type` props to styling and icons, avoiding complex switch statements and improving extensibility.
 */
const ToastNotification = ({ show, message, type = 'success', onClose }) => {
    // Auto-fechamento após 5 segundos (sempre no topo para respeitar as Regras de Hooks)
    useEffect(() => {
        if (!show) return;
        const timer = setTimeout(() => {
            onClose();
        }, 5000);
        return () => clearTimeout(timer);
    }, [show, onClose]);

    if (!show) return null;

    // Configuração de ícones e cores baseados no tipo
    const config = {
        success: {
            icon: <FaCheckCircle />,
            borderColor: 'border-accent-yellow', // Mantendo o padrão do seu tema
            textColor: 'text-accent-yellow'
        },
        error: {
            icon: <FaTimesCircle />,
            borderColor: 'border-red-500',
            textColor: 'text-red-500'
        },
        warning: {
            icon: <FaExclamationTriangle />,
            borderColor: 'border-orange-500',
            textColor: 'text-orange-500'
        }
    };

    const currentConfig = config[type] || config.success;

    return (
        <div className="fixed top-6 right-6 z-[100] animate-slide-in-right">
            <div className={`bg-secondary-bg/95 backdrop-blur-md border-l-4 ${currentConfig.borderColor} text-primary-text px-6 py-4 rounded-xl shadow-2xl flex items-center gap-4 min-w-[320px] max-w-lg border border-border-color`}>
                <div className={`${currentConfig.textColor} text-2xl flex-shrink-0`}>
                    {currentConfig.icon}
                </div>
                <div className="flex-1">
                    <p className="font-semibold text-sm md:text-base leading-snug">{message}</p>
                </div>
                <button
                    onClick={onClose}
                    className="text-secondary-text hover:text-primary-text transition-colors p-1 rounded-lg hover:bg-primary-bg"
                    aria-label="Fechar notificação"
                >
                    <FaTimes />
                </button>
            </div>
        </div>
    );
};

export default ToastNotification;