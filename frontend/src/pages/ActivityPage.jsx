// frontend/src/pages/ActivityPage.jsx

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

const ActivityPage = () => {
    const { activityId } = useParams();
    const [activity, setActivity] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchActivity = async () => {
            try {
                // Busque o token de autenticação do localStorage ou de onde ele estiver salvo
                const token = localStorage.getItem('token'); 
                const response = await axios.get(`/api/activities/${activityId}`, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });
                setActivity(response.data);
            } catch (err) {
                setError('Não foi possível carregar os detalhes da atividade.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchActivity();
    }, [activityId]);

    if (loading) {
        return <div>Carregando atividade...</div>;
    }

    if (error) {
        return <div>{error}</div>;
    }

    if (!activity) {
        return <div>Atividade não encontrada.</div>;
    }

    return (
        <div className="container">
            <h1>{activity.title}</h1>
            <p>{activity.description}</p>
            {/* Aqui você pode renderizar o restante dos detalhes da atividade,
                como o tipo, data de entrega, etc. */}
        </div>
    );
};

export default ActivityPage;