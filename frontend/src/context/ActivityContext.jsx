import { createContext, useContext } from 'react';

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