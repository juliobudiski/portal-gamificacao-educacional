import React from 'react';
import { FaDice } from 'react-icons/fa';

const RouletteTab = () => {
    return (
        <div className="bg-gray-800 p-8 rounded-lg text-white text-center">
            <FaDice className="text-6xl text-rose-400 mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-rose-400">Roleta da Sorte</h2>
            <p className="mt-2 text-gray-400">A interface da roleta será implementada aqui em breve!</p>
        </div>
    );
};

export default RouletteTab;