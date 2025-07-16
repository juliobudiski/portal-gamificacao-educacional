import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

function ClassDetailsPage() {
    const { class_id } = useParams();
    const { user } = useContext(AuthContext); // Removido 'authToken'
    const [classDetails, setClassDetails] = useState(null);
    const [activities, setActivities] = useState([]);
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        console.log('[ClassDetailsPage] Componente montado para turma ID:', class_id);
        return () => {
            console.log('[ClassDetailsPage] Componente desmontado.');
        };
    }, []);

    useEffect(() => {
        const fetchClassData = async () => {
            console.log('[ClassDetailsPage] Iniciando busca de dados da turma ID:', class_id);
            const token = user?.token; // Acessa o token via user.token
            if (!token || !class_id) {
                setMessage('Acesso negado ou token/ID da turma ausente.');
                setIsLoading(false);
                console.warn('[ClassDetailsPage] Token ou ID da turma não disponível, não buscando dados.');
                return;
            }
            setMessage('');
            setIsLoading(true);

            try {
                // Fetch class details
                console.log('[ClassDetailsPage] Buscando detalhes da turma...');
                const classResponse = await fetch(`http://127.0.0.1:5000/api/classes/${class_id}`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`, // Usando user.token
                    },
                });
                const classData = await classResponse.json();
                console.log('[ClassDetailsPage] Resposta bruta API (detalhes turma):', classResponse);
                console.log('[ClassDetailsPage] Dados API (detalhes turma):', classData);

                if (classResponse.ok) {
                    setClassDetails(classData);
                    console.log('[ClassDetailsPage] Detalhes da turma carregados:', classData);

                    // Fetch activities for this class
                    console.log('[ClassDetailsPage] Buscando atividades para esta turma...');
                    const activitiesResponse = await fetch(`http://127.0.0.1:5000/api/classes/${class_id}/activities`, {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`, // Usando user.token
                        },
                    });
                    const activitiesData = await activitiesResponse.json();
                    console.log('[ClassDetailsPage] Resposta bruta API (atividades turma):', activitiesResponse);
                    console.log('[ClassDetailsPage] Dados API (atividades turma):', activitiesData);

                    if (activitiesResponse.ok) {
                        setActivities(activitiesData);
                        console.log('[ClassDetailsPage] Atividades da turma carregadas:', activitiesData);
                    } else {
                        setMessage(activitiesData.message || 'Erro ao carregar atividades.');
                        console.error('[ClassDetailsPage] Erro ao carregar atividades:', activitiesData.message);
                    }
                } else {
                    setMessage(classData.message || 'Erro ao carregar detalhes da turma.');
                    console.error('[ClassDetailsPage] Erro ao carregar detalhes da turma:', classData.message);
                }
            } catch (error) {
                console.error('[ClassDetailsPage] Erro na requisição de dados da turma:', error);
                setMessage('Erro na comunicação com o servidor.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchClassData();
    }, [class_id, user?.token]);

    if (isLoading) {
        return <div className="container mx-auto p-4 text-center text-gray-600"><p>Carregando detalhes da turma...</p></div>;
    }

    if (message && !classDetails) {
        return <div className="container mx-auto p-4 text-center text-red-600"><p>{message}</p></div>;
    }

    if (!classDetails) {
        return <div className="container mx-auto p-4 text-center text-gray-500"><p>Nenhum detalhe de turma disponível.</p></div>;
    }

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-3xl font-bold mb-4 text-center text-gray-800">Detalhes da Turma: {classDetails.name}</h1>
            <div className="bg-white p-6 rounded-lg shadow-xl border border-gray-200 mb-6">
                <p className="text-gray-700 mb-2"><strong>Descrição:</strong> {classDetails.description}</p>
                <p className="text-gray-700 mb-2"><strong>Professor:</strong> {classDetails.professor_name}</p>
                {user?.role === 'professor' && (
                    <p className="text-gray-700 mb-2">
                        <strong>Código de Inscrição:</strong> <span className="font-mono bg-gray-100 p-1 rounded text-blue-800">{classDetails.enrollment_code}</span>
                    </p>
                )}
            </div>

            <h2 className="text-2xl font-semibold mb-4 text-gray-800">Atividades da Turma</h2>
            {activities.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {activities.map((activity) => (
                        <div key={activity.id} className="bg-white p-6 rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition duration-200 ease-in-out transform hover:-translate-y-0.5">
                            <h3 className="text-xl font-semibold mb-2 text-gray-900">{activity.title}</h3>
                            <p className="text-gray-600 text-sm mb-3">{activity.description}</p>
                            {activity.areaKnowledge && <p className="text-gray-700 text-xs mb-2">Área: {activity.areaKnowledge}</p>}
                            
                            {/* Renderização dos elementos de gamificação dinamicamente */}
                            {activity.gameElements && Object.keys(activity.gameElements).length > 0 && (
                                <div className="mt-3 text-sm text-gray-700">
                                    <h4 className="font-semibold text-gray-800">Elementos de Jogo:</h4>
                                    {activity.gameElements.selectedElements?.length > 0 && (
                                        <ul className="list-disc list-inside ml-2 text-gray-600">
                                            {activity.gameElements.selectedElements.map((element, i) => (
                                                <li key={i}>{element}</li>
                                            ))}
                                        </ul>
                                    )}
                                    {activity.gameElements.narrativeTitle && (
                                        <p className="mt-1">
                                            **Narrativa:** <span className="italic">"{activity.gameElements.narrativeContent}"</span>
                                        </p>
                                    )}
                                    {activity.gameElements.otherElement && (
                                        <p className="mt-1">Outros: {activity.gameElements.otherElement}</p>
                                    )}
                                </div>
                            )}
                            {activity.rewardsOffered && activity.rewardsOffered.selectedRewards?.length > 0 && (
                                <div className="mt-3 text-sm text-gray-700">
                                    <h4 className="font-semibold text-gray-800">Recompensas Oferecidas:</h4>
                                    <ul className="list-disc list-inside ml-2 text-gray-600">
                                        {activity.rewardsOffered.selectedRewards.map((reward, i) => (
                                            <li key={i}>{reward}</li>
                                        ))}
                                    </ul>
                                    {activity.rewardsOffered.otherReward && (
                                        <p className="mt-1">Outras: {activity.rewardsOffered.otherReward}</p>
                                    )}
                                </div>
                            )}

                            <div className="text-right mt-4">
                                <Link to={`/activities/${activity.id}`} className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-1 px-3 rounded text-sm transition duration-200 ease-in-out transform hover:scale-105">
                                    Ver Atividade
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-center text-gray-500">Nenhuma atividade atribuída a esta turma ainda.</p>
            )}
            {message && <p className="text-center text-red-600 mt-4">{message}</p>}
        </div>
    );
}

export default ClassDetailsPage;