import { createContext, useContext } from 'react';

/**
 * ActivityContext
 * 
 * Architectural intent: Isolates the activity execution state from UI components.
 * By centralizing this state, we prevent prop-drilling and ensure that the activity
 * flow logic (the "domain" of the activity) is decoupled from the presentation layer.
 * This adheres to the Single Responsibility Principle by keeping state management
 * separate from rendering.
 */


const ActivityContext = createContext(null);
const DEBUG_MODE = import.meta.env.VITE_DEBUG_MODE === 'true';
const debugLog = (message, ...optionalParams) => {
    if (DEBUG_MODE) {
        console.debug(`[ActivityContext] ${message}`, ...optionalParams);
    }
};
export const useActivity = () => {
    const context = useContext(ActivityContext);
    if (!context) {
        throw new Error('useActivity deve ser usado dentro de um ActivityProvider');
    }
    return context;
};

export const ActivityProvider = ({ children, value }) => {
    debugLog('ActivityProvider renderizado. Valor fornecido:', value);
    return (
        <ActivityContext.Provider value={value}>
            {children}
        </ActivityContext.Provider>
    );
};