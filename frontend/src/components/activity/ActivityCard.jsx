import React from 'react';
import { FaEdit, FaTrash, FaCopy, FaEye, FaChalkboardTeacher, FaQuestionCircle, FaStar, FaStarHalfAlt, FaRegStar } from 'react-icons/fa'; // FaShareAlt foi removido
import { useNavigate } from 'react-router-dom';

function ActivityCard({ activity, isOwner, onCopy, onDelete, onSelect, isSelected }) {
    const navigate = useNavigate();
    const copyCount = activity.copy_count ?? 0;
    const assignmentCount = activity.assignment_count ?? 0;
    const rating = activity.average_rating || 0;
    const ratingCount = activity.rating_count || 0;
    const handleCheckboxClick = (e) => {
        e.stopPropagation();
        onSelect(activity.id);
    };
    // Função para renderizar as estrelas dinamicamente
    const renderStars = () => {
        const stars = [];
        for (let i = 1; i <= 5; i++) {
            if (rating >= i) {
                stars.push(<FaStar key={i} className="text-yellow-400" />); // Estrela Cheia
            } else if (rating >= i - 0.5) {
                stars.push(<FaStarHalfAlt key={i} className="text-yellow-400" />); // Meia Estrela
            } else {
                stars.push(<FaRegStar key={i} className="text-gray-500" />); // Estrela Vazia
            }
        }
        return stars;
    };

    // Tooltip explicativo
    const ratingTooltip = ratingCount > 0
        ? `Nota média: ${rating} (baseada em ${ratingCount} avaliações de alunos)`
        : "Esta atividade ainda não recebeu avaliações de alunos.";


    return (
        <div className="bg-secondary-bg p-5 rounded-xl shadow-lg border border-[var(--border-color)] flex flex-col justify-between h-full transform hover:-translate-y-1 transition-transform duration-300 relative group-card">
            {isOwner && (
                <div className="absolute top-3 right-3 z-10">
                    <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={handleCheckboxClick}
                        onClick={(e) => e.stopPropagation()}
                        // Checkbox adaptável
                        className="h-5 w-5 rounded bg-primary-bg border-secondary-text/50 text-accent-yellow focus:ring-accent-yellow cursor-pointer"
                    />
                </div>
            )}
            <div>
                {/* Cabeçalho com Título e Avaliação lado a lado */}
                <div className="flex justify-between items-start mb-2 pr-8">
                    <h3 className="text-lg font-bold text-primary-text leading-tight">{activity.title}</h3>

                    {/* --- SEÇÃO DE AVALIAÇÃO --- */}
                    <div
                        // Fundo primary-bg para contraste
                        className="flex items-center bg-primary-bg px-2 py-1 rounded-lg cursor-help transition-colors border border-[var(--border-color)]"
                        title={ratingTooltip}
                    >
                        {ratingCount > 0 ? (
                            <>
                                <div className="flex text-xs mr-1 text-accent-yellow">
                                    {renderStars()}
                                </div>
                                <span className="text-xs font-bold text-secondary-text">({ratingCount})</span>
                            </>
                        ) : (
                            <div className="flex items-center text-secondary-text opacity-70">
                                <FaQuestionCircle className="mr-1" />
                                <span className="text-xs">Sem aval.</span>
                            </div>
                        )}
                    </div>
                    {/* -------------------------- */}
                </div>

                {/* Badge de Turma */}
                {activity.class_name && (
                    <div className="flex items-center text-xs text-accent-yellow bg-accent-yellow/10 border border-accent-yellow/20 px-2 py-1 rounded-md mb-3 w-fit">
                        <FaChalkboardTeacher className="mr-2" />
                        <span>Turma: {activity.class_name}</span>
                    </div>
                )}

                <p className="text-sm text-secondary-text mb-3 line-clamp-3">{activity.description}</p>

                <div className="flex items-center text-xs text-secondary-text mb-4">
                    <span className="font-semibold mr-2">Criado por:</span>
                    <span>{activity.professor_name}</span>
                </div>

                <div className="flex flex-wrap gap-2">
                    {/* Badge de Área (Info) */}
                    <span className="text-xs font-medium px-2 py-1 bg-info-bg text-info border border-info/20 rounded-full">
                        {activity.areaKnowledge || 'N/A'}
                    </span>

                    {/* Badge de Público (Success) */}
                    {activity.isPublic && (
                        <span className="text-xs font-medium px-2 py-1 bg-success-bg text-success border border-success/20 rounded-full">
                            Pública
                        </span>
                    )}
                </div>
            </div>

            {/* Rodapé de Ações */}
            <div className="mt-4 pt-4 border-t border-[var(--border-color)] flex justify-end items-center gap-2">
                {isOwner ? (
                    <>
                        {/* Botão Atribuir */}
                        <button
                            onClick={() => navigate(`/assign-activity-to-class/${activity.id}`)}
                            className="p-2 bg-primary-bg hover:bg-accent-teal/20 rounded-full group transition-colors border border-transparent hover:border-accent-teal/30"
                            title="Atribuir à Turma"
                        >
                            <FaChalkboardTeacher className="text-secondary-text group-hover:text-accent-teal" />
                        </button>
                        {/* Botão Editar */}
                        <button
                            onClick={() => navigate(`/professor/atividades/${activity.id}/edit`)}
                            className="p-2 bg-primary-bg hover:bg-accent-yellow/20 rounded-full group transition-colors border border-transparent hover:border-accent-yellow/30"
                            title="Editar"
                        >
                            <FaEdit className="text-secondary-text group-hover:text-accent-yellow" />
                        </button>
                        {/* Botão Deletar (Danger) */}
                        <button
                            onClick={() => onDelete(activity.id)}
                            className="p-2 bg-primary-bg hover:bg-danger-bg rounded-full group transition-colors border border-transparent hover:border-danger/30"
                            title="Deletar"
                        >
                            <FaTrash className="text-secondary-text group-hover:text-danger" />
                        </button>
                        {/* Botão Copiar */}
                        <button
                            onClick={() => onCopy(activity.id)}
                            className="p-2 bg-primary-bg hover:bg-accent-purple/20 rounded-full group transition-colors border border-transparent hover:border-accent-purple/30"
                            title="Copiar e Editar"
                        >
                            <FaCopy className="text-secondary-text group-hover:text-accent-purple" />
                        </button>
                    </>
                ) : (
                    <>
                        <button
                            onClick={() => onCopy(activity.id)}
                            className="p-2 bg-primary-bg hover:bg-accent-purple/20 rounded-full group transition-colors border border-transparent hover:border-accent-purple/30"
                            title="Copiar e Editar"
                        >
                            <FaCopy className="text-secondary-text group-hover:text-accent-purple" />
                        </button>
                    </>
                )}
                {/* Botão Visualizar (Info/Blue) */}
                <button
                    onClick={() => navigate(`/activities/${activity.id}`)}
                    className="p-2 bg-primary-bg hover:bg-info-bg rounded-full group transition-colors border border-transparent hover:border-info/30"
                    title="Visualizar"
                >
                    <FaEye className="text-secondary-text group-hover:text-info" />
                </button>
            </div>

            {/* Estatísticas de rodapé */}
            <div className="flex items-center text-xs text-secondary-text mt-3 space-x-4">
                <div className="flex items-center" title={`${copyCount} professores copiaram esta atividade`}>
                    <FaCopy className="mr-1.5" />
                    <span>{copyCount} cópias</span>
                </div>
                <div className="flex items-center" title={`Atribuída a ${assignmentCount} turmas`}>
                    <FaChalkboardTeacher className="mr-1.5" />
                    <span>{assignmentCount} turmas</span>
                </div>
            </div>
        </div>
    );
}

export default ActivityCard;