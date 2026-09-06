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

    // Auto-fechamento após 4 segundos
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, 4000);
        return () => clearTimeout(timer);
    }, [show, onClose]);

    return (
        <div className="fixed bottom-5 right-5 z-[60] animate-slide-in-right">
            <div className={`bg-secondary-bg border-l-4 ${currentConfig.borderColor} text-primary-text px-6 py-4 rounded shadow-2xl flex items-center gap-4 min-w-[300px] max-w-md border border-[#3e4a52]`}>
                <div className={`${currentConfig.textColor} text-xl`}>
                    {currentConfig.icon}
                </div>
                <div className="flex-1">
                    <p className="font-medium text-sm md:text-base">{message}</p>
                </div>
                <button
                    onClick={onClose}
                    className="text-secondary-text hover:text-primary-text transition-colors"
                >
                    <FaTimes />
                </button>
            </div>
        </div>
    );
};

export default ToastNotification;