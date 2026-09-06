// frontend/src/pages/ActivityEditPage.jsx
import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ActivityCreationPage from './ActivityCreationPage'; // Vamos reutilizar a página de criação

/**
 * ActivityEditPage
 * 
 * Architectural intent: Reuses the ActivityCreationPage as a unified interface for editing existing activities.
 * By simply fetching the existing activity data and passing it as props, it avoids duplicating the complex
 * wizard logic, adhering strictly to the DRY principle and ensuring High Cohesion of the editing workflow.
 */
function ActivityEditPage() {
    const { activityId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [activityData, setActivityData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchActivity = async () => {
            if (!user?.token) {
                navigate('/login');
                return;
            }

            try {
                const response = await fetch(`${import.meta.env.VITE_API_URL}/api/activities/${activityId}`, {
                    headers: {
                        'Authorization': `Bearer ${user.token}`,
                    },
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Falha ao buscar dados da atividade.');
                }

                const data = await response.json();
                setActivityData(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchActivity();
    }, [activityId, user, navigate]);

    if (loading) {
        return <div className="text-center p-10 text-primary-text">Carregando atividade para edição...</div>;
    }

    if (error) {
        return <div className="text-center p-10 text-red-500">Erro: {error}</div>;
    }

    if (!activityData) {
        return <div className="text-center p-10 text-primary-text">Atividade não encontrada.</div>;
    }

    // Passamos os dados da atividade existente para o componente de criação
    return <ActivityCreationPage existingActivity={activityData} />;
}

export default ActivityEditPage;
