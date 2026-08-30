import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';

const STEPS = [
    { id: 1, label: "Cenário Atual", short: "Início" },
    { id: 2, label: "Metas e Objetivos", short: "Cenário" },
    { id: 3, label: "Dinâmica", short: "Dinâmica" },
    { id: 4, label: "Perfil", short: "Perfil" },
    { id: 5, label: "Elementos", short: "Elementos" },
    { id: 6, label: "Tabuleiro", short: "Trilha" },
    { id: 7, label: "Recompensas", short: "Premios" },
    { id: 8, label: "Ações", short: "Ações" },
    { id: 9, label: "Regras", short: "Fim" },
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
        <div className="w-full mb-10 flex justify-center">
            {/* Container com largura máxima para não esticar demais em monitores grandes */}
            <div className="w-full max-w-5xl px-4">

                {/* Área Scrollável (sem scrollbar visual) */}
                <div
                    ref={scrollRef}
                    className="overflow-x-auto pb-4 hide-scrollbar" // hide-scrollbar classe CSS (veja abaixo)
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                    <div className="relative flex items-center justify-between min-w-[600px] md:min-w-0">

                        {/* --- LINHAS DE FUNDO --- */}

                        {/* Linha Cinza (Total) */}
                        <div className="absolute top-5 left-0 w-full h-1 bg-gray-200 dark:bg-hover-bg-color0 rounded z-0" />

                        {/* Linha Colorida (Progresso) */}
                        <div
                            className="absolute top-5 left-0 h-1 bg-gradient-to-r from-teal-400 to-teal-600 rounded z-0 transition-all duration-500 ease-out"
                            style={{ width: `${progressPercentage}%` }}
                        />

                        {/* --- STEPS --- */}
                        {STEPS.map((step) => {
                            const isActive = step.id === currentStep;
                            const isCompleted = step.id < currentStep;
                            const isFuture = step.id > currentStep;
                            const isClickable = canNavigateTo(step.id);

                            return (
                                <div
                                    key={step.id}
                                    data-step={step.id}
                                    className={`
                    flex flex-col items-center relative z-10 group
                    ${isClickable ? 'cursor-pointer' : 'cursor-not-allowed'}
                  `}
                                    onClick={() => isClickable && onStepClick(step.id)}
                                >
                                    {/* CÍRCULO / BOTÃO */}
                                    <div
                                        className={`
                      w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all duration-300
                      ${isActive
                                                ? 'bg-teal-600 border-teal-600 text-white scale-110 shadow-[0_0_15px_rgba(20,184,166,0.5)]'
                                                : isCompleted
                                                    ? 'bg-teal-500 border-teal-500 text-white hover:bg-teal-600'
                                                    : isClickable
                                                        ? 'bg-secondary-bg border-border-color text-gray-500 hover:border-teal-400 dark:hover:border-teal-400'
                                                        : 'bg-secondary-bg border-border-color text-secondary-text dark:text-gray-600'}
                    `}
                                    >
                                        {isCompleted ? (
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                            </svg>
                                        ) : (
                                            step.id
                                        )}
                                    </div>

                                    {/* LABEL (TEXTO) */}
                                    <div className={`
                    mt-2 text-xs font-medium text-center transition-colors duration-300 max-w-[80px] leading-tight
                    ${isActive
                                            ? 'text-teal-700 dark:text-teal-400 font-bold'
                                            : isCompleted
                                                ? 'text-teal-600/80 dark:text-teal-500/80'
                                                : 'text-secondary-text dark:text-gray-600'}
                  `}>
                                        <span className="hidden md:block">{step.label}</span>
                                        <span className="md:hidden">{step.short}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Estilo inline para esconder scrollbar (funciona em Webkit/Chrome/Safari) */}
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