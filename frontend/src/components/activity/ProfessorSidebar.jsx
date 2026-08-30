import React, { useState } from 'react';
// Ícones adicionados para o novo botão
import { FaChartBar, FaUsers, FaPlusCircle, FaBookOpen, FaEye, FaCheck, FaTimes, FaQuestionCircle, FaLevelUpAlt, FaComments } from 'react-icons/fa';
import PropTypes from 'prop-types'; // Import adicionado para validação de props

// Verifica se o modo debug está ativado
const isDebugMode = import.meta.env.VITE_DEBUG_MODE === 'true';

const StatLine = ({ icon, label, value, colorClass }) => (
  <div className="flex justify-between items-center text-sm">
    <div className={`flex items-center ${colorClass}`}>
      {icon}
      <span className="ml-2">{label}</span>
    </div>
    <span className="font-bold">{value}</span>
  </div>
);

/**
 * @component ProfessorSidebar
 * @desc Barra lateral para professores com analytics da turma, lista de alunos e controles de gerenciamento.
 * @param {Object} props - Propriedades do componente
 * @param {Object} props.analytics - Dados analíticos da turma
 * @param {Function} props.onStudentClick - Callback para seleção de aluno
 * @param {Function} props.onOpenQuizEditor - Callback para abertura do editor de quiz
 * @param {Function} props.onOpenNarrativeEditor - Callback para abertura do editor de narrativa
 * @returns {JSX.Element} Interface de gerenciamento para professores
 */
const ProfessorSidebar = ({ analytics, onStudentClick, onOpenQuizEditor, onOpenNarrativeEditor }) => {

  const [expandedStudentId, setExpandedStudentId] = useState(null); // Estado para controlar a expansão
  const toggleStudent = (studentId) => {
    setExpandedStudentId(prevId => (prevId === studentId ? null : studentId));
  };

  // Log de renderização do componente
  if (isDebugMode) {
    console.log('[ProfessorSidebar] Componente renderizado', {
      studentCount: analytics?.students?.length || 0,
      completionRate: analytics?.completionRate || 0
    });
  }

  return (
    <div className="p-4 bg-primary-bg rounded-lg space-y-6 sticky top-4">
      {/* Seção de Analytics da Turma */}
      <div>
        <h4 className="text-lg font-bold text-blue-400 flex items-center">
          <FaChartBar className="mr-2" /> Analytics da Turma
        </h4>
        <p className="text-primary-text">Taxa de Conclusão: <span className="font-bold">{analytics.completionRate.toFixed(1)}%</span></p>
        <p className="text-primary-text">Pontuação Média: <span className="font-bold">{analytics.averageScore.toFixed(0)}</span></p>
      </div>

      {/* Lista de Alunos com detalhes expansíveis */}
      <div>
        <h4 className="text-lg font-bold text-green-400 flex items-center">
          <FaUsers className="mr-2" /> Alunos ({analytics.students.length})
        </h4>
        <ul className="mt-2 space-y-2 max-h-[40vh] overflow-y-auto pr-2">
          {analytics.students.map(student => (
            <li
              key={student.id}
              className="bg-border-color rounded-lg cursor-pointer hover:bg-hover-bg-color transition-all duration-200"
            >
              <div
                onClick={() => toggleStudent(student.id)}
                className="flex justify-between items-center p-2"
              >
                <span className="text-primary-text font-medium">{student.name}</span>
                <div className="flex items-center gap-2">
                  {/* NOVO: Exibição do Nível do Aluno */}
                  <span className="text-xs font-bold text-yellow-300 bg-yellow-400/10 px-2 py-1 rounded-md flex items-center">
                    <FaLevelUpAlt className="mr-1" />
                    {student.level}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded-full ${student.status === 'completed' ? 'bg-green-500' : student.status === 'in_progress' ? 'bg-yellow-500' : 'bg-red-500'}`}>
                    {student.status.replace('_', ' ')}
                  </span>
                </div>
              </div>

              {/* Seção Expansível com as novas estatísticas */}
              {expandedStudentId === student.id && (
                <div className="p-3 border-t border-[var(--border-color)] space-y-1 animate-fade-in">
                  <StatLine icon={<FaEye />} label="Narrativa vista" value={`${student.narrative_views}x`} colorClass="text-blue-300" />
                  <StatLine icon={<FaComments />} label="Msg no Chat" value={`${student.chat_messages}x`} colorClass="text-purple-300" />
                  <StatLine icon={<FaQuestionCircle />} label="Respostas" value={student.total_answers} colorClass="text-secondary-text" />
                  <StatLine icon={<FaCheck />} label="Acertos" value={student.correct_answers} colorClass="text-green-300" />
                  <StatLine icon={<FaTimes />} label="Erros" value={student.wrong_answers} colorClass="text-red-300" />
                  {/* NOVO: Taxa de Acerto */}
                  <StatLine icon={<FaChartBar />} label="Aproveitamento" value={`${student.accuracy.toFixed(0)}%`} colorClass="text-yellow-300" />
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>

      {/* Controles de Gerenciamento */}
      <div className="space-y-3 pt-3 border-t border-border-color">
        <button
          onClick={onOpenQuizEditor}
          className="w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-700 rounded-lg flex items-center justify-center transition-colors"
        >
          <FaPlusCircle className="mr-2" /> Gerenciar Quiz
        </button>

        <button
          onClick={onOpenNarrativeEditor}
          className="w-full py-2 px-4 bg-yellow-600 hover:bg-yellow-700 rounded-lg flex items-center justify-center transition-colors"
        >
          <FaBookOpen className="mr-2" /> Gerenciar Narrativa
        </button>
      </div>
    </div>
  );
};

// Validação de props atualizada para incluir as novas métricas
ProfessorSidebar.propTypes = {
  analytics: PropTypes.shape({
    completionRate: PropTypes.number.isRequired,
    averageScore: PropTypes.number.isRequired,
    students: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
        name: PropTypes.string.isRequired,
        status: PropTypes.string.isRequired,
        points: PropTypes.number,
        level: PropTypes.number, // NOVO
        accuracy: PropTypes.number, // NOVO
        chat_messages: PropTypes.number, // NOVO
        total_answers: PropTypes.number,
        correct_answers: PropTypes.number,
        wrong_answers: PropTypes.number,
        narrative_views: PropTypes.number
      })
    ).isRequired
  }).isRequired,
  onOpenQuizEditor: PropTypes.func.isRequired,
  onOpenNarrativeEditor: PropTypes.func.isRequired
};

// Validação de props
ProfessorSidebar.propTypes = {
  analytics: PropTypes.shape({
    completionRate: PropTypes.number.isRequired,
    averageScore: PropTypes.number.isRequired,
    students: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
        name: PropTypes.string.isRequired,
        status: PropTypes.oneOf(['Concluído', 'Em Andamento', 'Não Iniciado']).isRequired
      })
    ).isRequired
  }).isRequired,
  onStudentClick: PropTypes.func.isRequired,
  onOpenQuizEditor: PropTypes.func.isRequired,
  onOpenNarrativeEditor: PropTypes.func.isRequired
};

export default ProfessorSidebar;