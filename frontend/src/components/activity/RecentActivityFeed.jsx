import React, { useState, useEffect } from 'react';
import { FaBell, FaShoppingCart, FaMedal, FaTimes, FaSpinner } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { useParams } from 'react-router-dom';

const RecentActivityFeed = () => {
    const { user } = useAuth();
    const { activityId } = useParams();
    const [events, setEvents] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [hasUnread, setHasUnread] = useState(true);

    useEffect(() => {
        if (!isOpen) return;
        const fetchEvents = async () => {
            setIsLoading(true);
            try {
                const res = await fetch(`${import.meta.env.VITE_API_URL}/api/progress/${activityId}/recent-events`, {
                    headers: { 'Authorization': `Bearer ${user.token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setEvents(data);
                    setHasUnread(false);
                }
            } catch (err) {
                console.error("Erro ao buscar feed", err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchEvents();
    }, [activityId, user.token, isOpen]);

    return (
        <div className="relative">
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 rounded-full bg-black/40 hover:bg-black/60 border border-white/10 text-white transition-all transform hover:scale-105"
            >
                <FaBell className="text-xl" />
                {hasUnread && !isOpen && (
                    <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full animate-ping"></span>
                )}
                {hasUnread && !isOpen && (
                    <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full"></span>
                )}
            </button>

            {isOpen && (
                <div className="absolute top-12 right-0 w-80 max-h-96 bg-gray-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col z-50">
                    <div className="p-4 border-b border-white/10 flex justify-between items-center bg-black/50">
                        <h3 className="text-white font-bold tracking-wider uppercase text-sm">Novidades da Turma</h3>
                        <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white">
                            <FaTimes />
                        </button>
                    </div>
                    
                    <div className="overflow-y-auto p-4 flex-1 custom-scrollbar">
                        {isLoading ? (
                            <div className="flex justify-center items-center h-20 text-teal-400">
                                <FaSpinner className="animate-spin text-2xl" />
                            </div>
                        ) : events.length === 0 ? (
                            <p className="text-gray-400 text-sm text-center italic">Nenhuma novidade recente.</p>
                        ) : (
                            <ul className="space-y-4">
                                {events.map((ev, idx) => (
                                    <li key={idx} className="flex gap-3 items-start animate-fade-in-up" style={{ animationDelay: `${idx * 50}ms` }}>
                                        <div className={`mt-1 p-2 rounded-full ${ev.type === 'purchase' ? 'bg-blue-500/20 text-blue-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                                            {ev.type === 'purchase' ? <FaShoppingCart size={12}/> : <FaMedal size={12}/>}
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-200">
                                                <span className="font-bold text-white">{ev.user}</span> {ev.description}
                                            </p>
                                            <span className="text-[10px] text-gray-500">
                                                {ev.timestamp ? new Date(ev.timestamp).toLocaleDateString('pt-BR', {hour: '2-digit', minute:'2-digit'}) : ''}
                                            </span>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default RecentActivityFeed;
