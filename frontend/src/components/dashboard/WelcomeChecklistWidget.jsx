import React, { useState, useEffect } from 'react';
import { CheckCircle2, Circle, ChevronDown, ChevronUp, Sparkles, Award } from 'lucide-react';
import { Link } from 'react-router-dom';

/**
 * WelcomeChecklistWidget (Melhoria 08: Checklist Interativo de Boas-Vindas)
 * Permite ao aluno acompanhar marcos essenciais iniciais (Perfil, Turma, Roleta, Primeira Atividade)
 * com persistência local de status e recompensas de introdução.
 */
export default function WelcomeChecklistWidget({ user, performance, enrolledClassesCount = 0 }) {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [tasks, setTasks] = useState([]);

    useEffect(() => {
        const storedChecklist = localStorage.getItem(`checklist_${user?.id}`);
        let completedMap = {};
        if (storedChecklist) {
            try {
                completedMap = JSON.parse(storedChecklist);
            } catch (e) {
                completedMap = {};
            }
        }

        const initialTasks = [
            {
                id: 'profile',
                label: 'Personalizar Avatar e Bio no Perfil',
                link: '/perfil',
                done: Boolean(user?.bio || user?.profile_pic || completedMap.profile)
            },
            {
                id: 'class',
                label: 'Entrar na sua primeira Turma',
                link: '/aluno/entrar-turma',
                done: enrolledClassesCount > 0 || Boolean(completedMap.class)
            },
            {
                id: 'roulette',
                label: 'Girar a Roleta Diária de Prêmios',
                link: '/aluno/dashboard',
                done: Boolean(performance?.last_spin_date || completedMap.roulette)
            },
            {
                id: 'first_activity',
                label: 'Completar o primeiro desafio no Tabuleiro',
                link: '/aluno/minhas-atividades',
                done: (performance?.total_xp_earned > 0) || Boolean(completedMap.first_activity)
            }
        ];

        setTasks(initialTasks);
    }, [user, performance, enrolledClassesCount]);

    const completedCount = tasks.filter(t => t.done).length;
    const progressPercent = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

    if (completedCount === tasks.length && tasks.length > 0) {
        return null; // Oculta se já concluiu tudo
    }

    return (
        <div className="bg-gradient-to-br from-secondary-bg/90 to-primary-bg/90 backdrop-blur-md border border-accent-teal/30 rounded-3xl p-5 shadow-xl mb-8 transition-all duration-300 hover:border-accent-teal/50">
            <div className="flex items-center justify-between cursor-pointer" onClick={() => setIsCollapsed(!isCollapsed)}>
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-accent-teal/10 rounded-2xl">
                        <Sparkles className="text-accent-teal" size={22} />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="text-base font-bold text-primary-text">Missões de Boas-Vindas</h3>
                            <span className="text-xs bg-accent-teal/20 text-accent-teal font-extrabold px-2 py-0.5 rounded-full">
                                {completedCount}/{tasks.length}
                            </span>
                        </div>
                        <p className="text-xs text-secondary-text">Dê os primeiros passos e libere recompensas iniciais</p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="hidden sm:flex flex-col items-end">
                        <span className="text-xs font-bold text-accent-teal">{progressPercent}% Concluído</span>
                        <div className="w-28 h-2 bg-gray-700 rounded-full overflow-hidden mt-1">
                            <div
                                className="h-full bg-gradient-to-r from-accent-teal to-cyan-400 transition-all duration-500"
                                style={{ width: `${progressPercent}%` }}
                            />
                        </div>
                    </div>
                    <button className="text-secondary-text hover:text-primary-text p-1 rounded-lg">
                        {isCollapsed ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
                    </button>
                </div>
            </div>

            {!isCollapsed && (
                <div className="mt-4 pt-4 border-t border-border-color/40 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {tasks.map((task) => (
                        <Link
                            key={task.id}
                            to={task.link}
                            className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                                task.done
                                    ? 'bg-accent-teal/5 border-accent-teal/20 text-secondary-text line-through'
                                    : 'bg-secondary-bg/50 hover:bg-secondary-bg border-border-color/40 hover:border-accent-teal/40 text-primary-text hover:scale-[1.01]'
                            }`}
                        >
                            <div className="flex items-center gap-2.5">
                                {task.done ? (
                                    <CheckCircle2 size={18} className="text-accent-teal flex-shrink-0" />
                                ) : (
                                    <Circle size={18} className="text-secondary-text flex-shrink-0" />
                                )}
                                <span className="text-xs font-medium">{task.label}</span>
                            </div>
                            {!task.done && (
                                <span className="text-[10px] uppercase font-bold text-accent-yellow bg-accent-yellow/10 px-2 py-0.5 rounded-md flex-shrink-0">
                                    +50 XP
                                </span>
                            )}
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
