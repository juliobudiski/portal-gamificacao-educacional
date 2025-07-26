import React from 'react';
import { FaGamepad } from 'react-icons/fa';

const NarrativeTab = ({ title, content, objective, onStart }) => (
    <div className="bg-gray-800 p-8 rounded-lg text-white animate-fade-in">
        <h2 className="text-4xl font-bold text-yellow-400 mb-4">{title}</h2>
        <p className="text-lg leading-relaxed mb-6">{content}</p>
        <div className="p-4 border-l-4 border-green-500 bg-gray-700 rounded-r-lg">
            <h3 className="text-xl font-bold text-green-400 flex items-center"><FaGamepad className="mr-2" /> Sua Missão</h3>
            <p className="text-lg mt-2">{objective}</p>
        </div>
        <button onClick={onStart} className="mt-8 w-full py-3 px-6 bg-green-600 hover:bg-green-700 rounded-lg text-xl font-bold flex items-center justify-center">
            Iniciar Desafio!
        </button>
    </div>
);

export default NarrativeTab;