import React from 'react';
import { FaEdit, FaTrash, FaCopy, FaEye, FaChalkboardTeacher } from 'react-icons/fa'; // FaShareAlt foi removido
import { useNavigate } from 'react-router-dom';

function ActivityCard({ activity, isOwner, onCopy, onDelete }) {
    const navigate = useNavigate();
    const copyCount = activity.copy_count ?? 0;
    const assignmentCount = activity.assignment_count ?? 0;

    return (
        <div className="bg-[#3a4046] p-5 rounded-xl shadow-lg border border-[#4a525a] flex flex-col justify-between h-full transform hover:-translate-y-1 transition-transform duration-300">
            <div>
                <h3 className="text-lg font-bold text-white mb-2">{activity.title}</h3>
                {/* --- INFORMAÇÃO DA TURMA ADICIONADA AQUI --- */}
                {activity.class_name && (
                    <div className="flex items-center text-xs text-yellow-300 bg-yellow-400/10 px-2 py-1 rounded-md mb-3">
                        <FaChalkboardTeacher className="mr-2" />
                        <span>Turma: {activity.class_name}</span>
                    </div>
                )}
                <p className="text-sm text-gray-300 mb-3 line-clamp-3">{activity.description}</p>
                <div className="flex items-center text-xs text-gray-400 mb-4">
                    <span className="font-semibold mr-2">Criado por:</span>
                    <span>{activity.professor_name}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                    <span className="text-xs font-medium px-2 py-1 bg-blue-400/20 text-blue-300 rounded-full">
                        {activity.areaKnowledge || 'N/A'}
                    </span>
                    {activity.isPublic && (
                         <span className="text-xs font-medium px-2 py-1 bg-green-500/20 text-green-400 rounded-full">
                            Pública
                        </span>
                    )}
                </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-600 flex justify-end items-center gap-2">
                {isOwner ? (
                    <>
                        {/* 2. Botão "Atribuir Turma" adicionado aqui */}
                        <button 
                            onClick={() => navigate(`/assign-activity-to-class/${activity.id}`)} 
                            className="p-2 bg-gray-700 hover:bg-accent-teal/30 rounded-full group" 
                            title="Atribuir à Turma"
                        >
                            <FaChalkboardTeacher className="text-gray-400 group-hover:text-accent-teal" />
                        </button>
                        
                        {/* Botões existentes para o dono da atividade */}
                        <button onClick={() => navigate(`/professor/atividades/${activity.id}/edit`)} className="p-2 bg-gray-700 hover:bg-accent-yellow/30 rounded-full group" title="Editar">
                            <FaEdit className="text-gray-400 group-hover:text-accent-yellow" />
                        </button>
                        <button onClick={() => onDelete(activity.id)} className="p-2 bg-gray-700 hover:bg-red-500/30 rounded-full group" title="Deletar">
                            <FaTrash className="text-gray-400 group-hover:text-red-400" />
                        </button>
                    </>
                ) : (
                    <>
                         <button onClick={() => onCopy(activity.id)} className="p-2 bg-gray-700 hover:bg-accent-purple/30 rounded-full group" title="Copiar e Editar">
                            <FaCopy className="text-gray-400 group-hover:text-accent-purple" />
                        </button>
                    </>
                )}
                <button onClick={() => navigate(`/activities/${activity.id}`)} className="p-2 bg-gray-700 hover:bg-blue-500/30 rounded-full group" title="Visualizar">
                    <FaEye className="text-gray-400 group-hover:text-blue-400" />
                </button>
            </div>
            <div className="flex items-center text-xs text-gray-400 mt-3 space-x-4">
                <div className="flex items-center" title={`${copyCount} professores copiaram esta atividade`}>
                    <FaCopy className="mr-1.5" />
                    <span>Copiada {copyCount} vezes</span>
                </div>
                <div className="flex items-center" title={`Atribuída a ${assignmentCount} turmas`}>
                    <FaChalkboardTeacher className="mr-1.5" />
                    <span>Atribuída {assignmentCount} vezes</span>
                </div>
            </div>
        </div>
    );
}

export default ActivityCard;