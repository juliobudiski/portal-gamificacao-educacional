// frontend/src/pages/admin/ContactMessagesPage.jsx
import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { 
    CheckCircle, 
    Copy, 
    Inbox, 
    MessageSquare, 
    Search, 
    Mail, 
    Calendar, 
    User, 
    Key, 
    Check, 
    Loader2, 
    Send, 
    Sparkles, 
    Clock, 
    AlertCircle 
} from 'lucide-react';

/**
 * ContactMessagesPage
 * 
 * Architectural intent: Provides an administrative interface for managing platform communications
 * and one-click teacher authorization. It utilizes a split-pane Master-Detail layout with real-time
 * status filters (All, Pending, Approved), instant optimistic feedback, and key-generation workflows.
 */
const ContactMessagesPage = () => {
    const { user } = useContext(AuthContext);
    const { showToast } = useToast();
    const [messages, setMessages] = useState([]);
    const [selectedMsg, setSelectedMsg] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [copyFeedback, setCopyFeedback] = useState(false);
    const [codeCopyFeedback, setCodeCopyFeedback] = useState(false);
    const [filter, setFilter] = useState('all'); // 'all', 'pending', 'approved', 'unread'
    const [approving, setApproving] = useState(false);

    // --- 1. Fetch de Dados ---
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
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/contact/messages`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) throw new Error('Falha ao carregar mensagens e solicitações.');

            const data = await response.json();
            setMessages(data);
            
            // Mantém selecionado o item atual se ainda existir na lista
            if (selectedMsg) {
                const updated = data.find(m => m.id === selectedMsg.id);
                if (updated) setSelectedMsg(updated);
            }
        } catch (e) {
            console.error("Erro ao carregar mensagens:", e);
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user?.token) {
            fetchMessages();
        }
    }, [user]);

    // --- 2. Ações de Seleção e Leitura ---
    const handleSelectMessage = async (msg) => {
        setSelectedMsg(msg);

        if (!msg.is_read) {
            // Atualização Otimista
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

    const copyToClipboard = (text, isCode = false) => {
        navigator.clipboard.writeText(text);
        if (isCode) {
            setCodeCopyFeedback(true);
            setTimeout(() => setCodeCopyFeedback(false), 2000);
            showToast("Chave de acesso copiada para a área de transferência!", "info");
        } else {
            setCopyFeedback(true);
            setTimeout(() => setCopyFeedback(false), 2000);
            showToast("E-mail copiado!", "info");
        }
    };

    // --- 3. Aprovação em 1 Clique (ÉPICO 2 & 3) ---
    const handleApproveTeacher = async () => {
        if (!selectedMsg || !user?.token || approving) return;

        setApproving(true);
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/solicitacoes/${selectedMsg.id}/aprovar`, {
                method: 'POST',
                headers: { 
                    'Authorization': `Bearer ${user.token}`,
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();

            if (response.ok) {
                const generatedCode = data.access_code;
                
                // Atualização otimista local
                const updatedMsg = { 
                    ...selectedMsg, 
                    status: 'Aprovada', 
                    access_code: generatedCode,
                    is_read: true 
                };

                setSelectedMsg(updatedMsg);
                setMessages(prev => prev.map(m => m.id === selectedMsg.id ? updatedMsg : m));

                const emailStatus = data.email_sent ? "e enviada por e-mail!" : "(Dev: verifique o console do backend)";
                showToast(`Professor aprovado com sucesso! Chave: ${generatedCode} ${emailStatus}`, "success");
            } else {
                showToast(data.message || "Erro ao aprovar solicitação.", "error");
            }
        } catch (err) {
            console.error("Erro ao aprovar professor:", err);
            showToast("Erro de conexão ao processar aprovação.", "error");
        } finally {
            setApproving(false);
        }
    };

    // --- 4. Filtragem e Busca ---
    const filteredMessages = messages.filter(msg => {
        const matchesSearch = 
            (msg.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (msg.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (msg.subject || '').toLowerCase().includes(searchTerm.toLowerCase());

        if (!matchesSearch) return false;

        const isTeacherRequest = (msg.subject || '').toLowerCase().includes('código') || 
                                (msg.subject || '').toLowerCase().includes('professor') ||
                                (msg.subject || '').toLowerCase().includes('solicitação');

        if (filter === 'unread') return !msg.is_read;
        if (filter === 'pending') return (msg.status === 'Pendente' || !msg.status) && isTeacherRequest;
        if (filter === 'approved') return msg.status === 'Aprovada';
        return true;
    });

    const pendingCount = messages.filter(m => 
        (m.status === 'Pendente' || !m.status) && 
        ((m.subject || '').toLowerCase().includes('código') || (m.subject || '').toLowerCase().includes('professor'))
    ).length;

    const unreadCount = messages.filter(m => !m.is_read).length;

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-primary-text space-y-4">
                <Loader2 className="w-10 h-10 animate-spin text-accent-teal" />
                <p className="text-secondary-text font-medium text-lg">Carregando solicitações e mensagens...</p>
            </div>
        );
    }

    return (
        <div className="animate-fade-in flex flex-col h-[calc(100vh-140px)] space-y-4">
            {/* Header da Página com Estatísticas Rápidas */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-secondary-bg border border-border-color p-5 rounded-2xl shadow-sm">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-primary-text flex items-center gap-3">
                        <div className="p-2.5 bg-accent-purple/10 text-accent-purple rounded-xl">
                            <Inbox size={26} />
                        </div>
                        Central de Solicitações & Mensagens
                    </h1>
                    <p className="text-secondary-text text-sm mt-1">
                        Gerencie pedidos de novos professores, emita chaves seguras e atenda o Fale Conosco.
                    </p>
                </div>

                {/* Filtros em Pílulas */}
                <div className="flex flex-wrap items-center gap-2 bg-primary-bg/70 p-1.5 rounded-xl border border-border-color">
                    <button
                        onClick={() => setFilter('all')}
                        className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                            filter === 'all' 
                                ? 'bg-accent-teal text-white shadow-md' 
                                : 'text-secondary-text hover:text-primary-text hover:bg-secondary-bg'
                        }`}
                    >
                        Todas ({messages.length})
                    </button>
                    <button
                        onClick={() => setFilter('pending')}
                        className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                            filter === 'pending' 
                                ? 'bg-accent-yellow text-gray-900 font-bold shadow-md' 
                                : 'text-secondary-text hover:text-primary-text hover:bg-secondary-bg'
                        }`}
                    >
                        <Clock size={12} />
                        Pendentes {pendingCount > 0 && <span className="bg-red-500 text-white px-1.5 py-0.2 rounded-full text-[10px]">{pendingCount}</span>}
                    </button>
                    <button
                        onClick={() => setFilter('approved')}
                        className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                            filter === 'approved' 
                                ? 'bg-green-600 text-white font-bold shadow-md' 
                                : 'text-secondary-text hover:text-primary-text hover:bg-secondary-bg'
                        }`}
                    >
                        <CheckCircle size={12} />
                        Aprovadas
                    </button>
                    <button
                        onClick={() => setFilter('unread')}
                        className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                            filter === 'unread' 
                                ? 'bg-accent-purple text-white shadow-md' 
                                : 'text-secondary-text hover:text-primary-text hover:bg-secondary-bg'
                        }`}
                    >
                        Não Lidas {unreadCount > 0 && `(${unreadCount})`}
                    </button>
                </div>
            </div>

            {error && (
                <div className="flex items-center gap-3 bg-red-900/30 text-red-300 p-4 rounded-xl border border-red-700/50">
                    <AlertCircle size={20} className="text-red-400 flex-shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            {/* Layout Split: Lista de Mensagens vs Painel de Ações e Detalhes */}
            <div className="flex flex-1 overflow-hidden bg-secondary-bg rounded-2xl shadow-lg border border-border-color">

                {/* COLUNA ESQUERDA: LISTA DE SOLICITAÇÕES */}
                <div className="w-full md:w-[380px] lg:w-[420px] border-r border-border-color flex flex-col bg-secondary-bg/50">
                    <div className="p-4 border-b border-border-color">
                        <div className="relative">
                            <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-secondary-text" size={16} />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Buscar por nome, e-mail ou assunto..."
                                className="w-full pl-10 pr-4 py-2 bg-primary-bg border border-border-color rounded-xl text-sm text-primary-text focus:ring-2 focus:ring-accent-teal outline-none transition-all shadow-inner"
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto divide-y divide-border-color/50 custom-scrollbar">
                        {filteredMessages.length === 0 ? (
                            <div className="p-12 text-center text-secondary-text flex flex-col items-center justify-center space-y-3">
                                <Inbox className="w-12 h-12 stroke-1 opacity-40 text-accent-teal" />
                                <p className="font-medium">Nenhuma solicitação encontrada para o filtro ativo.</p>
                            </div>
                        ) : (
                            filteredMessages.map((msg) => {
                                const isSelected = selectedMsg?.id === msg.id;
                                const isApproved = msg.status === 'Aprovada';
                                const isTeacherRequest = (msg.subject || '').toLowerCase().includes('código') || 
                                                        (msg.subject || '').toLowerCase().includes('professor');

                                return (
                                    <div
                                        key={msg.id}
                                        onClick={() => handleSelectMessage(msg)}
                                        className={`p-4 cursor-pointer transition-all duration-200 border-l-4 group relative
                                            ${isSelected 
                                                ? 'bg-accent-teal/10 border-l-accent-teal shadow-inner' 
                                                : 'border-l-transparent hover:bg-hover-bg-color'
                                            }
                                        `}
                                    >
                                        <div className="flex justify-between items-start mb-1.5 gap-2">
                                            <span className={`text-sm truncate font-medium ${!msg.is_read ? 'text-primary-text font-bold' : 'text-primary-text/80'}`}>
                                                {msg.name}
                                            </span>
                                            <span className="text-[11px] text-secondary-text whitespace-nowrap bg-primary-bg/60 px-2 py-0.5 rounded-full border border-border-color">
                                                {new Date(msg.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-2 mb-1">
                                            <p className={`text-sm truncate ${!msg.is_read ? 'font-bold text-primary-text' : 'text-secondary-text font-medium'}`}>
                                                {msg.subject}
                                            </p>
                                        </div>

                                        <p className="text-xs text-secondary-text line-clamp-2 leading-relaxed opacity-75 mb-2">
                                            {msg.message}
                                        </p>

                                        <div className="flex items-center gap-2">
                                            {isApproved ? (
                                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-green-400 bg-green-500/10 px-2 py-0.5 rounded-md border border-green-500/20">
                                                    <CheckCircle size={11} /> Aprovado
                                                </span>
                                            ) : isTeacherRequest ? (
                                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-yellow-400 bg-yellow-500/10 px-2 py-0.5 rounded-md border border-yellow-500/20">
                                                    <Clock size={11} /> Solicitação Professor
                                                </span>
                                            ) : null}

                                            {msg.access_code && (
                                                <span className="inline-flex items-center gap-1 text-[11px] font-mono text-accent-teal bg-accent-teal/10 px-2 py-0.5 rounded-md border border-accent-teal/20">
                                                    <Key size={10} /> {msg.access_code}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* COLUNA DIREITA: DETALHE COMPLETO E AÇÕES RÁPIDAS */}
                <div className="flex-1 bg-primary-bg/30 overflow-y-auto relative flex flex-col">
                    {selectedMsg ? (
                        <div className="animate-fade-in flex flex-col h-full">

                            {/* Header Superior da Mensagem com Card de Perfil */}
                            <div className="p-6 lg:p-8 border-b border-border-color bg-secondary-bg/80 sticky top-0 z-10 backdrop-blur-md">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                                    <div>
                                        <h2 className="text-2xl font-bold text-primary-text flex items-center gap-2">
                                            {selectedMsg.subject}
                                        </h2>
                                        <span className="text-xs text-secondary-text mt-1 block">
                                            Recebido em {new Date(selectedMsg.created_at).toLocaleString('pt-BR')}
                                        </span>
                                    </div>

                                    {/* Status Badge */}
                                    <div>
                                        {selectedMsg.status === 'Aprovada' ? (
                                            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-green-500/20 text-green-400 border border-green-500/30 shadow-sm">
                                                <CheckCircle size={14} /> Professor Aprovado
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 shadow-sm">
                                                <Clock size={14} /> Aguardando Decisão
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 bg-primary-bg/70 p-4 rounded-xl border border-border-color">
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent-teal to-accent-purple flex items-center justify-center text-white font-extrabold text-xl shadow-md">
                                        {selectedMsg.name?.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-primary-text text-base truncate">
                                            {selectedMsg.name}
                                        </p>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <Mail size={13} className="text-secondary-text flex-shrink-0" />
                                            <span className="text-secondary-text text-sm truncate">
                                                {selectedMsg.email}
                                            </span>
                                            <button
                                                onClick={() => copyToClipboard(selectedMsg.email)}
                                                className="text-accent-teal hover:text-white transition-colors p-1 rounded hover:bg-accent-teal/20"
                                                title="Copiar e-mail"
                                            >
                                                {copyFeedback ? <Check size={14} /> : <Copy size={14} />}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Conteúdo da Mensagem */}
                            <div className="p-6 lg:p-8 flex-1 space-y-6">
                                <div className="bg-secondary-bg/60 p-6 rounded-2xl border border-border-color shadow-sm">
                                    <h3 className="text-xs font-bold text-secondary-text uppercase tracking-wider mb-3">Mensagem Enviada</h3>
                                    <div className="prose prose-invert max-w-none text-primary-text leading-relaxed whitespace-pre-wrap text-base">
                                        {selectedMsg.message}
                                    </div>
                                </div>

                                {/* Se já houver chave de acesso emitida, exibe o cartão da chave */}
                                {selectedMsg.access_code && (
                                    <div className="bg-gradient-to-r from-accent-teal/10 via-accent-purple/10 to-transparent p-6 rounded-2xl border border-accent-teal/30 shadow-md">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-xs font-bold text-accent-teal uppercase tracking-wider flex items-center gap-1.5">
                                                    <Key size={14} /> Chave Institucional Emitida
                                                </p>
                                                <p className="text-2xl font-mono font-extrabold text-primary-text mt-1">
                                                    {selectedMsg.access_code}
                                                </p>
                                                <p className="text-xs text-secondary-text mt-1">
                                                    Esta chave foi vinculada exclusivamente ao e-mail <strong>{selectedMsg.email}</strong>.
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => copyToClipboard(selectedMsg.access_code, true)}
                                                className="flex items-center gap-2 px-4 py-2 bg-secondary-bg hover:bg-hover-bg-color text-primary-text font-semibold rounded-xl border border-border-color transition-all shadow-sm"
                                            >
                                                {codeCopyFeedback ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
                                                {codeCopyFeedback ? 'Copiado' : 'Copiar Chave'}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Footer de Ações Rápidas (1-Clique Aprovação) */}
                            <div className="p-6 border-t border-border-color bg-secondary-bg flex flex-wrap items-center justify-between gap-4">
                                <div className="text-xs text-secondary-text">
                                    {selectedMsg.status === 'Aprovada' 
                                        ? 'Solicitação já aprovada pelo administrador.' 
                                        : 'Aprovar gerará uma chave única e enviará um e-mail ao solicitante.'
                                    }
                                </div>

                                <div className="flex items-center gap-3">
                                    <a
                                        href={`mailto:${selectedMsg.email}?subject=Re: ${selectedMsg.subject}`}
                                        className="flex items-center gap-2 px-4 py-2.5 bg-secondary-bg hover:bg-hover-bg-color text-primary-text font-semibold rounded-xl border border-border-color transition-all shadow-sm"
                                    >
                                        <Send size={16} />
                                        Responder por E-mail
                                    </a>

                                    <button
                                        onClick={handleApproveTeacher}
                                        disabled={approving || selectedMsg.status === 'Aprovada'}
                                        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all shadow-lg text-sm ${
                                            selectedMsg.status === 'Aprovada'
                                                ? 'bg-green-600/30 text-green-300 border border-green-500/30 cursor-not-allowed'
                                                : 'bg-gradient-to-r from-accent-yellow to-yellow-500 hover:from-yellow-400 hover:to-yellow-500 text-gray-950 hover:shadow-yellow-500/20 active:scale-95'
                                        }`}
                                    >
                                        {approving ? (
                                            <>
                                                <Loader2 size={18} className="animate-spin" />
                                                Gerando Chave & Enviando...
                                            </>
                                        ) : selectedMsg.status === 'Aprovada' ? (
                                            <>
                                                <CheckCircle size={18} />
                                                Professor Já Aprovado
                                            </>
                                        ) : (
                                            <>
                                                <Sparkles size={18} />
                                                Aprovar e Enviar Chave
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>

                        </div>
                    ) : (
                        /* Estado Vazio */
                        <div className="h-full flex flex-col items-center justify-center text-secondary-text p-10 text-center space-y-4">
                            <div className="p-6 bg-secondary-bg rounded-3xl border border-border-color shadow-inner">
                                <MessageSquare className="w-16 h-16 stroke-1 text-accent-teal/60" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-primary-text">Nenhuma mensagem selecionada</h3>
                                <p className="text-sm text-secondary-text max-w-sm mt-1">
                                    Escolha uma mensagem ou solicitação na lista lateral para revisar o conteúdo e emitir credenciais.
                                </p>
                            </div>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};

export default ContactMessagesPage;
