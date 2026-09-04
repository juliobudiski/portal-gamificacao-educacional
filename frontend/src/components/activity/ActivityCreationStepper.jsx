import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';

const STEPS = [
    { id: 1, label: "Início", short: "Início" },
    { id: 2, label: "Cenário", short: "Cenário" },
    { id: 3, label: "Dinâmica", short: "Dinâm." },
    { id: 4, label: "Perfil", short: "Perfil" },
    { id: 5, label: "Elementos", short: "Elem." },
    { id: 6, label: "Trilha", short: "Trilha" },
    { id: 7, label: "Prêmios", short: "Prêmio" },
    { id: 8, label: "Ações", short: "Ações" },
    { id: 9, label: "Fim", short: "Fim" },
];

const ActivityCreationStepper = ({ currentStep, maxReachedStep, onStepClick, isEditMode }) => {
    const scrollRef = useRef(null);

    const canNavigateTo = (stepId) => {
        return isEditMode || stepId <= maxReachedStep;
    };

    // Auto-scroll para manter o passo ativo visível em telas pequenas
    useEffect(() => {
        if (scrollRef.current) {
            const activeElement = scrollRef.current.querySelector(`[data-step="${currentStep}"]`);
            if (activeElement) {
                activeElement.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
            }
        }
    }, [currentStep]);

    // Cálculo da porcentagem de preenchimento da barra
    const progressPercentage = ((currentStep - 1) / (STEPS.length - 1)) * 100;

    return (
        <div className="w-full mb-12 flex justify-center">
            {/* Container com largura máxima */}
            <div className="w-full max-w-6xl px-2">

                {/* Área Scrollável */}
                <div
                    ref={scrollRef}
                    className="overflow-x-auto pb-12 hide-scrollbar px-4"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                    <div className="relative flex items-center justify-between min-w-[700px] lg:min-w-0 mt-4">

                        {/* --- LINHAS DE FUNDO --- */}

                        {/* Linha Cinza (Total) */}
                        <div className="absolute top-6 left-0 w-full h-1.5 bg-secondary-bg/50 border border-border-color/50 rounded-full z-0" />

                        {/* Linha Colorida (Progresso) - Neon */}
                        <div
                            className="absolute top-6 left-0 h-1.5 bg-gradient-to-r from-accent-purple via-accent-teal to-accent-yellow rounded-full z-0 transition-all duration-700 ease-in-out shadow-[0_0_10px_rgba(20,184,166,0.5)]"
                            style={{ width: `${progressPercentage}%` }}
                        />

                        {/* --- STEPS --- */}
                        {STEPS.map((step) => {
                            const isActive = step.id === currentStep;
                            const isCompleted = step.id < currentStep;
                            const isClickable = canNavigateTo(step.id);

                            return (
                                <div
                                    key={step.id}
                                    data-step={step.id}
                                    className={`
                                        flex flex-col items-center relative z-10 group
                                        ${isClickable ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'}
                                    `}
                                    onClick={() => isClickable && onStepClick(step.id)}
                                >
                                    {/* CÍRCULO / BOTÃO */}
                                    <div
                                        className={`
                                            w-12 h-12 rounded-2xl flex items-center justify-center text-sm font-extrabold transition-all duration-500 transform
                                            ${isActive
                                                ? 'bg-gradient-to-br from-accent-teal to-[#11998E] text-gray-900 scale-110 shadow-[0_0_20px_rgba(20,184,166,0.6)] border-2 border-transparent'
                                                : isCompleted
                                                    ? 'bg-primary-bg border-2 border-accent-purple text-accent-purple hover:bg-accent-purple/10 shadow-[0_0_15px_rgba(157,78,221,0.3)]'
                                                    : isClickable
                                                        ? 'bg-primary-bg border-2 border-border-color text-secondary-text hover:border-accent-teal/50 hover:shadow-lg'
                                                        : 'bg-primary-bg border-2 border-border-color/50 text-border-color'}
                                        `}
                                    >
                                        {isCompleted ? (
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                            </svg>
                                        ) : (
                                            step.id
                                        )}
                                    </div>

                                    {/* LABEL (TEXTO) */}
                                    <div className={`
                                        absolute -bottom-8 w-24 text-center transition-all duration-300
                                        ${isActive
                                            ? 'text-accent-teal font-extrabold translate-y-1'
                                            : isCompleted
                                                ? 'text-accent-purple/90 font-bold'
                                                : 'text-secondary-text font-medium'}
                                    `}>
                                        <span className="text-xs uppercase tracking-wider">{step.label}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Estilo inline para esconder scrollbar */}
            <style>{`
                .hide-scrollbar::-webkit-scrollbar {
                    display: none;
                }
            `}</style>
        </div>
    );
};

ActivityCreationStepper.propTypes = {
    currentStep: PropTypes.number.isRequired,
    maxReachedStep: PropTypes.number.isRequired,
    onStepClick: PropTypes.func.isRequired,
    isEditMode: PropTypes.bool
};

export default ActivityCreationStepper;