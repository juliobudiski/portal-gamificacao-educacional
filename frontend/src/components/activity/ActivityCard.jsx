import React from 'react';
import { 
  FaEdit, FaTrash, FaCopy, FaEye, FaChalkboardTeacher, 
  FaStar, FaStarHalfAlt, FaRegStar, FaGlobe, FaLock, 
  FaBookOpen, FaUserCheck, FaLayerGroup 
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

/**
 * @component ActivityCard
 * @description
 * Card component summarizing an activity, showing metadata and action buttons.
 * 
 * Architectural Decisions:
 * - Dynamic Styling: Extracts complex theme-to-gradient mapping into a pure helper function (`getThemeGradient`) outside the component to keep the render body clean.
 * - Conditional Actions: Renders different sets of action buttons (Edit, Clone, Delete) based on the `isOwner` prop, abstracting role logic from the parent list.
 */
const getThemeGradient = (area, theme) => {
  const normalized = (area || theme || '').toLowerCase();
  if (normalized.includes('matemát') || normalized.includes('exata')) {
    return 'from-blue-600 via-indigo-600 to-cyan-500';
  }
  if (normalized.includes('ciência') || normalized.includes('biol')) {
    return 'from-emerald-600 via-teal-600 to-green-500';
  }
  if (normalized.includes('histó') || normalized.includes('geog') || normalized.includes('socia')) {
    return 'from-amber-600 via-orange-600 to-yellow-500';
  }
  if (normalized.includes('lingua') || normalized.includes('portug') || normalized.includes('arte')) {
    return 'from-purple-600 via-pink-600 to-rose-500';
  }
  if (normalized.includes('tecnolog') || normalized.includes('program')) {
    return 'from-violet-600 via-indigo-600 to-purple-600';
  }
  return 'from-teal-600 via-emerald-600 to-cyan-600';
};

function ActivityCard({ activity, isOwner, onCopy, onDelete, onSelect, isSelected }) {
  const navigate = useNavigate();

  const copyCount = activity.copy_count ?? 0;
  const assignmentCount = activity.assignment_count ?? 0;
  const rating = Number(activity.average_rating) || 0;
  const ratingCount = activity.rating_count || 0;

  const handleCheckboxClick = (e) => {
    e.stopPropagation();
    if (onSelect) onSelect(activity.id);
  };

  const renderStars = () => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      if (rating >= i) {
        stars.push(<FaStar key={i} className="text-amber-400" />);
      } else if (rating >= i - 0.5) {
        stars.push(<FaStarHalfAlt key={i} className="text-amber-400" />);
      } else {
        stars.push(<FaRegStar key={i} className="text-gray-400 dark:text-gray-600" />);
      }
    }
    return stars;
  };

  const gradientClass = getThemeGradient(activity.areaKnowledge, activity.gamificationDesign?.theme);
  const teacherName = activity.professor_name || 'Professor(a)';
  const teacherInitial = teacherName.charAt(0).toUpperCase();

  return (
    <div 
      className={`
        group relative flex flex-col justify-between h-full bg-secondary-bg rounded-2xl border transition-all duration-300 overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1
        ${isSelected ? 'border-accent-yellow ring-2 ring-accent-yellow/50' : 'border-border-color hover:border-accent-teal/50'}
      `}
    >
      {/* Visual Top Banner */}
      <div className="relative h-28 w-full overflow-hidden">
        {activity.narrative_image_url ? (
          <img 
            src={activity.narrative_image_url} 
            alt={activity.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className={`w-full h-full bg-gradient-to-r ${gradientClass} opacity-90 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-between px-6`}>
            <FaBookOpen className="text-white/20 text-6xl transform -rotate-12 group-hover:scale-110 transition-transform" />
            <div className="w-20 h-20 bg-white/10 rounded-full blur-xl animate-pulse"></div>
          </div>
        )}

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-secondary-bg via-transparent to-black/30" />

        {/* Checkbox de Seleção em Lote */}
        {isOwner && onSelect && (
          <div className="absolute top-3 left-3 z-10">
            <label className="relative flex items-center justify-center cursor-pointer p-1 rounded-full bg-black/40 backdrop-blur-md border border-white/20 hover:bg-black/60 transition-colors">
              <input
                type="checkbox"
                checked={isSelected || false}
                onChange={handleCheckboxClick}
                className="sr-only peer"
              />
              <div className="w-5 h-5 rounded-md border-2 border-white/70 peer-checked:border-accent-yellow peer-checked:bg-accent-yellow flex items-center justify-center transition-all">
                {isSelected && (
                  <svg className="w-3.5 h-3.5 text-gray-900 font-bold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
            </label>
          </div>
        )}

        {/* Badges Flutuantes (Visibilidade & Avaliação) */}
        <div className="absolute top-3 right-3 z-10 flex items-center gap-2">
          {/* Badge Público/Privado */}
          <span className={`
            px-2.5 py-1 text-xs font-bold rounded-full backdrop-blur-md shadow-md flex items-center gap-1 border border-white/20 text-white
            ${activity.isPublic ? 'bg-emerald-600/80' : 'bg-gray-800/80'}
          `}>
            {activity.isPublic ? <FaGlobe className="text-[10px]" /> : <FaLock className="text-[10px]" />}
            {activity.isPublic ? 'Pública' : 'Privada'}
          </span>
        </div>

        {/* Badge de Área de Conhecimento na parte inferior do banner */}
        {activity.areaKnowledge && (
          <div className="absolute bottom-2 left-4 z-10">
            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-md bg-secondary-bg/90 backdrop-blur-md text-primary-text border border-border-color shadow-sm">
              {activity.areaKnowledge}
            </span>
          </div>
        )}
      </div>

      {/* Body Content */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          {/* Título e Estrelas */}
          <div className="flex justify-between items-start gap-2 mb-2">
            <h3 className="text-lg font-extrabold text-primary-text line-clamp-1 group-hover:text-accent-teal transition-colors" title={activity.title}>
              {activity.title}
            </h3>
          </div>

          {/* Turma Vinculada (se houver) */}
          {activity.class_name && (
            <div className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-lg mb-3">
              <FaChalkboardTeacher />
              <span>Turma: <strong>{activity.class_name}</strong></span>
            </div>
          )}

          {/* Descrição */}
          <p className="text-sm text-secondary-text line-clamp-2 mb-4 leading-relaxed">
            {activity.description || 'Sem descrição cadastrada para esta atividade.'}
          </p>
        </div>

        <div>
          {/* Informações do Autor e Avaliação */}
          <div className="flex items-center justify-between pt-3 border-t border-border-color/60 text-xs text-secondary-text mb-4">
            {/* Autor */}
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-accent-teal/20 text-accent-teal border border-accent-teal/30 flex items-center justify-center font-bold text-[11px]">
                {teacherInitial}
              </div>
              <span className="truncate max-w-[130px] font-medium" title={teacherName}>
                {teacherName}
              </span>
            </div>

            {/* Rating Stars */}
            <div 
              className="flex items-center gap-1 bg-primary-bg px-2 py-1 rounded-lg border border-border-color" 
              title={ratingCount > 0 ? `Nota ${rating} (${ratingCount} avaliações)` : 'Ainda não avaliada'}
            >
              <div className="flex text-xs">
                {renderStars()}
              </div>
              <span className="font-bold text-primary-text text-[11px] ml-0.5">
                {ratingCount > 0 ? rating.toFixed(1) : '-'}
              </span>
            </div>
          </div>

          {/* Estatísticas de Cópias e Turmas */}
          <div className="grid grid-cols-2 gap-2 text-xs text-secondary-text bg-primary-bg p-2.5 rounded-xl border border-border-color/50 mb-4">
            <div className="flex items-center gap-1.5 justify-center font-medium">
              <FaCopy className="text-accent-teal" />
              <span><strong>{copyCount}</strong> {copyCount === 1 ? 'cópia' : 'cópias'}</span>
            </div>
            <div className="flex items-center gap-1.5 justify-center font-medium border-l border-border-color">
              <FaLayerGroup className="text-accent-purple" />
              <span><strong>{assignmentCount}</strong> {assignmentCount === 1 ? 'turma' : 'turmas'}</span>
            </div>
          </div>

          {/* Botões de Ação do Rodapé */}
          <div className="flex items-center gap-2 pt-1">
            {/* Botão Principal de Visualização */}
            <button
              onClick={() => navigate(`/activities/${activity.id}`)}
              className="flex-1 py-2 px-3 bg-accent-teal hover:bg-teal-600 text-white font-bold text-xs rounded-xl shadow transition-all flex items-center justify-center gap-1.5 active:scale-95"
            >
              <FaEye />
              <span>Visualizar</span>
            </button>

            {/* Ações Secundárias (Proprietário ou Cópia) */}
            {isOwner ? (
              <div className="flex items-center gap-1">
                {/* Atribuir à Turma */}
                <button
                  onClick={() => navigate(`/assign-activity-to-class/${activity.id}`)}
                  className="p-2 bg-primary-bg hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-xl border border-border-color hover:border-amber-500/40 transition-colors"
                  title="Atribuir à Turma"
                >
                  <FaChalkboardTeacher />
                </button>

                {/* Editar */}
                <button
                  onClick={() => navigate(`/professor/atividades/${activity.id}/edit`)}
                  className="p-2 bg-primary-bg hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-xl border border-border-color hover:border-blue-500/40 transition-colors"
                  title="Editar Atividade"
                >
                  <FaEdit />
                </button>

                {/* Copiar */}
                <button
                  onClick={() => onCopy && onCopy(activity.id)}
                  className="p-2 bg-primary-bg hover:bg-purple-500/20 text-purple-600 dark:text-purple-400 rounded-xl border border-border-color hover:border-purple-500/40 transition-colors"
                  title="Duplicar Atividade"
                >
                  <FaCopy />
                </button>

                {/* Deletar */}
                <button
                  onClick={() => onDelete && onDelete(activity.id)}
                  className="p-2 bg-primary-bg hover:bg-red-500/20 text-red-600 dark:text-red-400 rounded-xl border border-border-color hover:border-red-500/40 transition-colors"
                  title="Excluir Atividade"
                >
                  <FaTrash />
                </button>
              </div>
            ) : (
              <button
                onClick={() => onCopy && onCopy(activity.id)}
                className="py-2 px-3 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow transition-all flex items-center justify-center gap-1.5 active:scale-95"
                title="Copiar atividade para o seu banco pessoal"
              >
                <FaCopy />
                <span>Clonar</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ActivityCard;