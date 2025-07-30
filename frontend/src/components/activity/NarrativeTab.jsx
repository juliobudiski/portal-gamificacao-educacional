import React, { useState } from 'react';
import { FaPlay, FaArrowRight, FaArrowLeft } from 'react-icons/fa';

const NarrativeTab = ({ narrativeConfig, onStart }) => {
    const [currentLineIndex, setCurrentLineIndex] = useState(0);

    // Se não houver configuração de narrativa, exibe uma mensagem padrão.
    if (!narrativeConfig || !narrativeConfig.scenario || narrativeConfig.characters.length === 0) {
        return (
            <div className="bg-gray-800 p-8 rounded-lg text-white text-center">
                <h2 className="text-2xl font-bold text-yellow-400 mb-4">Missão</h2>
                <p className="text-gray-400">A narrativa para esta atividade ainda não foi configurada.</p>
                <button 
                    onClick={onStart} 
                    className="mt-8 py-3 px-6 bg-green-600 hover:bg-green-700 rounded-lg text-xl font-bold flex items-center justify-center mx-auto"
                >
                    <FaPlay className="mr-2" /> Ir para o Desafio
                </button>
            </div>
        );
    }

    const { scenario, characters, dialogue } = narrativeConfig;
    const currentLine = dialogue[currentLineIndex];
    const currentCharacter = characters.find(c => c.role === currentLine?.characterRole);

    const goToNextLine = () => {
        if (currentLineIndex < dialogue.length - 1) {
            setCurrentLineIndex(prev => prev + 1);
        }
    };

    const goToPreviousLine = () => {
        if (currentLineIndex > 0) {
            setCurrentLineIndex(prev => prev - 1);
        }
    };

    return (
        <div className="bg-gray-800 p-4 sm:p-8 rounded-lg text-white animate-fade-in">
            {/* --- O PALCO DA CENA --- */}
            <div 
                className="relative w-full h-96 bg-cover bg-center rounded-lg mb-4 border-4 border-gray-700 shadow-lg"
                style={{ backgroundImage: `url(${scenario})` }}
            >
                {/* Renderiza os personagens na cena */}
                {characters.map((char, index) => (
                    <img
                        key={index}
                        src={char.image}
                        alt={char.role}
                        className={`absolute bottom-0 h-4/5 object-contain transition-all duration-300 ${
                            currentCharacter?.image === char.image ? 'opacity-100 scale-110' : 'opacity-50 scale-100'
                        }`}
                        style={{ left: `${10 + index * 25}%` }} // Espalha os personagens
                    />
                ))}
            </div>

            {/* --- CAIXA DE DIÁLOGO --- */}
            {currentLine && (
                <div className="bg-gray-900/80 backdrop-blur-sm p-4 rounded-lg border border-gray-600 min-h-[120px]">
                    <h3 className="text-xl font-bold text-yellow-400 mb-2">{currentLine.characterRole}</h3>
                    <p className="text-lg text-gray-200">{currentLine.text}</p>
                </div>
            )}
            
            {/* --- CONTROLES DE NAVEGAÇÃO --- */}
            <div className="flex justify-between items-center mt-6">
                <button 
                    onClick={goToPreviousLine} 
                    disabled={currentLineIndex === 0}
                    className="py-2 px-4 bg-gray-700 hover:bg-gray-600 rounded-lg flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <FaArrowLeft className="mr-2"/> Anterior
                </button>
                
                <span className="text-gray-400">{currentLineIndex + 1} / {dialogue.length}</span>

                {currentLineIndex < dialogue.length - 1 ? (
                    <button 
                        onClick={goToNextLine} 
                        className="py-2 px-4 bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center"
                    >
                        Próximo <FaArrowRight className="ml-2"/>
                    </button>
                ) : (
                    <button 
                        onClick={onStart} 
                        className="py-2 px-4 bg-green-600 hover:bg-green-700 rounded-lg flex items-center font-bold"
                    >
                        Iniciar Desafio! <FaPlay className="ml-2"/>
                    </button>
                )}
            </div>
        </div>
    );
};

export default NarrativeTab;