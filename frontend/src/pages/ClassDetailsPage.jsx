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
    FaUsers, FaClock, FaCheckCircle, FaTimesCircle, FaHourglassStart, FaShieldAlt, FaArrowLeft
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
        <div className="min-h-screen relative overflow-hidden bg-primary-bg p-4 sm:p-6 lg:p-8 transition-colors duration-300">
            {/* Background Animado (Blobs) */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] rounded-full bg-accent-teal/10 blur-[120px] animate-blob"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] rounded-full bg-accent-purple/10 blur-[120px] animate-blob animation-delay-2000"></div>
            </div>

            <div className="max-w-7xl mx-auto relative z-10 animate-fade-in">
                <button 
                    onClick={() => navigate(-1)} 
                    className="group mb-6 flex items-center gap-2 text-secondary-text hover:text-accent-teal transition-colors font-bold uppercase tracking-widest text-sm bg-secondary-bg/50 px-4 py-2 rounded-full border border-border-color backdrop-blur-sm w-fit"
                >
                    <FaArrowLeft className="group-hover:-translate-x-1 transition-transform" />
                    Voltar
                </button>

                {/* Cabeçalho da Turma */}
                <div className="bg-gradient-to-r from-accent-teal/20 via-accent-purple/20 to-accent-yellow/20 p-8 rounded-3xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] mb-8 border border-border-color backdrop-blur-md relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-[80px] -mt-20 -mr-20"></div>
                    <h1 className="text-3xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-accent-teal to-accent-yellow mb-2 relative z-10">
                        {classDetails.name}
                    </h1>
                    <p className="text-secondary-text font-medium text-lg relative z-10 max-w-2xl">
                        {classDetails.description}
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                    {/* Painel de Informações */}
                    <div className="bg-secondary-bg/80 backdrop-blur-md p-6 rounded-2xl shadow-xl border border-border-color lg:col-span-2">
                        <div className="flex items-center mb-6">
                            <div className="w-12 h-12 rounded-xl bg-accent-teal/20 flex items-center justify-center mr-4 shadow-inner">
                                <FaInfoCircle className="text-accent-teal text-xl" />
                            </div>
                            <h2 className="text-2xl font-bold text-primary-text">
                                Detalhes
                            </h2>
                        </div>

                        <div className="space-y-6">
                            <div className="flex items-start gap-4 p-4 rounded-xl bg-primary-bg/50 border border-border-color/50 transition-colors hover:border-accent-purple/50">
                                <div className="w-10 h-10 rounded-full bg-accent-purple/20 flex items-center justify-center flex-shrink-0">
                                    <FaChalkboardTeacher className="text-accent-purple" />
                                </div>
                                <div>
                                    <p className="text-sm text-secondary-text font-semibold uppercase tracking-wider mb-1">Professor Responsável</p>
                                    <p className="text-lg font-bold text-primary-text">{classDetails.professor_name}</p>
                                </div>
                            </div>

                            {classDetails.enrollment_code && (
                                <div className="flex items-start gap-4 p-4 rounded-xl bg-primary-bg/50 border border-border-color/50 transition-colors hover:border-accent-yellow/50">
                                    <div className="w-10 h-10 rounded-full bg-accent-yellow/20 flex items-center justify-center flex-shrink-0">
                                        <FaUserGraduate className="text-accent-yellow" />
                                    </div>
                                    <div className="w-full">
                                        <p className="text-sm text-secondary-text font-semibold uppercase tracking-wider mb-1">Código de Inscrição</p>
                                        <div className="flex items-center justify-between bg-secondary-bg p-3 rounded-lg border border-border-color mt-2">
                                            <code className="font-mono text-xl font-bold text-accent-yellow tracking-widest">
                                                {classDetails.enrollment_code}
                                            </code>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Estatísticas Rápidas */}
                    <div className="bg-secondary-bg/80 backdrop-blur-md border border-border-color rounded-2xl p-6 shadow-xl flex flex-col justify-center items-center text-center relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-br from-accent-yellow/10 to-accent-purple/10 opacity-50 group-hover:opacity-100 transition-opacity duration-500"></div>
                        <div className="relative z-10 w-full space-y-6">
                            <div className="bg-primary-bg/80 p-6 rounded-2xl border border-border-color/50 shadow-inner">
                                <div className="w-16 h-16 mx-auto bg-gradient-to-br from-accent-yellow to-[#ff9d00] rounded-full flex items-center justify-center mb-4 shadow-lg transform group-hover:scale-110 transition-transform duration-300">
                                    <FaBook className="text-2xl text-gray-900" />
                                </div>
                                <h3 className="text-lg font-bold text-secondary-text mb-1 uppercase tracking-wider">Atividades</h3>
                                <p className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-accent-teal to-accent-yellow">{activities.length}</p>
                            </div>
                            <div className="bg-primary-bg/80 p-4 rounded-xl border border-border-color/50 shadow-inner flex justify-around items-center">
                                <div>
                                    <p className="text-xs text-secondary-text uppercase font-bold">Alunos</p>
                                    <p className="text-xl font-bold text-primary-text">{students.length}</p>
                                </div>
                                <div className="w-px h-8 bg-border-color"></div>
                                <div>
                                    <p className="text-xs text-secondary-text uppercase font-bold">Equipes</p>
                                    <p className="text-xl font-bold text-primary-text">{teams.length}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- SEÇÃO: CASAS DA TURMA (EQUIPES) --- */}
                {teams.length > 0 && (
                    <div className="mb-12 animate-fade-in">
                        <div className="flex items-center mb-6">
                            <div className="w-12 h-12 rounded-xl bg-accent-purple/20 flex items-center justify-center mr-4 shadow-inner">
                                <FaShieldAlt className="text-accent-purple text-xl" />
                            </div>
                            <h2 className="text-2xl font-bold text-primary-text">
                                Casas da Turma
                            </h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {teams.map((team, index) => (
                                <div
                                    key={team.id}
                                    className="bg-secondary-bg/80 backdrop-blur-sm rounded-2xl border border-border-color shadow-lg overflow-hidden hover:shadow-[0_8px_30px_rgba(157,78,221,0.15)] hover:border-accent-purple/50 transition-all duration-300 transform hover:-translate-y-1"
                                >
                                    <div className={`p-5 border-b border-border-color bg-gradient-to-r ${index % 2 === 0 ? 'from-purple-900/40 to-blue-900/40' : 'from-blue-900/40 to-teal-900/40'}`}>
                                        <h3 className="font-extrabold text-lg text-white flex items-center justify-center gap-3">
                                            <FaShieldAlt className="text-accent-purple/80" />
                                            {team.name}
                                        </h3>
                                    </div>
                                    <div className="p-5">
                                        <div className="flex items-center justify-between mb-4">
                                            <p className="text-xs text-secondary-text font-bold uppercase tracking-wider">
                                                Membros
                                            </p>
                                            <span className="bg-primary-bg px-2 py-1 rounded-full text-xs font-bold text-accent-purple border border-border-color">
                                                {team.members.length}
                                            </span>
                                        </div>
                                        <div className="flex flex-col gap-3 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                                            {team.members.length > 0 ? (
                                                team.members.map(member => (
                                                    <div key={member.id} className="flex items-center gap-3 bg-primary-bg/60 p-2.5 rounded-xl border border-transparent hover:border-border-color transition-colors">
                                                        <img
                                                            src={member.avatar}
                                                            alt={member.name}
                                                            className="w-8 h-8 rounded-full border border-border-color object-cover shadow-sm"
                                                        />
                                                        <span className="text-sm font-medium text-primary-text truncate">{member.name}</span>
                                                    </div>
                                                ))
                                            ) : (
                                                <p className="text-sm text-secondary-text italic text-center py-4 bg-primary-bg/30 rounded-xl border border-dashed border-border-color">Casa vazia no momento</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* --- SEÇÃO: ALUNOS --- */}
                <div className="mb-12">
                    <div className="flex items-center mb-6">
                        <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center mr-4 shadow-inner">
                            <FaUsers className="text-blue-400 text-xl" />
                        </div>
                        <h2 className="text-2xl font-bold text-primary-text flex items-center gap-3">
                            Colegas de Turma
                            <span className="text-sm bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full font-bold">
                                {students.length}
                            </span>
                        </h2>
                    </div>
                    
                    {students.length > 0 ? (
                        <div className="bg-secondary-bg/80 backdrop-blur-md p-6 rounded-2xl shadow-xl border border-border-color">
                            <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                {students.map((student) => (
                                    <li key={student.id} className="bg-primary-bg p-4 rounded-xl flex items-center border border-border-color/50 hover:border-blue-400/30 transition-colors group">
                                        <div className="w-10 h-10 rounded-full bg-secondary-bg flex items-center justify-center mr-3 border border-border-color group-hover:bg-blue-500/10 transition-colors">
                                            <FaUserGraduate className="text-secondary-text group-hover:text-blue-400 transition-colors" />
                                        </div>
                                        <span className="text-primary-text font-medium">{student.name}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ) : (
                        <div className="bg-secondary-bg/50 backdrop-blur-sm p-8 rounded-2xl border border-dashed border-border-color text-center">
                            <p className="text-secondary-text font-medium">Nenhum aluno matriculado ainda.</p>
                        </div>
                    )}
                </div>

                {/* --- SEÇÃO: ATIVIDADES --- */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center">
                            <div className="w-12 h-12 rounded-xl bg-accent-teal/20 flex items-center justify-center mr-4 shadow-inner">
                                <FaMedal className="text-accent-teal text-xl" />
                            </div>
                            <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-accent-teal to-accent-yellow">
                                Atividades da Turma
                            </h2>
                        </div>
                        {activities.length > 0 && (
                            <span className="text-sm bg-accent-teal/20 text-accent-teal px-3 py-1 rounded-full font-bold">
                                {activities.length} no total
                            </span>
                        )}
                    </div>

                    {activities.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 lg:gap-8">
                            {activities.map((activity) => (
                                <ActivityCard key={activity.id} activity={activity} />
                            ))}
                        </div>
                    ) : (
                        <div className="bg-secondary-bg/60 backdrop-blur-md py-16 px-6 rounded-3xl shadow-xl border border-border-color text-center">
                            <div className="max-w-md mx-auto">
                                <div className="w-24 h-24 mx-auto bg-primary-bg rounded-full flex items-center justify-center mb-6 shadow-inner border border-border-color/50">
                                    <FaBook className="text-4xl text-secondary-text/50" />
                                </div>
                                <h3 className="text-2xl font-bold text-primary-text mb-3">
                                    Nenhuma atividade encontrada
                               </h3>
                                <p className="text-secondary-text">
                                    Esta turma ainda não tem atividades atribuídas. Assim que o professor criar novas missões, elas aparecerão aqui!
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {message && (
                    <div className={`p-4 rounded-xl text-center mb-8 backdrop-blur-sm border font-medium ${message.includes('Erro') ? 'bg-danger-bg/80 border-danger text-danger' : 'bg-info-bg/80 border-info text-info'
                        }`}>
                        {message}
                    </div>
                )}
            </div>
        </div>
    );
}

export default ClassDetailsPage;