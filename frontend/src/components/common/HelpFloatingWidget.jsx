import React, { useState, useEffect, useRef } from 'react';
import { 
    HelpCircle, X, Search, BookOpen, Compass, RotateCcw, 
    MessageSquare, Send, ChevronDown, Sparkles, Trophy, 
    GraduationCap, Users, ShieldCheck, ExternalLink,
    Zap, Lightbulb, CheckCircle2
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTutorial } from '../../context/TutorialContext';
import { useAuth } from '../../context/AuthContext';
import { 
    STUDENT_DASHBOARD_STEPS, 
    TEACHER_DASHBOARD_STEPS,
    ACTIVITY_SELECTION_STEPS 
} from '../../data/tutorialSteps';

/**
 * HelpFloatingWidget (Central de Ajuda Inteligente e Multiuso)
 * Fornece:
 * - Busca dinâmica e filtragem por categorias em tempo real.
 * - FAQs categorizadas (Geral, Aluno/Gamificação, Professor, Resolução de Problemas).
 * - Tours interativos com múltiplos pontos de partida (Dashboard, Criação de Atividades).
 * - Atalhos inteligentes rápidos com base no perfil do usuário logado.
 * - Acesso direto ao canal de Suporte & Fale Conosco (/contact) com pré-preenchimento.
 * - Posicionamento responsivo sem sobreposição (bottom-20 em mobile e bottom-6 em desktop).
 */
export default function HelpFloatingWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('faq'); // 'faq' | 'shortcuts' | 'tours' | 'support'
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [expandedFaqIndex, setExpandedFaqIndex] = useState(null);
    const widgetRef = useRef(null);

    const { startTour } = useTutorial();
    const { user, isAuthenticated } = useAuth();

    // Fecha ao pressionar ESC ou clicar fora do widget
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                setIsOpen(false);
            }
        };

        const handleClickOutside = (e) => {
            if (widgetRef.current && !widgetRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    const faqItems = [
        {
            category: 'gamification',
            badge: 'Gamificação',
            q: 'Como ganho moedas de ouro e XP?',
            a: 'Ao responder perguntas dos quizzes nos nós das trilhas de aprendizagem, acertar na primeira tentativa concede bônus de XP. Você também pode girar a Roleta Diária na Vila da Aventura e conquistar medalhas por completar trilhas inteiras.'
        },
        {
            category: 'gamification',
            badge: 'Trilhas',
            q: 'O que fazer se uma fase/nó do tabuleiro estiver bloqueado?',
            a: 'Para avançar em um tabuleiro gamificado, você deve concluir com aprovação mínima os nós imediatamente anteriores. Se o prazo da atividade já expirou, consulte seu professor para verificar a reabertura.'
        },
        {
            category: 'gamification',
            badge: 'Cosméticos',
            q: 'Como equipar novos avatares, títulos ou medalhas?',
            a: 'Acesse o menu superior "Perfil" -> "Minhas Configurações" ou vá à Loja de Itens usando suas moedas acumuladas. Lá você poderá selecionar avatares lendários e títulos especiais para exibir no ranking.'
        },
        {
            category: 'teacher',
            badge: 'Professor',
            q: 'Como criar uma turma e convidar alunos?',
            a: 'Acesse o Painel do Professor, clique em "Gerenciar Turmas" e selecione "Criar Nova Turma". Um código único de turma será gerado automaticamente para você compartilhar com os alunos.'
        },
        {
            category: 'teacher',
            badge: 'Professor',
            q: 'Como vincular uma atividade criada a uma turma?',
            a: 'No "Banco de Atividades", localize a missão desejada e clique em "Atribuir à Turma". Você poderá definir data de início, prazo final de entrega e regras de pontuação.'
        },
        {
            category: 'general',
            badge: 'Conta',
            q: 'Esqueci minha senha ou preciso alterar meus dados?',
            a: 'Na tela de Login, utilize a opção "Esqueceu a senha?". Se já estiver conectado, vá até seu Perfil para alterar nome, preferências e senha de acesso.'
        },
        {
            category: 'general',
            badge: 'Tema',
            q: 'Como alternar entre o Modo Claro e o Modo Escuro?',
            a: 'Você pode alternar o tema a qualquer momento clicando no botão com ícone de Sol/Lua presente no cabeçalho superior direito da plataforma.'
        },
        {
            category: 'troubleshooting',
            badge: 'Ajuda Técnica',
            q: 'A roleta ou quiz não carregou corretamente. O que fazer?',
            a: 'Verifique sua conexão de internet e recarregue a página (F5 ou Ctrl+R). Caso o problema persista, utilize a aba "Suporte" aqui na Central de Ajuda para enviar uma mensagem diretamente aos desenvolvedores.'
        }
    ];

    const categories = [
        { id: 'all', label: 'Tudo' },
        { id: 'gamification', label: 'Jogos & XP' },
        { id: 'teacher', label: 'Professor' },
        { id: 'general', label: 'Geral' },
        { id: 'troubleshooting', label: 'Problemas' },
    ];

    const filteredFaqs = faqItems.filter(item => {
        const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
        const matchesSearch = 
            item.q.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.a.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.badge.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    const handleStartTour = (type) => {
        if (type === 'teacher_dash') {
            startTour(TEACHER_DASHBOARD_STEPS, 'teacher_dashboard_v1', true);
        } else if (type === 'student_dash') {
            startTour(STUDENT_DASHBOARD_STEPS, 'student_dashboard_v1', true);
        } else if (type === 'activity_creation') {
            startTour(ACTIVITY_SELECTION_STEPS, 'activity_selection_v1', true);
        }
        setIsOpen(false);
    };

    const toggleFaq = (index) => {
        setExpandedFaqIndex(expandedFaqIndex === index ? null : index);
    };

    return (
        <aside aria-label="Central de Ajuda e Suporte" className="fixed bottom-20 md:bottom-6 right-5 z-40">
            {/* Botão Acionador Flutuante */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="w-14 h-14 bg-gradient-to-r from-accent-teal via-cyan-500 to-accent-teal hover:from-accent-teal/90 hover:to-cyan-400 text-gray-950 rounded-full shadow-[0_10px_25px_rgba(13,148,136,0.4)] flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 group focus:outline-none focus:ring-4 focus:ring-accent-teal/50 border-2 border-white/20"
                    title="Central de Ajuda e Recursos"
                    aria-label="Abrir Central de Ajuda"
                >
                    <HelpCircle size={28} className="text-gray-950 transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110" />
                </button>
            )}

            {/* Modal / Painel da Central de Ajuda */}
            {isOpen && (
                <div 
                    ref={widgetRef}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="help-center-title"
                    className="w-[92vw] sm:w-[420px] max-w-[440px] bg-secondary-bg/95 backdrop-blur-2xl border border-accent-teal/30 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.35)] overflow-hidden flex flex-col max-h-[85vh] sm:max-h-[580px] transition-all animate-fade-in"
                >
                    {/* Header Principal */}
                    <div className="p-4 bg-gradient-to-r from-accent-teal/20 via-cyan-500/10 to-accent-purple/20 border-b border-border-color flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                            <div className="p-2 rounded-xl bg-accent-teal/20 text-accent-teal">
                                <Compass size={20} />
                            </div>
                            <div>
                                <h3 id="help-center-title" className="font-extrabold text-primary-text text-base leading-tight">
                                    Central de Ajuda
                                </h3>
                                <p className="text-[11px] text-secondary-text">Guias, respostas e suporte em tempo real</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="text-secondary-text hover:text-primary-text p-2 rounded-xl hover:bg-white/10 transition-colors"
                            aria-label="Fechar Central de Ajuda"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    {/* Barra de Abas de Navegação */}
                    <div className="flex border-b border-border-color/60 bg-primary-bg/50 px-2 pt-2 gap-1 overflow-x-auto custom-scrollbar">
                        <button
                            onClick={() => setActiveTab('faq')}
                            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-t-xl transition-all whitespace-nowrap ${
                                activeTab === 'faq'
                                    ? 'bg-secondary-bg text-accent-teal border-t-2 border-accent-teal shadow-sm'
                                    : 'text-secondary-text hover:text-primary-text hover:bg-white/5'
                            }`}
                        >
                            <BookOpen size={14} /> Dúvidas (FAQ)
                        </button>
                        <button
                            onClick={() => setActiveTab('shortcuts')}
                            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-t-xl transition-all whitespace-nowrap ${
                                activeTab === 'shortcuts'
                                    ? 'bg-secondary-bg text-accent-yellow border-t-2 border-accent-yellow shadow-sm'
                                    : 'text-secondary-text hover:text-primary-text hover:bg-white/5'
                            }`}
                        >
                            <Zap size={14} /> Atalhos
                        </button>
                        <button
                            onClick={() => setActiveTab('tours')}
                            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-t-xl transition-all whitespace-nowrap ${
                                activeTab === 'tours'
                                    ? 'bg-secondary-bg text-accent-purple border-t-2 border-accent-purple shadow-sm'
                                    : 'text-secondary-text hover:text-primary-text hover:bg-white/5'
                            }`}
                        >
                            <Sparkles size={14} /> Tutoriais
                        </button>
                        <button
                            onClick={() => setActiveTab('support')}
                            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-t-xl transition-all whitespace-nowrap ${
                                activeTab === 'support'
                                    ? 'bg-secondary-bg text-cyan-500 border-t-2 border-cyan-500 shadow-sm'
                                    : 'text-secondary-text hover:text-primary-text hover:bg-white/5'
                            }`}
                        >
                            <MessageSquare size={14} /> Suporte
                        </button>
                    </div>

                    {/* Conteúdo Dinâmico por Aba */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                        {/* ABA 1: PERGUNTAS FREQUENTES (FAQ) */}
                        {activeTab === 'faq' && (
                            <div className="space-y-3">
                                {/* Campo de Busca */}
                                <div className="relative">
                                    <Search className="absolute left-3.5 top-2.5 text-secondary-text" size={16} />
                                    <input
                                        type="text"
                                        placeholder="Buscar resposta ou palavra-chave..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full bg-primary-bg/80 border border-border-color rounded-xl pl-9 pr-3 py-2 text-xs text-primary-text placeholder-secondary-text focus:outline-none focus:border-accent-teal shadow-inner"
                                    />
                                    {searchTerm && (
                                        <button 
                                            onClick={() => setSearchTerm('')} 
                                            className="absolute right-3 top-2.5 text-secondary-text hover:text-primary-text text-xs"
                                        >
                                            Limpar
                                        </button>
                                    )}
                                </div>

                                {/* Categorias Rápidas */}
                                <div className="flex gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
                                    {categories.map(cat => (
                                        <button
                                            key={cat.id}
                                            onClick={() => setSelectedCategory(cat.id)}
                                            className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg transition-colors whitespace-nowrap border ${
                                                selectedCategory === cat.id
                                                    ? 'bg-accent-teal text-gray-950 border-accent-teal shadow-sm'
                                                    : 'bg-primary-bg/60 text-secondary-text border-border-color/60 hover:text-primary-text'
                                            }`}
                                        >
                                            {cat.label}
                                        </button>
                                    ))}
                                </div>

                                {/* Lista Sanfona de FAQs */}
                                <div className="space-y-2 mt-2">
                                    {filteredFaqs.length > 0 ? (
                                        filteredFaqs.map((faq, idx) => {
                                            const isExpanded = expandedFaqIndex === idx;
                                            return (
                                                <div 
                                                    key={idx} 
                                                    className="bg-primary-bg/60 rounded-xl border border-border-color/60 overflow-hidden transition-all duration-200 hover:border-accent-teal/40"
                                                >
                                                    <button
                                                        onClick={() => toggleFaq(idx)}
                                                        className="w-full text-left p-3 flex items-start justify-between gap-2 transition-colors hover:bg-white/5"
                                                    >
                                                        <div className="flex items-start gap-2">
                                                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-accent-purple/10 text-accent-purple border border-accent-purple/20 uppercase tracking-wider shrink-0 mt-0.5">
                                                                {faq.badge}
                                                            </span>
                                                            <span className="text-xs font-bold text-primary-text leading-snug">
                                                                {faq.q}
                                                            </span>
                                                        </div>
                                                        <ChevronDown 
                                                            size={16} 
                                                            className={`text-secondary-text transition-transform duration-200 shrink-0 mt-0.5 ${isExpanded ? 'rotate-180 text-accent-teal' : ''}`} 
                                                        />
                                                    </button>
                                                    {isExpanded && (
                                                        <div className="px-3 pb-3 pt-1 border-t border-border-color/30">
                                                            <p className="text-xs text-secondary-text leading-relaxed">
                                                                {faq.a}
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <div className="text-center py-8 space-y-2">
                                            <p className="text-xs text-secondary-text">
                                                Nenhuma resposta encontrada para "{searchTerm}".
                                            </p>
                                            <button
                                                onClick={() => { setSearchTerm(''); setSelectedCategory('all'); }}
                                                className="text-xs text-accent-teal font-semibold hover:underline"
                                            >
                                                Ver todas as dúvidas
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* ABA 2: ATALHOS RÁPIDOS DA PLATAFORMA */}
                        {activeTab === 'shortcuts' && (
                            <div className="space-y-3">
                                <p className="text-xs text-secondary-text">
                                    Navegue rapidamente para as áreas mais importantes da sua conta:
                                </p>

                                <div className="grid grid-cols-1 gap-2">
                                    {isAuthenticated ? (
                                        <>
                                            {user?.role === 'aluno' && (
                                                <>
                                                    <Link
                                                        to="/aluno/dashboard"
                                                        onClick={() => setIsOpen(false)}
                                                        className="flex items-center justify-between p-3 rounded-xl bg-primary-bg/70 hover:bg-accent-teal/10 border border-border-color hover:border-accent-teal/40 transition-all group"
                                                    >
                                                        <div className="flex items-center gap-2.5">
                                                            <Trophy size={18} className="text-accent-yellow" />
                                                            <div>
                                                                <span className="text-xs font-bold text-primary-text block">Meu Tabuleiro de Missões</span>
                                                                <span className="text-[10px] text-secondary-text">Continue sua trilha e ganhe XP</span>
                                                            </div>
                                                        </div>
                                                        <ExternalLink size={14} className="text-secondary-text group-hover:text-accent-teal" />
                                                    </Link>

                                                    <Link
                                                        to="/aluno/entrar-turma"
                                                        onClick={() => setIsOpen(false)}
                                                        className="flex items-center justify-between p-3 rounded-xl bg-primary-bg/70 hover:bg-accent-teal/10 border border-border-color hover:border-accent-teal/40 transition-all group"
                                                    >
                                                        <div className="flex items-center gap-2.5">
                                                            <Users size={18} className="text-accent-teal" />
                                                            <div>
                                                                <span className="text-xs font-bold text-primary-text block">Entrar em Nova Turma</span>
                                                                <span className="text-[10px] text-secondary-text">Insira o código do seu professor</span>
                                                            </div>
                                                        </div>
                                                        <ExternalLink size={14} className="text-secondary-text group-hover:text-accent-teal" />
                                                    </Link>
                                                </>
                                            )}

                                            {user?.role === 'professor' && (
                                                <>
                                                    <Link
                                                        to="/professor/dashboard"
                                                        onClick={() => setIsOpen(false)}
                                                        className="flex items-center justify-between p-3 rounded-xl bg-primary-bg/70 hover:bg-accent-teal/10 border border-border-color hover:border-accent-teal/40 transition-all group"
                                                    >
                                                        <div className="flex items-center gap-2.5">
                                                            <GraduationCap size={18} className="text-accent-yellow" />
                                                            <div>
                                                                <span className="text-xs font-bold text-primary-text block">Painel do Professor</span>
                                                                <span className="text-[10px] text-secondary-text">Visão geral de turmas e engajamento</span>
                                                            </div>
                                                        </div>
                                                        <ExternalLink size={14} className="text-secondary-text group-hover:text-accent-teal" />
                                                    </Link>

                                                    <Link
                                                        to="/professor/criar-atividade"
                                                        onClick={() => setIsOpen(false)}
                                                        className="flex items-center justify-between p-3 rounded-xl bg-primary-bg/70 hover:bg-accent-teal/10 border border-border-color hover:border-accent-teal/40 transition-all group"
                                                    >
                                                        <div className="flex items-center gap-2.5">
                                                            <Sparkles size={18} className="text-accent-teal" />
                                                            <div>
                                                                <span className="text-xs font-bold text-primary-text block">Criar Nova Atividade</span>
                                                                <span className="text-[10px] text-secondary-text">Quizzes, narrativas e tabuleiros</span>
                                                            </div>
                                                        </div>
                                                        <ExternalLink size={14} className="text-secondary-text group-hover:text-accent-teal" />
                                                    </Link>
                                                </>
                                            )}

                                            <Link
                                                to="/perfil"
                                                onClick={() => setIsOpen(false)}
                                                className="flex items-center justify-between p-3 rounded-xl bg-primary-bg/70 hover:bg-accent-teal/10 border border-border-color hover:border-accent-teal/40 transition-all group"
                                            >
                                                <div className="flex items-center gap-2.5">
                                                    <ShieldCheck size={18} className="text-accent-purple" />
                                                    <div>
                                                        <span className="text-xs font-bold text-primary-text block">Meu Perfil e Inventário</span>
                                                        <span className="text-[10px] text-secondary-text">Equipar títulos, medalhas e ver dados</span>
                                                    </div>
                                                </div>
                                                <ExternalLink size={14} className="text-secondary-text group-hover:text-accent-teal" />
                                            </Link>
                                        </>
                                    ) : (
                                        <div className="text-center p-4 bg-primary-bg/50 rounded-2xl border border-border-color">
                                            <p className="text-xs text-secondary-text mb-3">
                                                Faça login ou crie sua conta para liberar todos os recursos gamificados.
                                            </p>
                                            <div className="flex gap-2 justify-center">
                                                <Link
                                                    to="/login"
                                                    onClick={() => setIsOpen(false)}
                                                    className="text-xs bg-accent-teal text-gray-950 font-bold px-4 py-2 rounded-xl hover:bg-accent-teal/90"
                                                >
                                                    Entrar
                                                </Link>
                                                <Link
                                                    to="/cadastro"
                                                    onClick={() => setIsOpen(false)}
                                                    className="text-xs bg-primary-bg text-primary-text border border-border-color font-bold px-4 py-2 rounded-xl hover:bg-white/5"
                                                >
                                                    Cadastre-se
                                                </Link>
                                            </div>
                                        </div>
                                    )}

                                    <Link
                                        to="/sobre-nos"
                                        onClick={() => setIsOpen(false)}
                                        className="flex items-center justify-between p-3 rounded-xl bg-primary-bg/70 hover:bg-white/5 border border-border-color transition-all group"
                                    >
                                        <div className="flex items-center gap-2.5">
                                            <Lightbulb size={18} className="text-accent-teal" />
                                            <div>
                                                <span className="text-xs font-bold text-primary-text block">Sobre a Pesquisa & Projeto</span>
                                                <span className="text-[10px] text-secondary-text">Conheça os autores e a fundamentação</span>
                                            </div>
                                        </div>
                                        <ExternalLink size={14} className="text-secondary-text group-hover:text-primary-text" />
                                    </Link>
                                </div>
                            </div>
                        )}

                        {/* ABA 3: TUTORIAIS GUIADOS (TOURS INTERATIVOS) */}
                        {activeTab === 'tours' && (
                            <div className="space-y-3">
                                <p className="text-xs text-secondary-text">
                                    Inicie visitas interativas passo a passo para dominar as ferramentas:
                                </p>

                                <div className="space-y-2">
                                    {user?.role === 'professor' ? (
                                        <>
                                            <div className="p-3 rounded-xl bg-primary-bg/70 border border-border-color flex items-center justify-between">
                                                <div>
                                                    <span className="text-xs font-bold text-primary-text block">Tour do Painel do Professor</span>
                                                    <span className="text-[10px] text-secondary-text">Visão geral de turmas, banco e relatórios</span>
                                                </div>
                                                <button
                                                    onClick={() => handleStartTour('teacher_dash')}
                                                    className="text-xs bg-accent-teal hover:bg-accent-teal/80 text-gray-950 font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-transform active:scale-95"
                                                >
                                                    <RotateCcw size={13} /> Iniciar
                                                </button>
                                            </div>

                                            <div className="p-3 rounded-xl bg-primary-bg/70 border border-border-color flex items-center justify-between">
                                                <div>
                                                    <span className="text-xs font-bold text-primary-text block">Tour: Criar Atividades</span>
                                                    <span className="text-[10px] text-secondary-text">Passo a passo no gerador de tabuleiros</span>
                                                </div>
                                                <button
                                                    onClick={() => handleStartTour('activity_creation')}
                                                    className="text-xs bg-accent-purple hover:bg-accent-purple/80 text-white font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-transform active:scale-95"
                                                >
                                                    <Sparkles size={13} /> Iniciar
                                                </button>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="p-3 rounded-xl bg-primary-bg/70 border border-border-color flex items-center justify-between">
                                            <div>
                                                <span className="text-xs font-bold text-primary-text block">Tour do Aluno: Tabuleiro & XP</span>
                                                <span className="text-[10px] text-secondary-text">Aprenda a navegar nos desafios e pontuar</span>
                                            </div>
                                            <button
                                                onClick={() => handleStartTour('student_dash')}
                                                className="text-xs bg-accent-teal hover:bg-accent-teal/80 text-gray-950 font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-transform active:scale-95"
                                            >
                                                <RotateCcw size={13} /> Iniciar
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <div className="p-3 rounded-xl bg-accent-teal/10 border border-accent-teal/20 text-xs text-primary-text">
                                    <span className="font-bold flex items-center gap-1 text-accent-teal mb-1">
                                        <CheckCircle2 size={14} /> Dica de Aprendizagem
                                    </span>
                                    Você pode refazer os tutoriais guiados quantas vezes desejar sem perder nenhum ponto de progresso.
                                </div>
                            </div>
                        )}

                        {/* ABA 4: CANAL DE SUPORTE DIRETO */}
                        {activeTab === 'support' && (
                            <div className="space-y-3">
                                <div className="p-3.5 bg-gradient-to-r from-accent-teal/10 to-accent-purple/10 rounded-2xl border border-border-color/60">
                                    <h4 className="text-xs font-bold text-primary-text mb-1 flex items-center gap-1.5">
                                        <MessageSquare size={14} className="text-accent-teal" /> Precisa de ajuda humana ou encontrou um bug?
                                    </h4>
                                    <p className="text-[11px] text-secondary-text leading-relaxed">
                                        Nossa equipe acadêmica e técnica analisa todos os feedbacks enviados para manter o portal estável e fluido.
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <Link
                                        to="/contact?subject=Dúvida%20ou%20Suporte%20na%20Plataforma"
                                        onClick={() => setIsOpen(false)}
                                        className="w-full py-2.5 px-4 bg-accent-teal hover:bg-accent-teal/90 text-gray-950 font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
                                    >
                                        <Send size={14} /> Abrir Formulário de Contato Completo
                                    </Link>

                                    <div className="text-center pt-2 border-t border-border-color/40">
                                        <p className="text-[10px] text-secondary-text">
                                            Resposta estimada em até 24h úteis para pesquisadores e alunos.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Rodapé Interno do Widget */}
                    <div className="px-4 py-2.5 bg-primary-bg/70 border-t border-border-color/60 flex items-center justify-between text-[11px] text-secondary-text">
                        <span>GamificaEdu v2.0</span>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="hover:text-primary-text font-semibold transition-colors"
                        >
                            Fechar [ESC]
                        </button>
                    </div>
                </div>
            )}
        </aside>
    );
}

