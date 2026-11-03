import React from 'react';
import { Trophy, Sparkles, X } from 'lucide-react';

/**
 * ToastGoldAchieve (Melhoria 63: Notificação de Conquista Estilo 'Toast Dourado')
 */
export default function ToastGoldAchieve({ show, title, description, xpBonus, onClose }) {
    if (!show) return null;

    return (
        <aside 
            aria-live="polite" 
            role="status"
            className="fixed top-6 right-6 z-50 max-w-sm w-full bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-gray-950 p-4 rounded-3xl shadow-[0_15px_35px_rgba(234,179,8,0.45)] border-2 border-yellow-200 animate-slide-down flex items-start gap-3.5"
        >
            <div className="p-2.5 rounded-2xl bg-gray-950/20 text-gray-950 shrink-0 mt-0.5">
                <Trophy size={24} className="animate-bounce" />
            </div>

            <div className="flex-1">
                <div className="flex items-center gap-1.5 mb-0.5">
                    <Sparkles size={14} className="text-gray-950" />
                    <span className="text-[11px] font-black uppercase tracking-wider">Nova Conquista!</span>
                </div>
                <h4 className="text-sm font-black leading-tight text-gray-950">{title}</h4>
                {description && <p className="text-xs font-semibold text-gray-900 mt-1">{description}</p>}
                {xpBonus && (
                    <span className="inline-block mt-2 text-[11px] font-black px-2 py-0.5 rounded-full bg-gray-950 text-yellow-300">
                        +{xpBonus} XP BÔNUS
                    </span>
                )}
            </div>

            <button
                onClick={onClose}
                className="text-gray-950/70 hover:text-gray-950 p-1 rounded-lg transition-colors"
                aria-label="Fechar Notificação"
            >
                <X size={18} />
            </button>
        </aside>
    );
}