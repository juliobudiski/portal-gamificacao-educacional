import React from 'react';
import { FaBullseye, FaExclamationCircle, FaCheckCircle } from 'react-icons/fa';
import backgroundImage from '../../assets/mission-background.png';
const MissionTab = ({ activity }) => {
    if (!activity) return null;

    const { description, currentScenario, desiredScenario } = activity;

    return (
        <div className="bg-gray-800 p-8 rounded-lg text-white animate-fade-in space-y-8" 
        style={{
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        minHeight: '600px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '2rem',
        borderRadius: '1rem',
        boxShadow: '0 5px 15px rgba(0, 0, 0, 0.5)',
        color: 'white',
        width: '90%',
        maxWidth: '1200px',
        }}>
            <div>
                <h2 className="text-3xl font-bold text-center text-yellow-400 mb-4 flex items-center justify-center">
                    <FaBullseye className="mr-3" />
                    Objetivos da Missão
                </h2>
                <p className="text-lg text-gray-300 text-center italic">
                    {description || "Nenhuma descrição fornecida para esta atividade."}
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Cenário Atual */}
                <div className="bg-gray-700/50 p-6 rounded-xl border border-red-500/30">
                    <h3 className="text-xl font-semibold text-red-400 mb-3 flex items-center">
                        <FaExclamationCircle className="mr-2" />
                        Cenário Atual (Os Desafios)
                    </h3>
                    <ul className="list-disc list-inside space-y-2 text-gray-300">
                        {currentScenario?.problems?.map((problem, index) => (
                            <li key={index}>{problem}</li>
                        ))}
                        {currentScenario?.otherProblem && <li>{currentScenario.otherProblem}</li>}
                    </ul>
                </div>

                {/* Cenário Desejado */}
                <div className="bg-gray-700/50 p-6 rounded-xl border border-green-500/30">
                    <h3 className="text-xl font-semibold text-green-400 mb-3 flex items-center">
                        <FaCheckCircle className="mr-2" />
                        Cenário Desejado (As Metas)
                    </h3>
                    <ul className="list-disc list-inside space-y-2 text-gray-300">
                        {desiredScenario?.objectives?.map((objective, index) => (
                            <li key={index}>{objective}</li>
                        ))}
                        {desiredScenario?.otherObjective && <li>{desiredScenario.otherObjective}</li>}
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default MissionTab;