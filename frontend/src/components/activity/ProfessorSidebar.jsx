import React from 'react';
// Ícones adicionados para o novo botão
import { FaChartBar, FaUsers, FaPlusCircle, FaBookOpen } from 'react-icons/fa';
import PropTypes from 'prop-types'; // Import adicionado para validação de props

// Verifica se o modo debug está ativado
const isDebugMode = import.meta.env.VITE_DEBUG_MODE === 'true';

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
  // Log de renderização do componente
  if (isDebugMode) {
    console.log('[ProfessorSidebar] Componente renderizado', {
      studentCount: analytics?.students?.length || 0,
      completionRate: analytics?.completionRate || 0
    });
  }

  return (
    <div className="p-4 bg-gray-900 rounded-lg space-y-6 sticky top-4">
      {/* Seção de Analytics */}
      <div>
        <h4 className="text-lg font-bold text-blue-400 flex items-center">
          <FaChartBar className="mr-2" /> Analytics da Turma
        </h4>
        <p className="text-white">Taxa de Conclusão: <span className="font-bold">{analytics.completionRate}%</span></p>
        <p className="text-white">Pontuação Média: <span className="font-bold">{analytics.averageScore}</span></p>
      </div>

      {/* Lista de Alunos */}
      <div>
        <h4 className="text-lg font-bold text-green-400 flex items-center">
          <FaUsers className="mr-2" /> Alunos
        </h4>
        <ul className="mt-2 space-y-2 max-h-48 overflow-y-auto">
          {analytics.students.map(student => (
            <li 
              key={student.id} 
              onClick={() => {
                // Log de seleção de aluno
                if (isDebugMode) {
                  console.log(`[ProfessorSidebar] Aluno selecionado: ${student.name} (ID: ${student.id})`);
                }
                onStudentClick(student);
              }} 
              className="flex justify-between items-center p-2 bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-600"
            >
              <span className="text-white">{student.name}</span>
              <span className={`text-xs px-2 py-1 rounded-full ${student.status === 'Concluído' ? 'bg-green-500' : student.status === 'Em Andamento' ? 'bg-yellow-500' : 'bg-red-500'}`}>
                {student.status}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* Controles de Gerenciamento */}
      <div className="space-y-3 pt-3 border-t border-gray-700">
        <button 
          onClick={() => {
            // Log de interação
            if (isDebugMode) {
              console.log('[ProfessorSidebar] Botão "Gerenciar Quiz" clicado');
            }
            onOpenQuizEditor();
          }} 
          className="w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-700 rounded-lg flex items-center justify-center transition-colors"
        >
          <FaPlusCircle className="mr-2" /> Gerenciar Quiz
        </button>
        
        <button 
          onClick={() => {
            // Log de interação
            if (isDebugMode) {
              console.log('[ProfessorSidebar] Botão "Gerenciar Narrativa" clicado');
            }
            onOpenNarrativeEditor();
          }} 
          className="w-full py-2 px-4 bg-yellow-600 hover:bg-yellow-700 rounded-lg flex items-center justify-center transition-colors"
        >
          <FaBookOpen className="mr-2" /> Gerenciar Narrativa
        </button>
        
        {/* TODO: Adicionar botão para exportar dados da turma */}
        {/* TODO: Implementar filtros avançados na lista de alunos */}
      </div>
    </div>
  );
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