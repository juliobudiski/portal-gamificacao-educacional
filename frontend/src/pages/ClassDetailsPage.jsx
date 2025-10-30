import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

import {
    FaChalkboardTeacher,
    FaBook,
    FaMedal,
    FaTrophy,
    FaInfoCircle,
    FaUserGraduate,
    FaChevronDown,
    FaChevronUp,
    FaUsers, FaClock, FaCheckCircle, FaTimesCircle, FaHourglassStart
} from "react-icons/fa";

// --- COMPONENTE INTERNO PARA O CARD DA ATIVIDADE ---
// Este componente agora gerencia seu próprio estado de expansão
function ActivityCard({ activity }) {
    const [isExpanded, setIsExpanded] = useState({
        description: false,
        gameElements: false,
        rewards: false,
    });
    // 1. Adicione o hook de navegação
    const navigate = useNavigate();

    const toggleSection = (section) => {
        setIsExpanded(prev => ({ ...prev, [section]: !prev[section] }));
    };

    const hasGameElements = activity.gameElements && activity.gameElements.selectedElements?.length > 0;
    const hasRewards = activity.rewardsOffered && activity.rewardsOffered.selectedRewards?.length > 0;

    const getStatus = () => {
        const now = new Date();
        const availableFrom = activity.availableFrom ? new Date(activity.availableFrom) : null;
        const expiresAt = activity.expiresAt ? new Date(activity.expiresAt) : null;

        if (expiresAt && now > expiresAt) {
            return { text: "Encerrada", color: "red", icon: <FaTimesCircle /> };
        }
        if (availableFrom && now < availableFrom) {
            return { text: "Em breve", color: "blue", icon: <FaHourglassStart /> };
        }
        return { text: "Disponível", color: "green", icon: <FaCheckCircle /> };
    };

    const status = getStatus();
    // A variável que decide se o botão funciona já está aqui!
    const isActionable = status.text === "Disponível";

    // 2. Crie a função para navegar
    const handleAccess = () => {
        if (isActionable) {
            navigate(`/activities/${activity.id}`);
        }
    };

    return (
        <div
            key={activity.id}
            className="bg-secondary-bg p-6 rounded-2xl shadow-2xl border border-[#4a525a] transition-all duration-300 hover:shadow-[0_10px_30px_rgba(105,232,203,0.15)] hover:border-[#69e8cb]/50 relative overflow-hidden flex flex-col"
        >
            {/* Decoração no topo do card */}
            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#ffbd30] to-[#9570d9]"></div>

            <div className="flex-grow">
                <h3 className="text-xl font-bold text-primary-text mb-3 flex items-center">
                    <span className="w-6 h-6 rounded-full bg-[#ffbd30] flex items-center justify-center mr-2 flex-shrink-0">
                        <FaBook className="text-xs text-[#2c3135]" />
                    </span>
                    {activity.title}
                </h3>

                {activity.areaKnowledge && (
                    <div className="flex items-center mb-3">
                        <span className="text-xs font-semibold px-2 py-1 bg-[#69e8cb]/20 text-[#69e8cb] rounded-full">
                            Área: {activity.areaKnowledge}
                        </span>
                    </div>
                )}

                {/* --- SEÇÃO DE STATUS E PRAZO --- */}
                <div className="flex items-center justify-between mb-4 text-sm">
                    <span className={`flex items-center gap-2 font-semibold px-2 py-1 rounded-full bg-${status.color}-500/20 text-${status.color}-400`}>
                        {status.icon}
                        {status.text}
                    </span>
                    {/* Exibe o prazo se a data de expiração existir, mostrando data e hora */}
                    {activity.expiresAt && (
                        <span className="flex items-center gap-2 text-secondary-text">
                            <FaClock />
                            Prazo: {new Date(activity.expiresAt).toLocaleString('pt-BR', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                            })}
                        </span>
                    )}
                </div>
                {/* --- FIM DA SEÇÃO --- */}

                {/* Seção de Descrição Expansível */}
                <div
                    className="text-secondary-text text-sm mb-4 pl-2 border-l-2 border-[#69e8cb] cursor-pointer"
                    onClick={() => toggleSection('description')}
                >
                    <div className="flex justify-between items-center">
                        <strong className="text-secondary-text">Descrição</strong>
                        {isExpanded.description ? <FaChevronUp /> : <FaChevronDown />}
                    </div>
                    {isExpanded.description && (
                        <p className="mt-2 transition-all duration-500 ease-in-out">
                            {activity.description}
                        </p>
                    )}
                </div>

                {/* Seção de Elementos de Jogo Expansível */}
                {hasGameElements && (
                    <div className="mt-4 mb-4">
                        <div
                            className="flex items-center justify-between mb-2 cursor-pointer"
                            onClick={() => toggleSection('gameElements')}
                        >
                            <div className="flex items-center">
                                <FaTrophy className="text-[#ffbd30] mr-2" />
                                <h4 className="font-semibold text-[#ffbd30]">Elementos de Jogo</h4>
                            </div>
                            {isExpanded.gameElements ? <FaChevronUp /> : <FaChevronDown />}
                        </div>
                        {isExpanded.gameElements && (
                            <div className="flex flex-wrap gap-2 mt-2 transition-all duration-500 ease-in-out">
                                {activity.gameElements.selectedElements.map((element, i) => (
                                    <span key={i} className="text-xs px-2 py-1 bg-[#9570d9]/20 text-[#9570d9] rounded-full">
                                        {element}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Seção de Recompensas Expansível */}
                {hasRewards && (
                    <div className="mt-4 mb-4">
                        <div
                            className="flex items-center justify-between mb-2 cursor-pointer"
                            onClick={() => toggleSection('rewards')}
                        >
                            <div className="flex items-center">
                                <FaMedal className="text-[#69e8cb] mr-2" />
                                <h4 className="font-semibold text-[#69e8cb]">Recompensas</h4>
                            </div>
                            {isExpanded.rewards ? <FaChevronUp /> : <FaChevronDown />}
                        </div>
                        {isExpanded.rewards && (
                            <div className="flex flex-wrap gap-2 mt-2 transition-all duration-500 ease-in-out">
                                {activity.rewardsOffered.selectedRewards.map((reward, i) => (
                                    <span key={i} className="text-xs px-2 py-1 bg-gradient-to-r from-[#ffbd30]/20 to-[#ff9d00]/20 text-[#ffbd30] rounded-full">
                                        {reward}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div className="mt-6 text-right border-t border-border-color pt-4">
                <button
                    onClick={handleAccess}
                    disabled={!isActionable}
                    className={`inline-block font-bold py-2 px-4 rounded-xl text-sm transition-all duration-300 transform hover:-translate-y-0.5 hover:shadow-lg ${isActionable
                            ? 'bg-gradient-to-r from-[#69e8cb] to-[#4dd1b3] text-[#2c3135] hover:from-[#4dd1b3] hover:to-[#69e8cb]'
                            : 'bg-red-800/50 text-red-300 cursor-not-allowed border border-red-500/50'
                        }`}
                >
                    {status.text === 'Encerrada' ? 'Prazo Encerrado' : (status.text === 'Em breve' ? 'Aguarde' : 'Ver Atividade')}
                </button>
            </div>
        </div>
    );
}


function ClassDetailsPage() {
    const { class_id } = useParams();
    const { user } = useContext(AuthContext);
    const [classDetails, setClassDetails] = useState(null);
    const [activities, setActivities] = useState([]);
    const [message, setMessage] = useState('');
    const [error, setError] = useState(''); // Estado para o erro
    const [isLoading, setIsLoading] = useState(true);
    const [students, setStudents] = useState([]);
    useEffect(() => {
        const fetchClassData = async () => {
            const token = user?.token;
            if (!token || !class_id) {
                setError('Acesso negado ou token/ID da turma ausente.');
                setIsLoading(false);
                return;
            }
            setMessage('');
            setError(''); // Limpa o erro anterior
            setIsLoading(true);

            try {
                // Busca detalhes da turma e atividades em paralelo para otimizar
                const [classResponse, activitiesResponse] = await Promise.all([
                    fetch(`${import.meta.env.VITE_API_URL}/api/classes/${class_id}`, {
                        headers: { 'Authorization': `Bearer ${token}` },
                    }),
                    fetch(`${import.meta.env.VITE_API_URL}/api/classes/${class_id}/activities`, {
                        headers: { 'Authorization': `Bearer ${token}` },
                    })
                ]);

                const classData = await classResponse.json();
                if (!classResponse.ok) throw new Error(classData.message || 'Erro ao carregar detalhes da turma.');

                const activitiesData = await activitiesResponse.json();
                if (!activitiesResponse.ok) throw new Error(activitiesData.message || 'Erro ao carregar atividades.');

                setClassDetails(classData);
                setActivities(activitiesData);
                setStudents(classData.students || []);

            } catch (err) {
                console.error('[ClassDetailsPage] Erro na requisição de dados da turma:', err);
                setError(err.message); // Define o estado de erro
            } finally {
                setIsLoading(false);
            }
        };

        if (user?.token) {
            fetchClassData();
        }
    }, [class_id, user?.token]);

    if (isLoading) {
        return <div className="container mx-auto p-4 text-center text-secondary-text"><p>Carregando detalhes da turma...</p></div>;
    }

    if (error && !classDetails) {
        return <div className="container mx-auto p-4 text-center text-red-400"><p>{error}</p></div>;
    }

    if (!classDetails) {
        return <div className="container mx-auto p-4 text-center text-secondary-text"><p>Nenhum detalhe de turma disponível.</p></div>;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br bg-primary-bg to-[#1a1e22] p-4">
            <div className="max-w-6xl mx-auto">
                {/* Cabeçalho com gradiente */}
                <div className="bg-gradient-to-r from-[#ffbd30] to-[#ff9d00] p-5 rounded-2xl shadow-2xl mb-8">
                    <h1 className="text-3xl md:text-4xl font-bold text-center text-[#2c3135]">
                        Detalhes da Turma: {classDetails.name}
                    </h1>
                </div>

                {/* Card de informações da turma */}
                <div className="bg-secondary-bg p-6 rounded-2xl shadow-2xl border border-[#4a525a] mb-8">
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

                            <p className="text-secondary-text mb-4 flex items-start">
                                <span className="w-8 h-8 rounded-full bg-[#69e8cb]/20 flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                                    <FaBook className="text-[#69e8cb] text-sm" />
                                </span>
                                <strong className="text-[#69e8cb] mr-2">Descrição:</strong>
                                <span className="text-secondary-text">{classDetails.description}</span>
                            </p>

                            <p className="text-secondary-text mb-4 flex items-start">
                                <span className="w-8 h-8 rounded-full bg-[#9570d9]/20 flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                                    <FaChalkboardTeacher className="text-[#9570d9] text-sm" />
                                </span>
                                <strong className="text-[#ffbd30] mr-2">Professor:</strong>
                                <span className="text-secondary-text">{classDetails.professor_name}</span>
                            </p>
                            {user?.role === 'aluno' && classDetails.enrollment_code && (
                                <div className="bg-primary-bg/50 p-4 rounded-xl border border-[#4a525a] mt-5">
                                    <p className="text-secondary-text flex items-center">
                                        <span className="w-8 h-8 rounded-full bg-[#ffbd30]/20 flex items-center justify-center mr-3 flex-shrink-0">
                                            <FaUserGraduate className="text-[#ffbd30]" />
                                        </span>
                                        <strong className="text-[#ffbd30] mr-2">Código de Inscrição:</strong>
                                    </p>
                                    <div className="mt-2 bg-primary-bg p-3 rounded-xl border border-[#4a525a]">
                                        <code className="font-mono text-lg text-[#69e8cb] tracking-wider">
                                            {classDetails.enrollment_code}
                                        </code>
                                    </div>
                                </div>
                            )}

                            {user?.role === 'professor' && (
                                <div className="bg-primary-bg/50 p-4 rounded-xl border border-[#4a525a] mt-5">
                                    <p className="text-secondary-text flex items-center">
                                        <span className="w-8 h-8 rounded-full bg-[#ffbd30]/20 flex items-center justify-center mr-3 flex-shrink-0">
                                            <FaUserGraduate className="text-[#ffbd30]" />
                                        </span>
                                        <strong className="text-[#ffbd30] mr-2">Código de Inscrição:</strong>
                                    </p>
                                    <div className="mt-2 bg-primary-bg p-3 rounded-xl border border-[#4a525a]">
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
                                <div className="relative bg-primary-bg/50 border border-[#4a525a] rounded-2xl p-6 text-center">
                                    <div className="w-20 h-20 mx-auto bg-gradient-to-br from-[#ffbd30] to-[#ff9d00] rounded-full flex items-center justify-center mb-4">
                                        <FaBook className="text-3xl text-[#2c3135]" />
                                    </div>
                                    <h3 className="text-xl font-bold text-[#69e8cb] mb-2">Atividades</h3>
                                    <p className="text-4xl font-bold text-primary-text">{activities.length}</p>
                                    <p className="text-secondary-text mt-2">atividades nesta turma</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                {/* --- SEÇÃO NOVA PARA LISTA DE ALUNOS --- */}
                <div className="mb-8">
                    <div className="flex items-center mb-6">
                        <div className="w-10 h-10 rounded-full bg-[#9570d9]/20 flex items-center justify-center mr-3">
                            <FaUsers className="text-[#9570d9]" />
                        </div>
                        <h2 className="text-2xl font-bold text-primary-text">
                            Colegas de Turma ({students.length})
                        </h2>
                    </div>
                    {students.length > 0 ? (
                        <div className="bg-secondary-bg p-6 rounded-2xl shadow-2xl border border-[#4a525a]">
                            <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                {students.map((student) => (
                                    <li key={student.id} className="bg-primary-bg p-3 rounded-lg flex items-center">
                                        <FaUserGraduate className="text-secondary-text mr-3" />
                                        <span className="text-secondary-text">{student.name}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ) : (
                        <p className="text-secondary-text">Nenhum aluno matriculado ainda.</p>
                    )}
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
                                <ActivityCard key={activity.id} activity={activity} />
                            ))}
                        </div>
                    ) : (
                        <div className="bg-secondary-bg p-10 rounded-2xl shadow-2xl border border-[#4a525a] text-center">
                            <div className="max-w-md mx-auto">
                                <div className="w-20 h-20 mx-auto bg-gradient-to-br from-[#9570d9] to-[#7a55c4] rounded-full flex items-center justify-center mb-5">
                                    <FaBook className="text-3xl text-primary-text" />
                                </div>
                                <h3 className="text-xl font-bold text-[#69e8cb] mb-2">
                                    Nenhuma atividade encontrada
                                </h3>
                                <p className="text-secondary-text">
                                    Esta turma ainda não tem atividades atribuídas.
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {message && (
                    <div className={`p-4 rounded-2xl text-center mb-8 ${message.includes('Erro') ? 'bg-red-500/20 border border-red-500 text-red-300' : 'bg-blue-500/20 border border-blue-500 text-blue-300'
                        }`}>
                        {message}
                    </div>
                )}
            </div>
        </div>
    );
}

export default ClassDetailsPage;
