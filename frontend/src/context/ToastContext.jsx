import React, { createContext, useContext, useState, useCallback } from 'react';
import ToastNotification from '../components/ToastNotification';

/**
 * ToastContext
 * 
 * Architectural intent: Provides a global mechanism for rendering ephemeral notifications.
 * Decouples the presentation and state management of toasts from the components that trigger them.
 * This maintains High Cohesion for notification management and Low Coupling across the app.
 */
const ToastContext = createContext();

export const ToastProvider = ({ children }) => {
    const [toast, setToast] = useState({
        show: false,
        message: '',
        type: 'success'
    });

    // useCallback garante que a função não seja recriada a cada render
    const showToast = useCallback((message, type = 'success') => {
        setToast({ show: true, message, type });
    }, []);

    const closeToast = useCallback(() => {
        setToast((prev) => ({ ...prev, show: false }));
    }, []);

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            {/* O Componente é renderizado AQUI, globalmente */}
            <ToastNotification
                show={toast.show}
                message={toast.message}
                type={toast.type}
                onClose={closeToast}
            />
        </ToastContext.Provider>
    );
};

// Hook personalizado para facilitar o uso
export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast deve ser usado dentro de um ToastProvider');
    }
    return context;
};