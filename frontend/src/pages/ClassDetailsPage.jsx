import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

import { 
  FaChalkboardTeacher, 
  FaBook, 
  FaMedal, 
  FaTrophy, 
  FaInfoCircle, 
  FaUserGraduate
} from "react-icons/fa";

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
            const token = user?.token;
            if (!token || !class_id) {
                setMessage('Acesso negado ou token/ID da turma ausente.');
                setIsLoading(false);
                return;
            }
            setMessage('');
            setIsLoading(true);

            try {
                // --- ETAPA 1: BUSCAR DETALHES DA TURMA ---
                console.log('[ClassDetailsPage] Buscando detalhes da turma...');
                const classResponse = await fetch(`http://127.0.0.1:5000/api/classes/${class_id}`, {
                    headers: { 'Authorization': `Bearer ${token}` },
                });
                const classData = await classResponse.json();

                if (!classResponse.ok) {
                    throw new Error(classData.message || 'Erro ao carregar detalhes da turma.');
                }
                
                setClassDetails(classData);
                console.log('[ClassDetailsPage] Detalhes da turma carregados:', classData);

                // --- ETAPA 2: BUSCAR ATIVIDADES DA TURMA (CORREÇÃO APLICADA AQUI) ---
                console.log('[ClassDetailsPage] Buscando atividades para esta turma...');
                // A URL foi corrigida para o endpoint correto de atividades
                const activitiesResponse = await fetch(`http://127.0.0.1:5000/api/classes/${class_id}/activities`, {
                    headers: { 'Authorization': `Bearer ${token}` },
                });
                const activitiesData = await activitiesResponse.json();
                
                if (!activitiesResponse.ok) {
                    throw new Error(activitiesData.message || 'Erro ao carregar atividades.');
                }

                setActivities(activitiesData);
                console.log('[ClassDetailsPage] Atividades da turma carregadas:', activitiesData);

            } catch (error) {
                console.error('[ClassDetailsPage] Erro na requisição de dados da turma:', error);
                setMessage(error.message);
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
        <div className="min-h-screen bg-gradient-to-br from-[#2c3135] to-[#1a1e22] p-4">
            <div className="max-w-6xl mx-auto">
                {/* Cabeçalho com gradiente */}
                <div className="bg-gradient-to-r from-[#ffbd30] to-[#ff9d00] p-5 rounded-2xl shadow-2xl mb-8">
                    <h1 className="text-3xl md:text-4xl font-bold text-center text-[#2c3135]">
                        Detalhes da Turma: {classDetails.name}
                    </h1>
                </div>

                {/* Card de informações da turma */}
                <div className="bg-[#3a4046] p-6 rounded-2xl shadow-2xl border border-[#4a525a] mb-8">
                    <div className="flex flex-col md:flex-row gap-6">
                        <div className="flex-1">
                            <div className="flex items-center mb-4">
                                <div className="w-10 h-10 rounded-full bg-[#ffbd30]/20 flex items-center justify-center mr-3">
                                    <FaInfoCircle className="text-[#ffbd30]" />
                                </div>
                                <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#69e8cb] to-[#9570d9]">
                                    Informações da Turma
                                </h2>
                            </div>
                            
                            <p className="text-gray-200 mb-4 flex items-start">
                                <span className="w-8 h-8 rounded-full bg-[#69e8cb]/20 flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                                    <FaBook className="text-[#69e8cb] text-sm" />
                                </span>
                                <strong className="text-[#69e8cb] mr-2">Descrição:</strong> 
                                <span className="text-gray-300">{classDetails.description}</span>
                            </p>
                            
                            <p className="text-gray-200 mb-4 flex items-start">
                                <span className="w-8 h-8 rounded-full bg-[#9570d9]/20 flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                                    <FaChalkboardTeacher className="text-[#9570d9] text-sm" />
                                </span>
                                <strong className="text-[#ffbd30] mr-2">Professor:</strong> 
                                <span className="text-gray-300">{classDetails.professor_name}</span>
                            </p>
                            
                            {user?.role === 'professor' && (
                                <div className="bg-[#2c3135]/50 p-4 rounded-xl border border-[#4a525a] mt-5">
                                    <p className="text-gray-200 flex items-center">
                                        <span className="w-8 h-8 rounded-full bg-[#ffbd30]/20 flex items-center justify-center mr-3 flex-shrink-0">
                                            <FaUserGraduate className="text-[#ffbd30]" />
                                        </span>
                                        <strong className="text-[#ffbd30] mr-2">Código de Inscrição:</strong>
                                    </p>
                                    <div className="mt-2 bg-[#2c3135] p-3 rounded-xl border border-[#4a525a]">
                                        <code className="font-mono text-lg text-[#69e8cb] tracking-wider">
                                            {classDetails.enrollment_code}
                                        </code>
                                    </div>
                                </div>
                            )}
                        </div>
                        
                        <div className="flex-1 flex items-center justify-center">
                            <div className="relative w-full max-w-xs">
                                <div className="absolute inset-0 bg-gradient-to-br from-[#ffbd30]/20 to-[#9570d9]/20 rounded-2xl blur-xl opacity-70"></div>
                                <div className="relative bg-[#2c3135]/50 border border-[#4a525a] rounded-2xl p-6 text-center">
                                    <div className="w-20 h-20 mx-auto bg-gradient-to-br from-[#ffbd30] to-[#ff9d00] rounded-full flex items-center justify-center mb-4">
                                        <FaBook className="text-3xl text-[#2c3135]" />
                                    </div>
                                    <h3 className="text-xl font-bold text-[#69e8cb] mb-2">Atividades</h3>
                                    <p className="text-4xl font-bold text-white">{activities.length}</p>
                                    <p className="text-gray-400 mt-2">atividades nesta turma</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Seção de Atividades */}
                <div className="mb-8">
                    <div className="flex items-center mb-6">
                        <div className="w-10 h-10 rounded-full bg-[#69e8cb]/20 flex items-center justify-center mr-3">
                            <FaMedal className="text-[#69e8cb]" />
                        </div>
                        <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#ffbd30] to-[#ff9d00]">
                            Atividades da Turma
                        </h2>
                    </div>
                    
                    {activities.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {activities.map((activity) => (
                                <div 
                                    key={activity.id} 
                                    className="bg-[#3a4046] p-6 rounded-2xl shadow-2xl border border-[#4a525a] transition-all duration-300 hover:shadow-[0_10px_30px_rgba(105,232,203,0.15)] hover:border-[#69e8cb]/50 relative overflow-hidden"
                                >
                                    {/* Decoração no topo do card */}
                                    <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#ffbd30] to-[#9570d9]"></div>
                                    
                                    <h3 className="text-xl font-bold text-white mb-3 flex items-center">
                                        <span className="w-6 h-6 rounded-full bg-[#ffbd30] flex items-center justify-center mr-2">
                                            <FaBook className="text-xs text-[#2c3135]" />
                                        </span>
                                        {activity.title}
                                    </h3>
                                    
                                    <p className="text-gray-300 text-sm mb-4 pl-2 border-l-2 border-[#69e8cb]">
                                        {activity.description}
                                    </p>
                                    
                                    {activity.areaKnowledge && (
                                        <div className="flex items-center mb-3">
                                            <span className="text-xs font-semibold px-2 py-1 bg-[#69e8cb]/20 text-[#69e8cb] rounded-full">
                                                Área: {activity.areaKnowledge}
                                            </span>
                                        </div>
                                    )}
                                    
                                    {/* Elementos de Jogo */}
                                    {activity.gameElements && Object.keys(activity.gameElements).length > 0 && (
                                        <div className="mt-4 mb-4">
                                            <div className="flex items-center mb-2">
                                                <FaTrophy className="text-[#ffbd30] mr-2" />
                                                <h4 className="font-semibold text-[#ffbd30]">Elementos de Jogo</h4>
                                            </div>
                                            {activity.gameElements.selectedElements?.length > 0 && (
                                                <div className="flex flex-wrap gap-2">
                                                    {activity.gameElements.selectedElements.map((element, i) => (
                                                        <span 
                                                            key={i} 
                                                            className="text-xs px-2 py-1 bg-[#9570d9]/20 text-[#9570d9] rounded-full"
                                                        >
                                                            {element}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                            {activity.gameElements.narrativeTitle && (
                                                <p className="mt-2 text-sm text-gray-300 italic">
                                                    "{activity.gameElements.narrativeContent}"
                                                </p>
                                            )}
                                        </div>
                                    )}
                                    
                                    {/* Recompensas */}
                                    {activity.rewardsOffered && activity.rewardsOffered.selectedRewards?.length > 0 && (
                                        <div className="mt-4 mb-4">
                                            <div className="flex items-center mb-2">
                                                <FaMedal className="text-[#69e8cb] mr-2" />
                                                <h4 className="font-semibold text-[#69e8cb]">Recompensas</h4>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {activity.rewardsOffered.selectedRewards.map((reward, i) => (
                                                    <span 
                                                        key={i} 
                                                        className="text-xs px-2 py-1 bg-gradient-to-r from-[#ffbd30]/20 to-[#ff9d00]/20 text-[#ffbd30] rounded-full"
                                                    >
                                                        {reward}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    
                                    <div className="mt-6 text-right">
                                        <Link 
                                            to={`/activities/${activity.id}`} 
                                            className="inline-block bg-gradient-to-r from-[#69e8cb] to-[#4dd1b3] hover:from-[#4dd1b3] hover:to-[#69e8cb] text-[#2c3135] font-bold py-2 px-4 rounded-xl text-sm transition-all duration-300 transform hover:-translate-y-0.5 hover:shadow-lg"
                                        >
                                            Ver Atividade
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-[#3a4046] p-10 rounded-2xl shadow-2xl border border-[#4a525a] text-center">
                            <div className="max-w-md mx-auto">
                                <div className="w-20 h-20 mx-auto bg-gradient-to-br from-[#9570d9] to-[#7a55c4] rounded-full flex items-center justify-center mb-5">
                                    <FaBook className="text-3xl text-white" />
                                </div>
                                <h3 className="text-xl font-bold text-[#69e8cb] mb-2">
                                    Nenhuma atividade encontrada
                                </h3>
                                <p className="text-gray-400">
                                    Esta turma ainda não tem atividades atribuídas.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
                
                {message && (
                    <div className={`p-4 rounded-2xl text-center mb-8 ${
                        message.includes('Erro') ? 'bg-red-500/20 border border-red-500 text-red-300' : 'bg-blue-500/20 border border-blue-500 text-blue-300'
                    }`}>
                        {message}
                    </div>
                )}
            </div>
        </div>
    );
}

export default ClassDetailsPage;