import React from 'react';
import { FaBullseye, FaExclamationCircle, FaCheckCircle } from 'react-icons/fa';
import backgroundImage from '../../assets/mission-background.webp';
const MissionTab = ({ activity, onComplete, onReturn }) => {
    if (!activity) return null;

    const { description, currentScenario, desiredScenario } = activity;

    return (



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

            <button
                onClick={onComplete} // A MÁGICA ACONTECE AQUI!
                className="py-3 px-8 rounded-xl text-lg font-semibold text-gray-900 bg-gradient-to-r from-[#ffbd30] to-[#69e8cb] hover:opacity-90 transition-all duration-300 disabled:opacity-50 group shadow-lg"
            >
                Iniciar Jornada!
            </button>
        </div>

    );
};

export default MissionTab;