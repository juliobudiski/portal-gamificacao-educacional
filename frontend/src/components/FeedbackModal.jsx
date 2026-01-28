import React, { useState } from 'react';
import { useAuthOperations } from '../hooks/useAuthOperations';

export default function FeedbackModal({ isOpen, onClose, userRole }) {
    const [answers, setAnswers] = useState({});
    const { performAuthRequest } = useAuthOperations();

    if (!isOpen) return null;

    // Perguntas dinâmicas baseadas no Role
    const questions = userRole === 'professor' ? [
        { id: 'q1', text: 'A criação do mapa/tabuleiro foi intuitiva?', type: 'scale' },
        { id: 'q2', text: 'As ferramentas de gamificação atenderam seu plano de aula?', type: 'scale' },
        { id: 'q3', text: 'O que faltou para o design ser perfeito?', type: 'text' }
    ] : [
        { id: 'q1', text: 'Você se sentiu motivado a completar a trilha?', type: 'scale' },
        { id: 'q2', text: 'As regras do jogo (XP, moedas) ficaram claras?', type: 'scale' },
        { id: 'q3', text: 'Teve alguma dificuldade técnica?', type: 'text' }
    ];

    const handleSubmit = async () => {
        const payload = {
            role: userRole,
            responses: { ...answers, collected_at: new Date().toISOString() }
        };

        await performAuthRequest('/api/analytics/feedback/submit', 'POST', payload);
        onClose(); // Fecha e nunca mais abre
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-secondary-bg p-6 rounded-2xl w-full max-w-lg border border-accent-yellow shadow-2xl">
                <h2 className="text-xl font-bold text-primary-text mb-4">
                    Ajude a melhorar o Gamefica.Edu 🎓
                </h2>
                <p className="text-sm text-secondary-text mb-6">
                    Como parte de nossa pesquisa, gostaríamos de saber sua opinião rápida.
                </p>

                <div className="space-y-4">
                    {questions.map((q) => (
                        <div key={q.id}>
                            <label className="block text-sm font-medium text-primary-text mb-2">{q.text}</label>
                            {q.type === 'scale' ? (
                                <div className="flex justify-between gap-2">
                                    {[1, 2, 3, 4, 5].map(num => (
                                        <button
                                            key={num}
                                            onClick={() => setAnswers({ ...answers, [q.id]: num })}
                                            className={`w-10 h-10 rounded-full font-bold transition-all
                        ${answers[q.id] === num
                                                    ? 'bg-accent-yellow text-gray-900 scale-110'
                                                    : 'bg-primary-bg text-secondary-text hover:bg-gray-700'}`}
                                        >
                                            {num}
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <textarea
                                    className="w-full bg-primary-bg rounded p-2 text-primary-text"
                                    onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                                />
                            )}
                        </div>
                    ))}
                </div>

                <div className="mt-6 flex justify-end gap-3">
                    <button onClick={onClose} className="text-secondary-text text-sm hover:text-white">Agora não</button>
                    <button onClick={handleSubmit} className="bg-accent-teal text-gray-900 px-4 py-2 rounded-lg font-bold">
                        Enviar Avaliação
                    </button>
                </div>
            </div>
        </div>
    );
}