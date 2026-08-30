// frontend/src/pages/admin/ContactMessagesPage.jsx
import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { CheckCircle, Copy, Inbox, MessageSquare, Search, Mail, Calendar, User } from 'lucide-react';

const ContactMessagesPage = () => {
    const { user } = useContext(AuthContext);
    const [messages, setMessages] = useState([]);
    const [selectedMsg, setSelectedMsg] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [copyFeedback, setCopyFeedback] = useState(false);
    const [filter, setFilter] = useState('all'); // 'all', 'unread'
    const [sendingCode, setSendingCode] = useState(false);

    // --- 1. Fetch de Dados (Padrão do Projeto) ---
    useEffect(() => {
        const fetchMessages = async () => {
            setLoading(true);
            setError(null);

            const token = user?.token;
            if (!token) {
                setError("Token não encontrado.");
                setLoading(false);
                return;
            }

            try {
                // Usando fetch nativo e variáveis de ambiente como nas outras páginas
                const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/contact/messages`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (!response.ok) throw new Error('Falha ao buscar mensagens.');

                const data = await response.json();
                setMessages(data);
            } catch (e) {
                console.error("Erro:", e);
                setError(e.message);
            } finally {
                setLoading(false);
            }
        };

        if (user?.token) {
            fetchMessages();
        }
    }, [user]);

    // --- 2. Ações ---
    const handleSelectMessage = async (msg) => {
        setSelectedMsg(msg);

        // Lógica de marcar como lida
        if (!msg.is_read) {
            // Atualização Otimista (UI muda na hora)
            setMessages(prev => prev.map(m =>
                m.id === msg.id ? { ...m, is_read: true } : m
            ));

            const token = user?.token;
            if (token) {
                try {
                    await fetch(`${import.meta.env.VITE_API_URL}/api/admin/contact/messages/${msg.id}/read`, {
                        method: 'PATCH',
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                } catch (error) {
                    console.error("Erro ao sincronizar status de leitura:", error);
                }
            }
        }
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        setCopyFeedback(true);
        setTimeout(() => setCopyFeedback(false), 2000);
    };

    const handleSendCode = async () => {
        if (!selectedMsg || !user?.token) return;
        if (!window.confirm(`Deseja enviar o código de acesso institucional para ${selectedMsg.email}?`)) return;
        
        setSendingCode(true);
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/contact/messages/${selectedMsg.id}/send_code`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${user.token}` }
            });
            const data = await response.json();
            if (response.ok) {
                alert('Código enviado com sucesso!');
            } else {
                alert(data.message || 'Erro ao enviar o código.');
            }
        } catch (error) {
            console.error("Erro ao enviar código:", error);
            alert("Erro de conexão ao enviar o código.");
        } finally {
            setSendingCode(false);
        }
    };

    // --- 3. Filtragem Local ---
    const filteredMessages = messages.filter(msg => {
        if (filter === 'unread') return !msg.is_read;
        return true;
    });

    // --- 4. Renderização ---
    if (loading) return <div className="text-center text-primary-text p-10">Carregando mensagens...</div>;

    // Altura calculada para preencher a tela considerando o header do admin
    return (
        <div className="animate-fade-in flex flex-col h-[calc(100vh-140px)]">

            {/* Header da Página */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-primary-text mb-2 bg-gradient-to-r from-accent-teal to-accent-purple bg-clip-text text-transparent flex items-center gap-3">
                        <Inbox className="text-accent-purple" size={32} />
                        Fale Conosco
                    </h1>
                    <p className="text-secondary-text">Gerencie as mensagens recebidas via formulário de contato.</p>
                </div>

                {/* Filtros */}
                <div className="flex bg-black/50 backdrop-blur-md p-1 rounded-lg border border-white/10">
                    <button
                        onClick={() => setFilter('all')}
                        className={`px-4 py-2 text-sm rounded-md transition-all ${filter === 'all' ? 'bg-accent-teal/20 text-accent-teal font-bold shadow-sm' : 'text-secondary-text hover:text-primary-text'}`}
                    >
                        Todas
                    </button>
                    <button
                        onClick={() => setFilter('unread')}
                        className={`px-4 py-2 text-sm rounded-md transition-all ${filter === 'unread' ? 'bg-accent-teal/20 text-accent-teal font-bold shadow-sm' : 'text-secondary-text hover:text-primary-text'}`}
                    >
                        Não lidas
                    </button>
                </div>
            </div>

            {error && <div className="bg-red-900/40 text-red-300 p-4 rounded-lg mb-4 border border-red-700">{error}</div>}

            {/* Layout Split: Lista vs Detalhe */}
            <div className="flex flex-1 overflow-hidden bg-secondary-bg rounded-xl shadow-md border border-border-color">

                {/* COLUNA ESQUERDA: LISTA */}
                <div className="w-1/3 min-w-[300px] max-w-[400px] border-r border-border-color flex flex-col bg-secondary-bg">
                    <div className="p-4 border-b border-border-color">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-text" size={16} />
                            <input
                                type="text"
                                placeholder="Buscar remetente..."
                                className="w-full pl-10 pr-4 py-2 bg-primary-bg border border-border-color rounded-lg text-sm text-primary-text focus:ring-2 focus:ring-accent-teal outline-none transition-all shadow-inner hover:shadow-md"
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        {filteredMessages.length === 0 ? (
                            <div className="p-8 text-center text-secondary-text">
                                <p>Nenhuma mensagem.</p>
                            </div>
                        ) : (
                            filteredMessages.map((msg) => (
                                <div
                                    key={msg.id}
                                    onClick={() => handleSelectMessage(msg)}
                                    className={`p-4 border-b border-border-color cursor-pointer transition-colors hover:bg-hover-bg-color0 group
                                        ${selectedMsg?.id === msg.id ? 'bg-accent-teal/5 border-l-4 border-l-accent-teal' : 'border-l-4 border-l-transparent'}
                                    `}
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <span className={`text-sm truncate pr-2 ${!msg.is_read ? 'text-primary-text font-bold' : 'text-secondary-text'}`}>
                                            {msg.name}
                                        </span>
                                        <span className="text-xs text-secondary-text/70 whitespace-nowrap">
                                            {new Date(msg.created_at).toLocaleDateString(undefined, { day: '2-digit', month: '2-digit' })}
                                        </span>
                                    </div>
                                    <p className={`text-sm truncate mb-1 ${!msg.is_read ? 'text-primary-text font-semibold' : 'text-secondary-text'}`}>
                                        {msg.subject}
                                    </p>
                                    <p className="text-xs text-secondary-text truncate opacity-80">
                                        {msg.message}
                                    </p>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* COLUNA DIREITA: LEITURA DETALHADA */}
                <div className="flex-1 bg-transparent overflow-y-auto p-0 relative">
                    {selectedMsg ? (
                        <div className="animate-fade-in h-full flex flex-col">

                            {/* Header da Mensagem */}
                            <div className="p-8 border-b border-border-color bg-secondary-bg sticky top-0 z-10">
                                <div className="flex justify-between items-start mb-6">
                                    <h2 className="text-2xl font-bold text-primary-text leading-tight">
                                        {selectedMsg.subject}
                                    </h2>
                                    <span className="text-xs text-secondary-text bg-primary-bg px-2 py-1 rounded border border-border-color">
                                        {new Date(selectedMsg.created_at).toLocaleString()}
                                    </span>
                                </div>

                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-accent-teal to-accent-purple flex items-center justify-center text-white font-bold text-xl shadow-lg">
                                        {selectedMsg.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-bold text-primary-text text-lg flex items-center gap-2">
                                            {selectedMsg.name}
                                        </p>
                                        <div className="flex items-center gap-2 group">
                                            <Mail size={14} className="text-secondary-text" />
                                            <p className="text-secondary-text text-sm">
                                                {selectedMsg.email}
                                            </p>
                                            <button
                                                onClick={() => copyToClipboard(selectedMsg.email)}
                                                className="text-accent-teal opacity-0 group-hover:opacity-100 transition-all hover:bg-accent-teal/10 p-1 rounded"
                                                title="Copiar email"
                                            >
                                                {copyFeedback ? <CheckCircle size={14} /> : <Copy size={14} />}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Corpo da Mensagem */}
                            <div className="p-8 flex-1">
                                <div className="prose prose-invert max-w-none text-primary-text leading-relaxed whitespace-pre-wrap">
                                    {selectedMsg.message}
                                </div>
                            </div>

                            {/* Footer de Ação */}
                            <div className="p-6 border-t border-border-color bg-secondary-bg flex justify-end gap-3">
                                {selectedMsg.subject && selectedMsg.subject.toLowerCase().includes('código') && (
                                    <button
                                        onClick={handleSendCode}
                                        disabled={sendingCode}
                                        className="flex items-center gap-2 px-4 py-2 bg-accent-yellow hover:bg-yellow-500 text-gray-900 font-bold rounded-lg transition-colors shadow-md disabled:opacity-50"
                                    >
                                        <CheckCircle size={18} />
                                        {sendingCode ? 'Enviando...' : 'Aprovar Professor'}
                                    </button>
                                )}
                                <a
                                    href={`mailto:${selectedMsg.email}?subject=Re: ${selectedMsg.subject}`}
                                    className="flex items-center gap-2 px-4 py-2 bg-accent-teal hover:bg-accent-teal/80 text-primary-text font-semibold rounded-lg transition-colors shadow-md"
                                >
                                    <Mail size={18} />
                                    Responder por E-mail
                                </a>
                            </div>

                        </div>
                    ) : (
                        /* Estado Vazio */
                        <div className="h-full flex flex-col items-center justify-center text-secondary-text opacity-50">
                            <MessageSquare className="w-24 h-24 mb-4 stroke-1" />
                            <p className="text-xl font-medium">Selecione uma mensagem para ler</p>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};

export default ContactMessagesPage;