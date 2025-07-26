import React from 'react';
import { FaChartBar, FaUsers, FaPlusCircle } from 'react-icons/fa';

const ProfessorSidebar = ({ analytics, onStudentClick, onOpenQuizEditor }) => (
    <div className="p-4 bg-gray-900 rounded-lg space-y-6 sticky top-4">
        <div>
            <h4 className="text-lg font-bold text-blue-400 flex items-center"><FaChartBar className="mr-2" /> Analytics da Turma</h4>
            <p className="text-white">Taxa de Conclusão: <span className="font-bold">{analytics.completionRate}%</span></p>
            <p className="text-white">Pontuação Média: <span className="font-bold">{analytics.averageScore}</span></p>
        </div>
        <div>
            <h4 className="text-lg font-bold text-green-400 flex items-center"><FaUsers className="mr-2" /> Alunos</h4>
            <ul className="mt-2 space-y-2 max-h-48 overflow-y-auto">
                {analytics.students.map(student => (
                    <li key={student.id} onClick={() => onStudentClick(student)} className="flex justify-between items-center p-2 bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-600">
                        <span className="text-white">{student.name}</span>
                        <span className={`text-xs px-2 py-1 rounded-full ${student.status === 'Concluído' ? 'bg-green-500' : student.status === 'Em Andamento' ? 'bg-yellow-500' : 'bg-red-500'}`}>
                            {student.status}
                        </span>
                    </li>
                ))}
            </ul>
        </div>
        <button onClick={onOpenQuizEditor} className="w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-700 rounded-lg flex items-center justify-center">
            <FaPlusCircle className="mr-2" /> Gerenciar Quiz
        </button>
    </div>
);

export default ProfessorSidebar;