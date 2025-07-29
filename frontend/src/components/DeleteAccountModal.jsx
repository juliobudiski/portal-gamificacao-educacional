import React from 'react';
import { FaKey } from "react-icons/fa";

// Este é um componente de UI puro. Ele não sabe 'como' deletar uma conta,
// apenas exibe a interface e notifica o componente pai quando os botões são clicados.
const DeleteAccountModal = ({ onConfirm, onCancel, password, setPassword, message }) => (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
        <div className="bg-gray-800 p-8 rounded-2xl shadow-xl max-w-md w-full border border-red-500/50">
            <h3 className="text-2xl font-bold text-red-400 mb-4 text-center">Confirmar Exclusão de Conta</h3>
            <p className="text-gray-300 text-center mb-6">
                Esta ação é irreversível. Para confirmar, por favor, digite sua senha atual.
            </p>
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center">
                        <FaKey className="mr-2 text-red-400" /> Senha Atual:
                    </label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="mt-1 block w-full px-4 py-3 bg-[#2c3135] border border-[#4a525a] text-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                        placeholder="Digite sua senha"
                    />
                </div>
                {message && (
                    <div className="bg-red-500/20 text-red-300 p-3 rounded-xl text-center">
                        {message}
                    </div>
                )}
                <div className="flex justify-between gap-4 mt-6">
                    <button
                        onClick={onCancel}
                        className="w-full py-3 px-4 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg shadow-md transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={onConfirm}
                        className="w-full py-3 px-4 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg shadow-md transition-colors"
                    >
                        Confirmar Exclusão
                    </button>
                </div>
            </div>
        </div>
    </div>
);

export default DeleteAccountModal;