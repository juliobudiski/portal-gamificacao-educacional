// frontend/src/hooks/useAutoSave.js
import { useEffect, useRef, useState, useCallback } from 'react';
// Agora o import abaixo vai funcionar porque arrumamos o arquivo acima
import activityService from '../services/activityService';

export const useAutoSave = (data, updateIdCallback, delay = 2000) => {
    const [saveStatus, setSaveStatus] = useState('idle');
    const [lastSavedAt, setLastSavedAt] = useState(null);

    const prevDataRef = useRef(data);
    const timeoutRef = useRef(null);
    const isFirstRender = useRef(true);

    const save = useCallback(async (currentData) => {
        setSaveStatus('saving');
        try {
            const response = await activityService.autosaveActivity(currentData);

            if (!currentData.id && response.id) {
                updateIdCallback(response.id);
            }

            setSaveStatus('saved');
            setLastSavedAt(new Date());
        } catch (error) {
            console.error(error);
            setSaveStatus('error');
        }
    }, [updateIdCallback]);

    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }

        const dataChanged = JSON.stringify(data) !== JSON.stringify(prevDataRef.current);

        if (dataChanged) {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            setSaveStatus('pending');

            timeoutRef.current = setTimeout(() => {
                save(data);
                prevDataRef.current = data;
            }, delay);
        }

        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, [data, delay, save]);

    return { saveStatus, lastSavedAt };
};