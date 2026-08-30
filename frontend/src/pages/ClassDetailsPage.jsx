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
    FaUsers, FaClock, FaCheckCircle, FaTimesCircle, FaHourglassStart, FaShieldAlt
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
            // --- CORREÇÃO: Borda ciente do tema ---
            className="bg-secondary-bg p-6 rounded-2xl shadow-2xl border border-border-color transition-all duration-300 hover:shadow-[0_10px_30px_rgba(105,232,203,0.15)] hover:border-accent-teal/50 relative overflow-hidden flex flex-col"
        >
            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-accent-yellow to-accent-purple"></div>

            <div className="flex-grow">
                <h3 className="text-xl font-bold text-primary-text mb-3 flex items-center">
                    <span className="w-6 h-6 rounded-full bg-accent-yellow flex items-center justify-center mr-2 flex-shrink-0">
                        <FaBook className="text-xs text-gray-900" />
                    </span>
                    {activity.title}
                </h3>

                {activity.areaKnowledge && (
                    <div className="flex items-center mb-3">
                        <span className="text-xs font-semibold px-2 py-1 bg-accent-teal/20 text-accent-teal rounded-full">
                            Área: {activity.areaKnowledge}
                        </span>
                    </div>
                )}

                {/* --- SEÇÃO DE STATUS E PRAZO (Atualizada) --- */}
                <div className="flex items-center justify-between mb-4 text-sm">
                    {/* --- CORREÇÃO: Classe de status ciente do tema --- */}
                    <span className={`flex items-center gap-2 font-semibold px-2 py-1 rounded-full ${status.className}`}>
                        {status.icon}
                        {status.text}
                    </span>
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

                {/* Seção de Descrição Expansível */}
                <div
                    className="text-secondary-text text-sm mb-4 pl-2 border-l-2 border-accent-teal cursor-pointer"
                    onClick={() => toggleSection('description')}
                >
                    <div className="flex justify-between items-center">
                        <strong className="text-primary-text">Descrição</strong>
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
                                <FaTrophy className="text-accent-yellow mr-2" />
                                <h4 className="font-semibold text-accent-yellow">Elementos de Jogo</h4>
                            </div>
                            {isExpanded.gameElements ? <FaChevronUp /> : <FaChevronDown />}
                        </div>
                        {isExpanded.gameElements && (
                            <div className="flex flex-wrap gap-2 mt-2 transition-all duration-500 ease-in-out">
                                {activity.gameElements.selectedElements.map((element, i) => (
                                    <span key={i} className="text-xs px-2 py-1 bg-accent-purple/20 text-accent-purple rounded-full">
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
                                <FaMedal className="text-accent-teal mr-2" />
                                <h4 className="font-semibold text-accent-teal">Recompensas</h4>
                            </div>
                            {isExpanded.rewards ? <FaChevronUp /> : <FaChevronDown />}
                        </div>
                        {isExpanded.rewards && (
                            <div className="flex flex-wrap gap-2 mt-2 transition-all duration-500 ease-in-out">
                                {activity.rewardsOffered.selectedRewards.map((reward, i) => (
                                    <span key={i} className="text-xs px-2 py-1 bg-gradient-to-r from-accent-yellow/20 to-accent-yellow/20 text-accent-yellow rounded-full">
                                        {reward}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div className="mt-6 text-right border-t border-border-color pt-4">
                {/* --- CORREÇÃO: Botão ciente do tema --- */}
                <button
                    onClick={handleAccess}
                    disabled={!isActionable}
                    className={`inline-block font-bold py-2 px-4 rounded-xl text-sm transition-all duration-300 transform hover:-translate-y-0.5 hover:shadow-lg ${isActionable
                        ? 'bg-gradient-to-r from-accent-teal to-accent-teal/80 text-gray-900 hover:from-accent-teal/80 hover:to-accent-teal'
                        : 'bg-danger-bg text-danger cursor-not-allowed border border-danger/50'
                        }`}
                >
                    {status.text === 'Encerrada' ? 'Prazo Encerrado' : (status.text === 'Em breve' ? 'Aguarde' : 'Ver Atividade')}
                </button>
            </div>
        </div>
    );
}


/**
 * Componente ClassDetailsPage
 * 
 * Visualização detalhada de uma turma específica, mostrando métricas, ranking e atividades associadas.
 */
function ClassDetailsPage() {
    const { class_id } = useParams();
    const { user } = useContext(AuthContext);
    const [classDetails, setClassDetails] = useState(null);
    const [activities, setActivities] = useState([]);
    const [message, setMessage] = useState('');
    const [error, setError] = useState(''); // Estado para o erro
    const [isLoading, setIsLoading] = useState(true);
    const [students, setStudents] = useState([]);
    const [teams, setTeams] = useState([]);

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
                setTeams(classData.teams || []);

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
                <div className="bg-gradient-to-r from-accent-yellow to-[#ff9d00] p-5 rounded-2xl shadow-2xl mb-8">
                    <h1 className="text-3xl md:text-4xl font-bold text-center text-gray-900">
                        Detalhes da Turma: {classDetails.name}
                    </h1>
                </div>

                {/* --- CORREÇÃO: Borda ciente do tema --- */}
                <div className="bg-secondary-bg p-6 rounded-2xl shadow-2xl border border-border-color mb-8">
                    <div className="flex flex-col md:flex-row gap-6">
                        <div className="flex-1">
                            <div className="flex items-center mb-4">
                                <div className="w-10 h-10 rounded-full bg-accent-yellow/20 flex items-center justify-center mr-3">
                                    <FaInfoCircle className="text-accent-yellow" />
                                </div>
                                <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-accent-teal to-accent-purple">
                                    Informações da Turma
                                </h2>
                            </div>

                            <p className="text-secondary-text mb-4 flex items-start">
                                <span className="w-8 h-8 rounded-full bg-accent-teal/20 flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                                    <FaBook className="text-accent-teal text-sm" />
                                </span>
                                <strong className="text-accent-teal mr-2">Descrição:</strong>
                                <span className="text-secondary-text">{classDetails.description}</span>
                            </p>

                            <p className="text-secondary-text mb-4 flex items-start">
                                <span className="w-8 h-8 rounded-full bg-accent-purple/20 flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                                    <FaChalkboardTeacher className="text-accent-purple text-sm" />
                                </span>
                                <strong className="text-accent-yellow mr-2">Professor:</strong>
                                <span className="text-secondary-text">{classDetails.professor_name}</span>
                            </p>
                            {user?.role === 'aluno' && classDetails.enrollment_code && (
                                <div className="bg-primary-bg/50 p-4 rounded-xl border border-border-color mt-5">
                                    <p className="text-secondary-text flex items-center">
                                        <span className="w-8 h-8 rounded-full bg-accent-yellow/20 flex items-center justify-center mr-3 flex-shrink-0">
                                            <FaUserGraduate className="text-accent-yellow" />
                                        </span>
                                        <strong className="text-accent-yellow mr-2">Código de Inscrição:</strong>
                                    </p>
                                    <div className="mt-2 bg-primary-bg p-3 rounded-xl border border-border-color">
                                        {/* --- CORREÇÃO: Código ciente do tema --- */}
                                        <code className="font-mono text-lg text-accent-teal tracking-wider">
                                            {classDetails.enrollment_code}
                                        </code>
                                    </div>
                                </div>
                            )}

                            {user?.role === 'professor' && (
                                <div className="bg-primary-bg/50 p-4 rounded-xl border border-border-color mt-5">
                                    <p className="text-secondary-text flex items-center">
                                        <span className="w-8 h-8 rounded-full bg-accent-yellow/20 flex items-center justify-center mr-3 flex-shrink-0">
                                            <FaUserGraduate className="text-accent-yellow" />
                                        </span>
                                        <strong className="text-accent-yellow mr-2">Código de Inscrição:</strong>
                                    </p>
                                    <div className="mt-2 bg-primary-bg p-3 rounded-xl border border-border-color">
                                        {/* --- CORREÇÃO: Código ciente do tema --- */}
                                        <code className="font-mono text-lg text-accent-teal tracking-wider">
                                            {classDetails.enrollment_code}
                                        </code>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex-1 flex items-center justify-center">
                            <div className="relative w-full max-w-xs">
                                <div className="absolute inset-0 bg-gradient-to-br from-accent-yellow/20 to-accent-purple/20 rounded-2xl blur-xl opacity-70"></div>
                                <div className="relative bg-primary-bg/50 border border-border-color rounded-2xl p-6 text-center">
                                    <div className="w-20 h-20 mx-auto bg-gradient-to-br from-accent-yellow to-[#ff9d00] rounded-full flex items-center justify-center mb-4">
                                        <FaBook className="text-3xl text-gray-900" />
                                    </div>
                                    <h3 className="text-xl font-bold text-accent-teal mb-2">Atividades</h3>
                                    <p className="text-4xl font-bold text-primary-text">{activities.length}</p>
                                    <p className="text-secondary-text mt-2">atividades nesta turma</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- SEÇÃO NOVA: CASAS DA TURMA (EQUIPES) --- */}
                {teams.length > 0 && (
                    <div className="mb-8 animate-fade-in">
                        <div className="flex items-center mb-6">
                            <div className="w-10 h-10 rounded-full bg-accent-purple/20 flex items-center justify-center mr-3">
                                <FaShieldAlt className="text-accent-purple" />
                            </div>
                            <h2 className="text-2xl font-bold text-primary-text">
                                Casas da Turma
                            </h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {teams.map((team, index) => (
                                <div
                                    key={team.id}
                                    className="bg-secondary-bg rounded-xl border border-border-color shadow-lg overflow-hidden hover:border-accent-purple transition-all duration-300"
                                >
                                    {/* Header da Casa */}
                                    <div className={`p-4 border-b border-border-color bg-gradient-to-r ${index % 2 === 0 ? 'from-purple-900/40 to-blue-900/40' : 'from-blue-900/40 to-teal-900/40'}`}>
                                        <h3 className="font-bold text-lg text-white flex items-center justify-center gap-2">
                                            <FaShieldAlt className="opacity-50" />
                                            {team.name}
                                        </h3>
                                    </div>

                                    {/* Lista de Membros */}
                                    <div className="p-4">
                                        <p className="text-xs text-secondary-text mb-3 font-bold uppercase tracking-wider">
                                            Membros ({team.members.length})
                                        </p>
                                        <div className="flex flex-col gap-2 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
                                            {team.members.length > 0 ? (
                                                team.members.map(member => (
                                                    <div key={member.id} className="flex items-center gap-2 bg-primary-bg/50 p-2 rounded-lg">
                                                        <img
                                                            src={member.avatar}
                                                            alt={member.name}
                                                            className="w-6 h-6 rounded-full border border-border-color object-cover"
                                                        />
                                                        <span className="text-sm text-primary-text truncate">{member.name}</span>
                                                    </div>
                                                ))
                                            ) : (
                                                <p className="text-sm text-gray-500 italic text-center py-2">Casa vazia</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}


                {/* --- SEÇÃO NOVA PARA LISTA DE ALUNOS --- */}
                <div className="mb-8">
                    <div className="flex items-center mb-6">
                        <div className="w-10 h-10 rounded-full bg-accent-purple/20 flex items-center justify-center mr-3">
                            <FaUsers className="text-accent-purple" />
                        </div>
                        <h2 className="text-2xl font-bold text-primary-text">
                            Colegas de Turma ({students.length})
                        </h2>
                    </div>
                    {students.length > 0 ? (
                        <div className="bg-secondary-bg p-6 rounded-2xl shadow-2xl border border-border-color">
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
                        <div className="w-10 h-10 rounded-full bg-accent-teal/20 flex items-center justify-center mr-3">
                            <FaMedal className="text-accent-teal" />
                        </div>
                        <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-accent-yellow to-[#ff9d00]">
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
                        <div className="bg-secondary-bg p-10 rounded-2xl shadow-2xl border border-border-color text-center">
                            <div className="max-w-md mx-auto">
                                <div className="w-20 h-20 mx-auto bg-gradient-to-br from-accent-purple to-[#7a55c4] rounded-full flex items-center justify-center mb-5">
                                    <FaBook className="text-3xl text-primary-text" />
                                </div>
                                <h3 className="text-xl font-bold text-accent-teal mb-2">
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
                    <div className={`p-4 rounded-2xl text-center mb-8 ${message.includes('Erro') ? 'bg-danger-bg border border-danger text-danger' : 'bg-info-bg border border-info text-info'
                        }`}>
                        {message}
                    </div>
                )}
            </div>
        </div>
    );
}

export default ClassDetailsPage;