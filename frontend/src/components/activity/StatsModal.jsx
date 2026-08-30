import React from 'react';

/**
 * Modal de Estatísticas da Atividade
 * 
 * Exibe o desempenho final (XP ganho, tempo gasto, acertos) após o aluno concluir
 * uma atividade gamificada.
 */


const StatsModal = ({ stats, onClose }) => (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
        <div className="bg-primary-bg p-8 rounded-lg max-w-lg w-full text-primary-text">
            <h3 className="text-2xl font-bold mb-6 text-center text-yellow-400">Minhas Estatísticas</h3>
            <div className="space-y-4">
                <p className="text-lg">
                    Pontuação Obtida:
                    <span className="font-bold text-xl ml-2 text-green-400">
                        {stats.scoreAchieved} / {stats.totalPossibleScore} Pontos
                    </span>
                </p>
                <p className="text-lg">
                    Total de Questões:
                    <span className="font-bold text-xl ml-2 text-blue-400">
                        {stats.totalQuestions}
                    </span>
                </p>
                <p className="text-lg">
                    Tempo Médio:
                    <span className="font-bold text-xl ml-2 text-purple-400">
                        {stats.averageTime}s / pergunta
                    </span>
                </p>
                <p className="text-lg">
                    Conquistas Desbloqueadas:
                    <span className="font-bold text-xl ml-2 text-pink-400">
                        {stats.achievements}
                    </span>
                </p>
            </div>
            <button onClick={onClose} className="mt-8 w-full py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-colors">
                Fechar
            </button>
        </div>
    </div>
);

export default StatsModal;