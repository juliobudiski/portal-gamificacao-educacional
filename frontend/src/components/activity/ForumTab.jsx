// frontend/src/components/activity/ForumTab.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { FaArrowLeft, FaTimes, FaComments, FaPlus, FaTrophy, FaPaperPlane, FaThumbtack, FaHeart, FaRegHeart, FaSpinner, FaExclamationCircle } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { useParams } from 'react-router-dom';

// --- Sub-componentes para manter o código organizado ---
const formatDate = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleString('pt-BR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
};

const CategoryListItem = ({ category, onSelect }) => (
    <button onClick={() => onSelect(category)} className="w-full text-left p-5 bg-secondary-bg rounded-xl hover:bg-hover-bg-color transition-colors border border-border-color shadow-sm group">
        <h3 className="font-bold text-primary-text text-xl group-hover:text-accent-teal transition-colors">{category.title}</h3>
        <p className="text-sm text-secondary-text mt-1">{category.description}</p>
        <p className="text-xs font-bold text-accent-teal mt-3 bg-accent-teal/10 w-fit px-2 py-1 rounded-md">{category.topic_count} tópicos</p>
    </button>
);

const TopicListItem = ({ topic, onSelect }) => (
    <button onClick={() => onSelect(topic.id)} className="w-full text-left p-4 bg-secondary-bg rounded-xl hover:bg-hover-bg-color transition-colors flex justify-between items-center border border-border-color shadow-sm">
        <div className="flex items-center gap-3">
            {topic.is_pinned && <FaThumbtack className="text-accent-teal flex-shrink-0 text-xl" title="Tópico Fixo" />}
            <div>
                <h3 className="font-bold text-primary-text text-lg">{topic.title}</h3>
                <p className="text-sm text-secondary-text mt-1">por {topic.author_name} • {topic.post_count} respostas</p>
            </div>
        </div>
        {topic.best_answer_id && <FaTrophy className="text-accent-yellow text-2xl flex-shrink-0" title="Resolvido" />}
    </button>
);

const PostItem = ({ post, isTopicAuthor, onMarkBest, isBestAnswer, onToggleLike }) => (
    <div className={`p-5 rounded-xl border shadow-sm ${isBestAnswer ? 'bg-accent-yellow/10 border-accent-yellow' : 'bg-secondary-bg border-border-color'}`}>
        <div className="flex justify-between items-start">
            <p className="font-bold text-accent-teal text-lg">{post.author_name}</p>
            <div className="flex items-center gap-3">
                <span className="text-xs text-secondary-text bg-primary-bg px-2 py-1 rounded">{formatDate(post.created_at)}</span>
                {isTopicAuthor && !isBestAnswer && (
                    <button onClick={() => onMarkBest(post.id)} className="text-xs font-bold flex items-center gap-1 text-accent-yellow hover:bg-accent-yellow/20 px-2 py-1 rounded transition-colors">
                        <FaTrophy /> Marcar Solução
                    </button>
                )}
            </div>
        </div>
        <p className="text-primary-text mt-3 whitespace-pre-wrap leading-relaxed">{post.body}</p>

        <div className="flex justify-between items-center mt-4 pt-3 border-t border-border-color/50">
            {isBestAnswer ? (
                <div className="text-sm font-bold text-accent-yellow flex items-center gap-2 bg-accent-yellow/20 px-3 py-1 rounded-full"><FaTrophy /> SOLUÇÃO DO TÓPICO</div>
            ) : <div></div>}

            <div className="flex items-center gap-2 text-secondary-text">
                <span className="text-sm font-bold">{post.likes_count}</span>
                <button onClick={() => onToggleLike(post.id, post.current_user_has_liked)} className="text-xl hover:text-danger transition-colors transform hover:scale-110">
                    {post.current_user_has_liked ? <FaHeart className="text-danger" /> : <FaRegHeart />}
                </button>
            </div>
        </div>
    </div>
);

const CreateTopicForm = ({ onSubmit, onCancel, isSubmitting }) => {
    const { user } = useAuth();
    const [title, setTitle] = useState('');
    const [body, setBody] = useState('');
    const [isPinned, setIsPinned] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (title.trim() && body.trim()) onSubmit(title, body, isPinned);
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col h-full bg-secondary-bg p-6 rounded-2xl border border-border-color shadow-lg">
            <h3 className="text-2xl font-bold text-accent-teal mb-6">Criar Novo Tópico</h3>

            <div className="mb-4">
                <div className="flex justify-between text-xs mb-1 text-secondary-text font-bold uppercase">
                    <span>Título da Pergunta</span>
                    <span>{title.length}/150</span>
                </div>
                <input
                    type="text" value={title} maxLength={150} onChange={e => setTitle(e.target.value)}
                    placeholder="Resuma sua dúvida ou sugestão de forma clara..."
                    className="w-full bg-primary-bg p-3 rounded-lg border border-border-color text-primary-text focus:border-accent-teal focus:ring-1 focus:ring-accent-teal outline-none transition-all"
                    required
                />
            </div>

            <div className="flex-grow flex flex-col mb-4">
                <div className="flex justify-between text-xs mb-1 text-secondary-text font-bold uppercase">
                    <span>Detalhes</span>
                    <span>{body.length}/5000</span>
                </div>
                <textarea
                    value={body} maxLength={5000} onChange={e => setBody(e.target.value)}
                    placeholder="Descreva todos os detalhes. Se for um problema técnico, explique o que você já tentou fazer..."
                    className="w-full flex-grow min-h-[150px] bg-primary-bg p-3 rounded-lg resize-none border border-border-color text-primary-text focus:border-accent-teal focus:ring-1 focus:ring-accent-teal outline-none transition-all"
                    required
                />
            </div>

            {user.role === 'professor' && (
                <div className="flex items-center mb-6 bg-primary-bg p-3 rounded-lg border border-border-color w-fit">
                    <input type="checkbox" id="isPinned" checked={isPinned} onChange={e => setIsPinned(e.target.checked)} className="h-5 w-5 rounded accent-accent-teal cursor-pointer" />
                    <label htmlFor="isPinned" className="ml-3 font-bold text-secondary-text cursor-pointer">Fixar no topo do canal (Aviso Global)</label>
                </div>
            )}

            <div className="flex justify-end gap-4 mt-auto pt-4 border-t border-border-color">
                <button type="button" onClick={onCancel} className="py-2 px-6 bg-primary-bg text-secondary-text font-bold border border-border-color rounded-lg hover:bg-hover-bg-color transition-colors">Cancelar</button>
                <button type="submit" disabled={isSubmitting || !title.trim() || !body.trim()} className="py-2 px-8 bg-accent-teal text-primary-text font-bold rounded-lg disabled:opacity-50 hover:bg-teal-400 transition-colors shadow-md">{isSubmitting ? 'Publicando...' : 'Publicar Tópico'}</button>
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
        } catch (err) { setError(err.message); } finally { setIsLoading(false); }
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
            await fetch(`${import.meta.env.VITE_API_URL}/api/forum/posts/${postId}/like`, { method: 'POST', headers: { 'Authorization': `Bearer ${user.token}` } });
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
        } catch (err) { setError("Falha de rede ao curtir."); }
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
                if (errorData.reason) {
                    alert(`🚫 BLOQUEADO: ${errorData.detail}\n\nO conteúdo foi descartado.`);
                    setView('topics');
                    return;
                }
                throw new Error(errorData.message || "Erro ao criar tópico");
            }
            await fetchTopics(selectedCategory.id);
            setView('topics');
        } catch (err) { setFormError(err.message); } finally { setIsSubmitting(false); }
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
                if (errorData.reason) {
                    alert(`🚫 RESPOSTA BLOQUEADA: ${errorData.reason}\n\nSeu texto foi descartado.`);
                    setNewPostBody('');
                    return;
                }
                throw new Error(errorData.message || "Erro ao publicar resposta");
            }

            setNewPostBody('');
            await fetchTopicDetails(selectedTopic.id);
        } catch (err) { setFormError(err.message); } finally { setIsSubmitting(false); }
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
                    <FaSpinner className="animate-spin text-5xl text-accent-teal mb-4" />
                    <p className="text-lg font-bold text-secondary-text">Sincronizando Fórum...</p>
                </div>
            );
        }
        if (error) {
            return (
                <div className="bg-danger-bg border border-danger text-danger text-center p-8 rounded-xl max-w-md mx-auto mt-10">
                    <FaExclamationCircle className="text-5xl mx-auto mb-4" />
                    <p className="font-bold text-lg">Falha ao carregar o fórum</p>
                    <p className="text-sm mt-2">{error}</p>
                </div>
            );
        }

        switch (view) {
            case 'create_topic':
                return <CreateTopicForm onSubmit={handleCreateTopic} onCancel={() => setView('topics')} isSubmitting={isSubmitting} />;

            case 'topic_detail':
                return (
                    <div className="flex flex-col h-full overflow-hidden">
                        {/* CABEÇALHO TÓPICO */}
                        <div className="flex-shrink-0 mb-6">
                            <button onClick={() => setView('topics')} className="mb-4 flex items-center gap-2 text-secondary-text hover:text-primary-text font-bold transition-colors bg-primary-bg px-4 py-2 rounded-full w-fit border border-border-color shadow-sm">
                                <FaArrowLeft /> Voltar para os tópicos
                            </button>
                            <div className="bg-secondary-bg p-6 rounded-2xl border border-border-color shadow-md">
                                <h2 className="text-2xl md:text-3xl font-bold text-primary-text leading-tight mb-2">{selectedTopic.title}</h2>
                                <p className="text-sm font-bold text-accent-teal uppercase tracking-wide">Autor: {selectedTopic.author_name}</p>
                                <div className="mt-4 text-primary-text whitespace-pre-wrap text-base md:text-lg bg-primary-bg/50 p-5 rounded-xl border border-border-color/50 leading-relaxed">
                                    {selectedTopic.body}
                                </div>
                            </div>
                            <h3 className="text-xl font-bold mt-6 mb-2 text-primary-text flex items-center gap-2">
                                <FaComments className="text-accent-yellow" /> Respostas da Comunidade ({selectedTopic.posts.length})
                            </h3>
                        </div>

                        {/* LISTA DE RESPOSTAS */}
                        <div className="flex-grow overflow-y-auto space-y-4 pr-2 min-h-0 custom-scrollbar pb-4">
                            {selectedTopic.posts.length === 0 ? (
                                <div className="bg-secondary-bg/50 border border-dashed border-border-color rounded-xl p-10 text-center text-secondary-text">
                                    <FaComments className="text-4xl mx-auto mb-3 opacity-50" />
                                    <p className="font-bold text-lg">Nenhuma resposta ainda.</p>
                                    <p className="text-sm mt-1">Seja o primeiro a ajudar ou compartilhar sua opinião!</p>
                                </div>
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

                        {/* INPUT DE RESPOSTA */}
                        <div className="mt-4 flex-shrink-0 pt-4 border-t border-border-color">
                            {formError && (
                                <div className="mb-3 p-3 bg-danger-bg border border-danger rounded-xl text-danger text-sm font-bold flex items-center gap-2 animate-pulse">
                                    <FaExclamationCircle /> <span>{formError}</span>
                                </div>
                            )}
                            <div className="flex flex-col shadow-xl rounded-xl overflow-hidden border border-border-color focus-within:border-accent-teal transition-colors">
                                <textarea
                                    value={newPostBody} onChange={e => setNewPostBody(e.target.value)} maxLength={5000}
                                    placeholder="Escreva a sua resposta para ajudar a comunidade..."
                                    className="w-full bg-secondary-bg p-4 focus:outline-none resize-none h-28 text-primary-text"
                                />
                                <div className="bg-primary-bg flex justify-between items-center p-2 px-4 border-t border-border-color">
                                    <span className="text-xs font-bold text-secondary-text">{newPostBody.length}/5000</span>
                                    <button
                                        onClick={handleCreatePost} disabled={isSubmitting || !newPostBody.trim()}
                                        className="bg-accent-teal text-primary-text py-2 px-6 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-teal-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isSubmitting ? <FaSpinner className="animate-spin" /> : <FaPaperPlane />}
                                        {isSubmitting ? 'Enviando...' : 'Publicar'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                );

            case 'topics':
                return (
                    <div className="flex flex-col h-full overflow-hidden">
                        <div className="flex-shrink-0 mb-6">
                            <button onClick={() => setView('categories')} className="mb-4 flex items-center gap-2 text-secondary-text hover:text-primary-text font-bold transition-colors bg-secondary-bg px-4 py-2 rounded-full w-fit border border-border-color shadow-sm">
                                <FaArrowLeft /> Voltar para os canais
                            </button>
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-secondary-bg p-6 rounded-2xl border border-border-color shadow-md gap-4">
                                <div>
                                    <h2 className="text-2xl md:text-3xl font-bold text-accent-teal mb-1">{selectedCategory?.title}</h2>
                                    <p className="text-sm text-secondary-text">{selectedCategory?.description}</p>
                                </div>
                                <button onClick={() => setView('create_topic')} className="bg-accent-teal text-primary-text py-3 px-6 rounded-xl flex items-center gap-2 font-bold hover:bg-teal-400 transition-all shadow-lg transform hover:-translate-y-1 w-full md:w-auto justify-center">
                                    <FaPlus /> <span>Novo Tópico</span>
                                </button>
                            </div>
                        </div>

                        <div className="flex-grow overflow-y-auto space-y-3 pr-2 custom-scrollbar pb-2">
                            {topics.length > 0 ? (
                                topics.map(topic => <TopicListItem key={topic.id} topic={topic} onSelect={fetchTopicDetails} />)
                            ) : (
                                <div className="flex flex-col items-center justify-center h-48 text-secondary-text opacity-70 border-2 border-dashed border-border-color rounded-2xl bg-secondary-bg/30">
                                    <FaComments className="text-5xl mb-3 text-accent-teal" />
                                    <p className="text-lg font-bold text-primary-text">Nenhum tópico criado neste canal.</p>
                                    <p className="text-sm mt-1">Clique no botão acima para iniciar a primeira discussão!</p>
                                </div>
                            )}
                        </div>
                    </div>
                );

            default: // categories
                return (
                    <div className="flex flex-col h-full overflow-hidden">
                        <div className="flex-shrink-0 mb-8 text-center md:text-left">
                            <h2 className="text-3xl font-bold text-accent-teal flex items-center justify-center md:justify-start gap-3 mb-2">
                                <FaComments className="text-accent-yellow" /> Canais de Discussão
                            </h2>
                            <p className="text-secondary-text text-base">Selecione um canal para ver os tópicos ou criar novas discussões.</p>
                        </div>
                        <div className="flex-grow overflow-y-auto space-y-4 pr-2 custom-scrollbar">
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
        // PADRONIZAÇÃO DO CONTAINER PARA FICAR IGUAL AO STORE_TAB
        <div className="w-full max-w-6xl mx-auto p-8 relative mt-8 mb-8 text-primary-text bg-primary-bg rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.8)] border border-white/10 min-h-[80vh] flex flex-col overflow-hidden">
            {/* Efeito de luz de fundo */}
            <div className="absolute top-0 right-0 w-[600px] h-[300px] bg-teal-500/10 rounded-full blur-[100px] pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-[500px] h-[400px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none"></div>

            {/* BOTÃO VOLTAR GLOBAL (Top Left) */}
            <div className='flex-shrink-0'>
                <button
                    onClick={onReturn}
                    className="absolute top-6 left-6 z-20 flex items-center gap-2 py-2.5 px-5 
                           bg-black/50 text-secondary-text font-bold backdrop-blur-md
                           border border-white/10 rounded-full shadow-lg 
                           hover:bg-white/10 hover:text-white hover:scale-105 transition-all"
                >
                    <FaArrowLeft /> Voltar ao Tabuleiro
                </button>
            </div>

            {/* CONTAINER PRINCIPAL DO FÓRUM */}
            <div className="flex-grow relative overflow-hidden flex flex-col bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl p-4 md:p-8 mt-12 z-10">
                {renderContent()}
            </div>
        </div>
    );
};

export default ForumTab;