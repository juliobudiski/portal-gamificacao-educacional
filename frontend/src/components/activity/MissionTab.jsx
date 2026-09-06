import React, { useState, useEffect, useRef } from 'react';
import { FaArrowLeft, FaCheckCircle, FaExclamationCircle, FaShieldAlt } from 'react-icons/fa';

/**
 * @component MissionTab
 * @description
 * Immersive mission briefing interface that presents the activity's context and goals.
 * 
 * Architectural Decisions:
 * - Sequential State Machine: Manages a `step` state (0 to 3) to orchestrate the sequential unmounting/mounting of briefing sections.
 * - Reusable Animation Component: Extracts `TypewriterText` to handle the character-by-character text reveal effect without cluttering the main logic.
 */
// Componente auxiliar para efeito de digitação (Typewriter)
const TypewriterText = ({ text, delay = 30, onComplete, start = true }) => {
    const [displayedText, setDisplayedText] = useState('');
    const [index, setIndex] = useState(0);

    useEffect(() => {
        if (!start || !text) return;
        
        if (index < text.length) {
            const timeout = setTimeout(() => {
                setDisplayedText(prev => prev + text.charAt(index));
                setIndex(prev => prev + 1);
            }, delay);
            return () => clearTimeout(timeout);
        } else if (onComplete) {
            onComplete();
        }
    }, [index, start, text, delay, onComplete]);

    return <span>{displayedText}</span>;
};

const MissionTab = ({ activity, onComplete, onReturn }) => {
    if (!activity) return null;

    const { description, currentScenario, desiredScenario } = activity;
    const [step, setStep] = useState(0); 
    const [accepted, setAccepted] = useState(false);

    // Passo 0: Mostra a descrição principal
    // Passo 1: Mostra o cenário atual (problemas)
    // Passo 2: Mostra o cenário desejado (metas)
    // Passo 3: Mostra o botão de Aceite
    
    // Auto-avanço ao final da digitação se quiser, ou avanço por clique
    const advanceStep = () => {
        if (step < 3) setStep(prev => prev + 1);
    };
    
    // Pular animação
    const skipAnimation = () => {
        setStep(3);
    };

    const handleAccept = () => {
        setAccepted(true);
        setTimeout(() => {
            onComplete();
        }, 1000);
    };

    return (
        <div className="w-full max-w-4xl mx-auto mt-8 mb-8 relative text-primary-text bg-black/80 backdrop-blur-2xl rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.8)] border border-white/10 min-h-[70vh] flex flex-col overflow-hidden">
            
            {/* Efeitos de Luz no Background */}
            <div className="absolute top-0 right-0 w-[500px] h-[300px] bg-red-500/10 rounded-full blur-[100px] pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-[500px] h-[400px] bg-teal-500/10 rounded-full blur-[120px] pointer-events-none"></div>

            {/* Cabeçalho */}
            <div className="flex-shrink-0 p-6 flex justify-between items-center border-b border-white/10 relative z-10 bg-black/40">
                <button
                    onClick={onReturn}
                    className="flex items-center gap-2 py-2 px-4 bg-white/5 hover:bg-white/10 text-white font-bold rounded-full transition-all border border-white/10"
                >
                    <FaArrowLeft /> Recuar
                </button>
                <div className="flex items-center gap-3 text-red-400 animate-pulse font-bold tracking-widest uppercase">
                    <FaShieldAlt className="text-xl" />
                    <span>Missão Confidencial</span>
                </div>
                {step < 3 && (
                    <button onClick={skipAnimation} className="text-xs text-gray-500 hover:text-white uppercase tracking-wider font-bold">
                        Pular Animação &gt;&gt;
                    </button>
                )}
            </div>

            {/* Corpo da Missão */}
            <div className="flex-grow p-8 md:p-12 overflow-y-auto custom-scrollbar relative z-10 flex flex-col justify-center min-h-[50vh]">
                
                {/* 1. Briefing Inicial */}
                <div className="mb-10 text-xl md:text-2xl text-gray-300 leading-relaxed font-light font-mono">
                    <span className="text-teal-400 font-bold mr-2">&gt;</span>
                    <TypewriterText 
                        text={description || "Agente, recebemos uma nova anomalia no sistema. Precisamos da sua intervenção imediata."} 
                        delay={15} 
                        onComplete={() => setTimeout(() => setStep(prev => Math.max(prev, 1)), 500)} 
                    />
                </div>

                {/* 2. Cenário Atual (Problema) */}
                <div className={`transition-all duration-1000 transform ${step >= 1 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'} mb-8`}>
                    <div className="bg-red-500/10 border border-red-500/30 p-6 rounded-2xl">
                        <h3 className="text-xl font-bold text-red-400 mb-4 flex items-center gap-3">
                            <FaExclamationCircle className="text-2xl" />
                            Relatório de Danos (Problemas)
                        </h3>
                        <ul className="list-disc list-inside space-y-3 text-gray-300 font-mono pl-2">
                            {currentScenario?.problems?.map((problem, index) => (
                                <li key={index} className="opacity-80"><TypewriterText text={problem} start={step >= 1} delay={10} /></li>
                            ))}
                            {currentScenario?.otherProblem && (
                                <li className="opacity-80"><TypewriterText text={currentScenario.otherProblem} start={step >= 1} delay={10} onComplete={() => setTimeout(() => setStep(prev => Math.max(prev, 2)), 500)} /></li>
                            )}
                            {(!currentScenario?.problems?.length && !currentScenario?.otherProblem) && (
                                <li className="opacity-80">Nenhum dado específico fornecido. O caos é generalizado.</li>
                            )}
                        </ul>
                    </div>
                </div>

                {/* 3. Cenário Desejado (Meta) */}
                <div className={`transition-all duration-1000 transform ${step >= 2 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'} mb-12`}>
                    <div className="bg-teal-500/10 border border-teal-500/30 p-6 rounded-2xl">
                        <h3 className="text-xl font-bold text-teal-400 mb-4 flex items-center gap-3">
                            <FaCheckCircle className="text-2xl" />
                            Objetivos da Operação (Metas)
                        </h3>
                        <ul className="list-disc list-inside space-y-3 text-gray-300 font-mono pl-2">
                            {desiredScenario?.objectives?.map((objective, index) => (
                                <li key={index} className="opacity-80"><TypewriterText text={objective} start={step >= 2} delay={10} /></li>
                            ))}
                            {desiredScenario?.otherObjective && (
                                <li className="opacity-80"><TypewriterText text={desiredScenario.otherObjective} start={step >= 2} delay={10} onComplete={() => setTimeout(() => setStep(prev => Math.max(prev, 3)), 500)} /></li>
                            )}
                             {(!desiredScenario?.objectives?.length && !desiredScenario?.otherObjective) && (
                                <li className="opacity-80">Restaure a ordem a qualquer custo.</li>
                            )}
                        </ul>
                    </div>
                </div>

                {/* 4. Ação Final */}
                <div className={`mt-auto pt-8 flex justify-center transition-all duration-1000 ${step >= 3 ? 'opacity-100 scale-100' : 'opacity-0 scale-90 pointer-events-none'}`}>
                    <button
                        onClick={handleAccept}
                        disabled={accepted}
                        className={`relative overflow-hidden group px-12 py-4 rounded-xl font-black text-xl uppercase tracking-widest transition-all duration-500 ${
                            accepted 
                            ? 'bg-teal-500 text-black scale-105 shadow-[0_0_40px_rgba(20,184,166,0.6)]' 
                            : 'bg-transparent text-white border-2 border-teal-500 hover:bg-teal-500 hover:text-black hover:shadow-[0_0_30px_rgba(20,184,166,0.4)]'
                        }`}
                    >
                        <span className="relative z-10">{accepted ? 'Iniciando Sistema...' : 'Aceitar Missão'}</span>
                        
                        {/* Efeito Sweep */}
                        {!accepted && (
                            <div className="absolute inset-0 bg-white/20 transform -translate-x-full group-hover:animate-[sweep_1s_ease-in-out_infinite]"></div>
                        )}
                    </button>
                </div>
            </div>

            <style>{`
                @keyframes sweep {
                    0% { transform: translateX(-100%) skewX(-15deg); }
                    100% { transform: translateX(200%) skewX(-15deg); }
                }
            `}</style>
        </div>
    );
};

export default MissionTab;
