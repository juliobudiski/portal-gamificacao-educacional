import React from 'react';

const CurrentUserBadge = ({ avatar }) => (
    <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 z-50 pointer-events-none">
        <div className="relative flex flex-col items-center">
            <div className="relative">
                <img src={avatar || '/avatars/default_avatar.webp'} alt="Você" className="w-10 h-10 rounded-full border-2 border-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.8)] relative z-10 bg-black/50" />
                <div className="absolute inset-0 rounded-full border-[3px] border-yellow-400 animate-ping opacity-75"></div>
            </div>
            <div className="mt-1 bg-yellow-500 text-black text-[10px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-full shadow-lg">Você Está Aqui</div>
        </div>
    </div>
);

export default CurrentUserBadge;
