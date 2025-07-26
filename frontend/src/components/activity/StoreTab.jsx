import React from 'react';
import { FaGem, FaShoppingCart } from 'react-icons/fa';

const StoreTab = ({ items, userPoints, onPurchase }) => (
    <div className="bg-gray-800 p-8 rounded-lg text-white">
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-bold text-green-400">Loja de Recompensas</h2>
            <div className="text-xl font-bold text-yellow-400 flex items-center">
                <FaGem className="mr-2" /> {userPoints} Pontos
            </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {items.map(item => (
                <div key={item.id} className="bg-gray-700 p-4 rounded-lg flex justify-between items-center">
                    <div className="flex items-center">
                        <item.icon className="text-2xl text-green-400 mr-4" />
                        <div>
                            <p className="font-bold text-lg">{item.name}</p>
                            <p className="text-sm text-yellow-400">{item.price} Pontos</p>
                        </div>
                    </div>
                    <button onClick={() => onPurchase(item)} className="py-2 px-4 bg-green-600 rounded-lg font-bold flex items-center" disabled={userPoints < item.price}>
                        <FaShoppingCart className="mr-2"/> Comprar
                    </button>
                </div>
            ))}
        </div>
    </div>
);

export default StoreTab;