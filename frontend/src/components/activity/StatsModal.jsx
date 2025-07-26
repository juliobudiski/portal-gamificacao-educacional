import React from 'react';

const StatsModal = ({ stats, onClose }) => (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
        <div className="bg-gray-800 p-8 rounded-lg max-w-lg w-full">
            <h3 className="text-2xl font-bold mb-4">Minhas Estatísticas</h3>
            <p>Perguntas Corretas: {stats.correctAnswers}/{stats.totalQuestions}</p>
            <p>Tempo Médio: {stats.averageTime}s / pergunta</p>
            <p>Conquistas Desbloqueadas: {stats.achievements}</p>
            <button onClick={onClose} className="mt-6 w-full py-2 bg-blue-600 rounded-lg">Fechar</button>
        </div>
    </div>
);

export default StatsModal;