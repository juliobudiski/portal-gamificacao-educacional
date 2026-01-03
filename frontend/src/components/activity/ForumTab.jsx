import React, { useState, useEffect, useCallback } from 'react';
import { FaArrowLeft, FaTimes, FaComments, FaPlus, FaTrophy, FaPaperPlane, FaThumbtack, FaHeart, FaRegHeart, FaSpinner, FaExclamationCircle } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { useParams } from 'react-router-dom';

// --- Sub-componentes para manter o código organizado ---
const formatDate = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};
// Item da lista de CATEGORIAS
const CategoryListItem = ({ category, onSelect }) => (
    // --- CORREÇÃO: Fundo e hover cientes do tema ---
    <button onClick={() => onSelect(category)} className="w-full text-left p-4 bg-secondary-bg rounded-lg hover:bg-hover-bg-color transition-colors border border-border-color">
        <h3 className="font-bold text-primary-text text-lg">{category.title}</h3>
        <p className="text-sm text-secondary-text">{category.description}</p>
        {/* --- CORREÇÃO: Cor de texto ciente do tema --- */}
        <p className="text-xs text-accent-teal mt-2">{category.topic_count} tópicos</p>
    </button>
);

// Item da lista de TÓPICOS (perguntas)
const TopicListItem = ({ topic, onSelect }) => (
    // --- CORREÇÃO: Fundo e hover cientes do tema ---
    <button onClick={() => onSelect(topic.id)} className="w-full text-left p-4 bg-secondary-bg rounded-lg hover:bg-hover-bg-color transition-colors flex justify-between items-center border border-border-color">
        <div className="flex items-center gap-3">
            {/* --- CORREÇÃO: Cor de ícone ciente do tema --- */}
            {topic.is_pinned && <FaThumbtack className="text-accent-teal flex-shrink-0" title="Tópico Fixo" />}
            <div>
                <h3 className="font-bold text-primary-text">{topic.title}</h3>
                <p className="text-sm text-secondary-text">por {topic.author_name} - {topic.post_count} respostas</p>
            </div>
        </div>
        {/* --- CORREÇÃO: Cor de ícone ciente do tema --- */}
        {topic.best_answer_id && <FaTrophy className="text-accent-yellow text-xl flex-shrink-0" title="Resolvido" />}
    </button>
);

// Item de um POST (resposta)
const PostItem = ({ post, isTopicAuthor, onMarkBest, isBestAnswer, onToggleLike }) => (
    // --- CORREÇÃO: Fundos e bordas cientes do tema ---
    <div className={`p-4 rounded-lg border ${isBestAnswer ? 'bg-accent-yellow/10 border-accent-yellow' : 'bg-primary-bg border-border-color'}`}>
        <div className="flex justify-between items-start">
            {/* --- CORREÇÃO: Cor de texto ciente do tema --- */}
            <p className="font-bold text-accent-teal">{post.author_name}</p>
            <p className="text-xs text-secondary-text">{formatDate(post.created_at)}</p>
            {isTopicAuthor && !isBestAnswer && (
                <button onClick={() => onMarkBest(post.id)} className="text-xs flex items-center gap-1 text-accent-yellow hover:text-accent-yellow/80">
                    <FaTrophy /> Marcar como Melhor
                </button>
            )}
        </div>
        <p className="text-secondary-text mt-2 whitespace-pre-wrap">{post.body}</p>
        <div className="flex justify-between items-center mt-3">
            {isBestAnswer
                // --- CORREÇÃO: Cor de texto ciente do tema ---
                ? <div className="text-xs font-bold text-accent-yellow flex items-center gap-2"><FaTrophy /> MELHOR RESPOSTA</div>
                : <div></div> // Espaçador
            }
            <div className="flex items-center gap-2 text-secondary-text">
                <span className="text-sm">{post.likes_count}</span>
                {/* --- CORREÇÃO: Cor de ícone ciente do tema --- */}
                <button onClick={() => onToggleLike(post.id, post.current_user_has_liked)} className="text-lg hover:text-danger transition-colors">
                    {post.current_user_has_liked ? <FaHeart className="text-danger" /> : <FaRegHeart />}
                </button>
            </div>
        </div>
    </div>
);

const MAX_TITLE = 150;
const MAX_BODY = 5000;

// Formulário para criar um novo TÓPICO
const CreateTopicForm = ({ onSubmit, onCancel, isSubmitting }) => {
    const { user } = useAuth();
    const [title, setTitle] = useState('');
    const [body, setBody] = useState('');
    const [isPinned, setIsPinned] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (title.trim() && body.trim()) {
            onSubmit(title, body, isPinned);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
            {/* TÍTULO */}
            <div className="mb-4">
                <div className="flex justify-between text-xs mb-1 text-secondary-text">
                    <span>Título</span>
                    <span>{title.length}/{MAX_TITLE}</span>
                </div>
                <input
                    type="text"
                    value={title}
                    maxLength={MAX_TITLE} // Bloqueio HTML
                    onChange={e => setTitle(e.target.value)}
                    placeholder="Título da pergunta..."
                    className="w-full bg-secondary-bg p-2 rounded border border-border-color text-primary-text focus:border-accent-teal outline-none"
                    required
                />
            </div>

            {/* CORPO */}
            <div className="flex-grow flex flex-col mb-4">
                <div className="flex justify-between text-xs mb-1 text-secondary-text">
                    <span>Detalhes</span>
                    <span>{body.length}/{MAX_BODY}</span>
                </div>
                <textarea
                    value={body}
                    maxLength={MAX_BODY} // Bloqueio HTML
                    onChange={e => setBody(e.target.value)}
                    placeholder="Descreva a sua pergunta em detalhe..."
                    className="w-full flex-grow bg-secondary-bg p-2 rounded resize-none border border-border-color text-primary-text focus:border-accent-teal outline-none"
                    required
                />
            </div>
            {user.role === 'professor' && (
                <div className="flex items-center mb-4">
                    <input type="checkbox" id="isPinned" checked={isPinned} onChange={e => setIsPinned(e.target.checked)} className="h-4 w-4 rounded" />
                    <label htmlFor="isPinned" className="ml-2 text-secondary-text">Fixar este tópico no topo do fórum</label>
                </div>
            )}
            <div className="flex justify-end gap-4">
                {/* --- CORREÇÃO: Botões cientes do tema --- */}
                <button type="button" onClick={onCancel} className="py-2 px-4 bg-secondary-bg border border-border-color rounded hover:bg-hover-bg-color">Cancelar</button>
                <button type="submit" disabled={isSubmitting} className="py-2 px-4 bg-accent-teal text-gray-900 rounded disabled:opacity-50">{isSubmitting ? 'Publicando...' : 'Publicar Tópico'}</button>
            </div>
        </form>
    );
};


const ForumTab = ({ onReturn }) => {
    const { user } = useAuth();
    const { activityId } = useParams();

    const [view, setView] = useState('categories');
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [topics, setTopics] = useState([]);
    const [selectedTopic, setSelectedTopic] = useState(null);

    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [newPostBody, setNewPostBody] = useState('');
    const [formError, setFormError] = useState('');
    const fetchCategories = useCallback(async () => {
        setIsLoading(true);
        setError('');
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/forum/activity/${activityId}/categories`, { headers: { 'Authorization': `Bearer ${user.token}` } });
            if (!response.ok) throw new Error("Não foi possível carregar os canais do fórum.");
            const data = await response.json();
            setCategories(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, [activityId, user.token]);

    const fetchTopics = useCallback(async (categoryId) => {
        setIsLoading(true);
        setError('');
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/forum/category/${categoryId}/topics`, { headers: { 'Authorization': `Bearer ${user.token}` } });
            if (!response.ok) throw new Error("Não foi possível carregar os tópicos.");
            setTopics(await response.json());
        } catch (err) { setError(err.message); } finally { setIsLoading(false); }
    }, [user.token]);

    const fetchTopicDetails = useCallback(async (topicId) => {
        setIsLoading(true);
        setError('');
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/forum/topics/${topicId}`, { headers: { 'Authorization': `Bearer ${user.token}` } });
            if (!response.ok) throw new Error("Não foi possível carregar o tópico.");
            setSelectedTopic(await response.json());
            setView('topic_detail');
        } catch (err) { setError(err.message); } finally { setIsLoading(false); }
    }, [user.token]);

    useEffect(() => { if (view === 'categories') { fetchCategories(); } }, [view, fetchCategories]);

    const handleToggleLike = async (postId) => {
        try {
            await fetch(`${import.meta.env.VITE_API_URL}/api/forum/posts/${postId}/like`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${user.token}` },
            });
            setSelectedTopic(prevTopic => ({
                ...prevTopic,
                posts: prevTopic.posts.map(p => {
                    if (p.id === postId) {
                        const hasLiked = !p.current_user_has_liked;
                        const likeCount = hasLiked ? p.likes_count + 1 : p.likes_count - 1;
                        return { ...p, current_user_has_liked: hasLiked, likes_count: likeCount };
                    }
                    return p;
                })
            }));
        } catch (err) {
            setError("Não foi possível registrar o like. Tente novamente.");
        }
    };
    const handleCreateTopic = async (title, body, isPinned) => {
        setIsSubmitting(true);
        setFormError('');
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/forum/category/${selectedCategory.id}/topics`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user.token}` },
                body: JSON.stringify({ title, body, is_pinned: isPinned }),
            });

            if (!response.ok) {
                const errorData = await response.json();

                // --- MUDANÇA: TOLERÂNCIA ZERO ---
                // Se houver um motivo (reason) vindo da IA ou bloqueio de tamanho
                if (errorData.reason) {
                    // 1. Alerta agressivo (trava a tela)
                    alert(`🚫 BLOQUEADO: ${errorData.detail}\n\nO conteúdo foi descartado.`);

                    // 2. Limpa o que ele digitou (Punição)
                    // Como vamos desmontar o componente ao mudar a view, isso é opcional, 
                    // mas garante que se ele voltar, estará vazio.
                    setTitle('');
                    setBody('');

                    // 3. Chuta ele de volta para a lista (Sai da tela de criação)
                    setView('topics');

                    return; // Para a execução aqui
                }

                throw new Error(errorData.message || "Erro ao criar tópico");
            }

            await fetchTopics(selectedCategory.id);
            setView('topics');
        } catch (err) {
            // Erros de rede ou outros continuam aparecendo no formulário
            setFormError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCreatePost = async () => {
        if (!newPostBody.trim()) return;
        setIsSubmitting(true);
        setFormError('');
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/forum/topics/${selectedTopic.id}/posts`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user.token}` },
                body: JSON.stringify({ body: newPostBody }),
            });

            if (!response.ok) {
                const errorData = await response.json();

                // --- MUDANÇA: TOLERÂNCIA ZERO ---
                if (errorData.reason) {
                    alert(`🚫 RESPOSTA BLOQUEADA: ${errorData.reason}\n\nSeu texto foi descartado.`);

                    // 1. Limpa o campo de texto imediatamente
                    setNewPostBody('');

                    return;
                }

                throw new Error(errorData.message || "Erro ao publicar resposta");
            }

            setNewPostBody('');
            await fetchTopicDetails(selectedTopic.id);
        } catch (err) {
            setFormError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleMarkBest = async (postId) => {
        setIsSubmitting(true);
        try {
            await fetch(`${import.meta.env.VITE_API_URL}/api/forum/topics/${selectedTopic.id}/best-answer`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user.token}` },
                body: JSON.stringify({ post_id: postId }),
            });
            await fetchTopicDetails(selectedTopic.id);
        } catch (err) { setError(err.message); } finally { setIsSubmitting(false); }
    };

    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="flex flex-col items-center justify-center h-full text-center">
                    <FaSpinner className="animate-spin text-4xl text-yellow-400 mb-4" />
                    <p>Carregando Fórum...</p>
                </div>
            );
        }
        if (error) {
            return (
                <div className="text-red-400 text-center p-8">
                    <FaExclamationCircle className="text-5xl mx-auto mb-4" />
                    <p className="font-semibold">Falha ao carregar o fórum</p>
                    <p className="text-sm">{error}</p>
                </div>
            );
        }
        switch (view) {
            case 'create_topic':
                // O Form já tem flex-col e h-full internamente, então ele se adapta bem
                return <CreateTopicForm
                    onSubmit={handleCreateTopic}
                    onCancel={() => setView('topics')}
                    isSubmitting={isSubmitting}
                    formError={formError}
                />;

            case 'topic_detail':
                return (
                    // Layout Flex Vertical: Cabeçalho Fixo -> Conteúdo Scrollável -> Input Fixo
                    <div className="flex flex-col h-full overflow-hidden">
                        {/* 1. CABEÇALHO (Fixo) */}
                        <div className="flex-shrink-0 mb-4">
                            <button onClick={() => setView('topics')} className="mb-2 flex items-center gap-2 text-accent-yellow hover:text-accent-yellow/80 transition-colors">
                                <FaArrowLeft /> Voltar para os tópicos
                            </button>
                            <div className="bg-secondary-bg p-4 rounded-lg border border-border-color shadow-sm">
                                <h2 className="text-xl md:text-2xl font-bold text-primary-text leading-tight">{selectedTopic.title}</h2>
                                <p className="text-sm text-secondary-text mt-1">por <span className="text-accent-teal">{selectedTopic.author_name}</span></p>
                                <div className="text-primary-text mt-3 whitespace-pre-wrap text-sm md:text-base bg-primary-bg/50 p-3 rounded border border-border-color/50">
                                    {selectedTopic.body}
                                </div>
                            </div>
                            <h3 className="font-bold mt-4 mb-2 text-primary-text flex items-center gap-2">
                                <FaComments /> Respostas ({selectedTopic.posts.length})
                            </h3>
                        </div>

                        {/* 2. LISTA DE RESPOSTAS (Scrollável) */}
                        <div className="flex-grow overflow-y-auto space-y-4 pr-2 min-h-0 custom-scrollbar pb-4">
                            {selectedTopic.posts.length === 0 ? (
                                <p className="text-center text-secondary-text py-8 italic">Seja o primeiro a responder!</p>
                            ) : (
                                selectedTopic.posts.map(post => (
                                    <PostItem key={post.id} post={post}
                                        isTopicAuthor={Number(user.id) === Number(selectedTopic.author_id)}
                                        onMarkBest={handleMarkBest}
                                        isBestAnswer={post.id === selectedTopic.best_answer_id}
                                        onToggleLike={handleToggleLike}
                                    />
                                ))
                            )}
                        </div>

                        {/* 3. INPUT DE RESPOSTA (Fixo no fundo) */}
                        <div className="mt-4 flex-shrink-0 pt-2 border-t border-border-color/30">
                            {/* Alerta de Erro Local */}
                            {formError && (
                                <div className="mb-2 p-2 bg-red-900/50 border border-red-500 rounded text-red-200 text-sm flex items-center justify-between animate-pulse">
                                    <div className="flex items-center gap-2">
                                        <FaExclamationCircle />
                                        <span>{formError}</span>
                                    </div>
                                    <button onClick={() => setFormError('')}><FaTimes /></button>
                                </div>
                            )}

                            <div className="text-right text-xs text-secondary-text px-1 mb-1">
                                {newPostBody.length}/5000
                            </div>
                            <div className="flex flex-col shadow-lg">
                                <textarea
                                    value={newPostBody}
                                    onChange={e => setNewPostBody(e.target.value)}
                                    maxLength={5000}
                                    placeholder="Escreva a sua resposta..."
                                    className={`w-full bg-secondary-bg p-3 rounded-t-lg focus:outline-none resize-none h-24 border-t border-x text-primary-text transition-colors ${formError ? 'border-red-500' : 'border-border-color focus:border-accent-teal'}`}
                                />
                                <button
                                    onClick={handleCreatePost}
                                    disabled={isSubmitting || !newPostBody.trim()}
                                    className="w-full bg-accent-teal p-3 rounded-b-lg disabled:opacity-50 font-bold flex items-center justify-center gap-2 text-gray-900 hover:bg-teal-400 transition-all hover:shadow-md"
                                >
                                    {isSubmitting ? <FaSpinner className="animate-spin" /> : <FaPaperPlane />}
                                    {isSubmitting ? 'Enviando...' : 'Publicar Resposta'}
                                </button>
                            </div>
                        </div>
                    </div>
                );

            case 'topics':
                return (
                    <div className="flex flex-col h-full overflow-hidden">
                        {/* Header Fixo */}
                        <div className="flex-shrink-0 mb-4">
                            <button onClick={() => setView('categories')} className="mb-4 flex items-center gap-2 text-accent-yellow hover:text-accent-yellow/80 transition-colors">
                                <FaArrowLeft /> Voltar para os canais
                            </button>
                            <div className="flex justify-between items-center bg-secondary-bg p-4 rounded-lg border border-border-color">
                                <div>
                                    <h2 className="text-xl md:text-2xl font-bold text-primary-text">{selectedCategory?.title}</h2>
                                    <p className="text-xs text-secondary-text hidden md:block">Visualize e crie discussões neste canal.</p>
                                </div>
                                <button onClick={() => setView('create_topic')} className="bg-accent-teal text-gray-900 py-2 px-4 rounded-lg flex items-center gap-2 font-bold hover:bg-teal-400 transition-all shadow-md transform hover:scale-105">
                                    <FaPlus /> <span className="hidden md:inline">Criar Tópico</span>
                                </button>
                            </div>
                        </div>

                        {/* Lista Scrollável */}
                        <div className="flex-grow overflow-y-auto space-y-3 pr-2 custom-scrollbar pb-2">
                            {topics.length > 0 ? (
                                topics.map(topic => <TopicListItem key={topic.id} topic={topic} onSelect={fetchTopicDetails} />)
                            ) : (
                                <div className="flex flex-col items-center justify-center h-40 text-secondary-text opacity-70 border-2 border-dashed border-border-color rounded-lg">
                                    <FaComments className="text-4xl mb-2" />
                                    <p>Nenhum tópico criado neste canal ainda.</p>
                                </div>
                            )}
                        </div>
                    </div>
                );

            default: // categories
                return (
                    <div className="flex flex-col h-full overflow-hidden">
                        <div className="flex-shrink-0 mb-4">
                            <h2 className="text-2xl font-bold text-accent-teal flex items-center gap-2">
                                <FaComments /> Canais do Fórum
                            </h2>
                            <p className="text-secondary-text text-sm">Selecione um canal para ver as discussões.</p>
                        </div>
                        <div className="flex-grow overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                            {categories.map(category => (
                                <CategoryListItem key={category.id} category={category} onSelect={(category) => {
                                    setSelectedCategory(category);
                                    fetchTopics(category.id);
                                    setView('topics');
                                }} />
                            ))}
                        </div>
                    </div>
                );
        }
    };

    return (
        // MUDANÇA CRÍTICA:
        // 1. 'absolute inset-0': Cola o fórum nos 4 cantos do container pai (substituindo visualmente o tabuleiro).
        // 2. 'z-10': Garante que fique por cima do SVG/Mapas.
        // 3. 'h-full w-full': Ocupa todo o espaço disponível.
        // 4. 'bg-primary-bg': Garante fundo sólido.
        <div className="absolute inset-0 z-10 flex flex-col h-full w-full bg-primary-bg/95 backdrop-blur-sm text-primary-text rounded-xl overflow-hidden">

            {/* Header / Botão Voltar */}
            <div className='flex-shrink-0 p-4 border-b border-border-color bg-secondary-bg/50 flex items-center shadow-sm'>
                <button
                    onClick={onReturn}
                    className="flex items-center gap-2 py-2 px-4 
                    bg-secondary-bg text-secondary-text text-sm font-bold
                    border border-border-color rounded-full shadow-sm 
                    hover:bg-primary-bg hover:text-accent-yellow hover:border-accent-yellow transition-all"
                >
                    <FaArrowLeft /> Voltar ao Jogo
                </button>
                {/* Título opcional no header para contexto */}
                <h2 className="ml-4 text-lg font-bold text-primary-text hidden md:block">
                    Fórum da Turma
                </h2>
            </div>

            {/* Conteúdo Principal (Scrollável) */}
            <div className="flex-grow relative overflow-hidden flex flex-col p-4 md:p-6">
                {renderContent()}
            </div>
        </div>
    );
};

export default ForumTab;