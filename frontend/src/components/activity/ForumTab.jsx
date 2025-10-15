// frontend/src/components/activity/ForumTab.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { FaArrowLeft, FaComments, FaPlus, FaTrophy, FaPaperPlane, FaThumbtack, FaHeart, FaRegHeart } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { useParams } from 'react-router-dom';

// --- Sub-componentes para manter o código organizado ---
const formatDate = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    // Formata para "dd/mm/aaaa hh:mm"
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
    <button onClick={() => onSelect(category)} className="w-full text-left p-4 bg-border-color rounded-lg hover:bg-hover-bg-color transition-colors">
        <h3 className="font-bold text-primary-text text-lg">{category.title}</h3>
        <p className="text-sm text-secondary-text">{category.description}</p>
        <p className="text-xs text-teal-400 mt-2">{category.topic_count} tópicos</p>
    </button>
);

// Item da lista de TÓPICOS (perguntas)
const TopicListItem = ({ topic, onSelect }) => (
    <button onClick={() => onSelect(topic.id)} className="w-full text-left p-4 bg-border-color rounded-lg hover:bg-hover-bg-color transition-colors flex justify-between items-center">
        <div className="flex items-center gap-3">
            {topic.is_pinned && <FaThumbtack className="text-cyan-400 flex-shrink-0" title="Tópico Fixo" />}
            <div>
                <h3 className="font-bold text-primary-text">{topic.title}</h3>
                <p className="text-sm text-secondary-text">por {topic.author_name} - {topic.post_count} respostas</p>
            </div>
        </div>
        {topic.best_answer_id && <FaTrophy className="text-yellow-400 text-xl flex-shrink-0" title="Resolvido" />}
    </button>
);

// Item de um POST (resposta)
const PostItem = ({ post, isTopicAuthor, onMarkBest, isBestAnswer, onToggleLike }) => (
    <div className={`p-4 rounded-lg border ${isBestAnswer ? 'bg-yellow-900/30 border-yellow-500' : 'bg-primary-bg border-border-color'}`}>
        <div className="flex justify-between items-start">
            <p className="font-bold text-teal-300">{post.author_name}</p>
            <p className="text-xs text-secondary-text">{formatDate(post.created_at)}</p>
            {isTopicAuthor && !isBestAnswer && (
                <button onClick={() => onMarkBest(post.id)} className="text-xs flex items-center gap-1 text-yellow-400 hover:text-primary-text">
                    <FaTrophy /> Marcar como Melhor
                </button>
            )}
        </div>
        <p className="text-secondary-text mt-2 whitespace-pre-wrap">{post.body}</p>
        <div className="flex justify-between items-center mt-3">
            {isBestAnswer
                ? <div className="text-xs font-bold text-yellow-400 flex items-center gap-2"><FaTrophy /> MELHOR RESPOSTA</div>
                : <div></div> // Espaçador para alinhar o botão de like
            }

            {/* --- BLOCO ADICIONADO: Botão e contagem de Likes --- */}
            <div className="flex items-center gap-2 text-secondary-text">
                <span className="text-sm">{post.likes_count}</span>
                <button onClick={() => onToggleLike(post.id, post.current_user_has_liked)} className="text-lg hover:text-red-500 transition-colors">
                    {post.current_user_has_liked ? <FaHeart className="text-red-500" /> : <FaRegHeart />}
                </button>
            </div>
        </div>
    </div>
);

// Formulário para criar um novo TÓPICO
const CreateTopicForm = ({ onSubmit, onCancel, isSubmitting }) => {
    const { user } = useAuth(); // Apenas para verificar o papel do utilizador
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
            <h2 className="text-2xl font-bold mb-4">Criar Novo Tópico</h2>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Título da pergunta..." className="w-full bg-border-color p-2 rounded mb-4" required />
            <textarea value={body} onChange={e => setBody(e.target.value)} placeholder="Descreva a sua pergunta em detalhe..." className="w-full flex-grow bg-border-color p-2 rounded mb-4 resize-none" required />
            {user.role === 'professor' && (
                <div className="flex items-center mb-4">
                    <input type="checkbox" id="isPinned" checked={isPinned} onChange={e => setIsPinned(e.target.checked)} className="h-4 w-4 rounded" />
                    <label htmlFor="isPinned" className="ml-2 text-secondary-text">Fixar este tópico no topo do fórum</label>
                </div>
            )}
            <div className="flex justify-end gap-4">
                <button type="button" onClick={onCancel} className="py-2 px-4 bg-gray-600 rounded">Cancelar</button>
                <button type="submit" disabled={isSubmitting} className="py-2 px-4 bg-blue-600 rounded disabled:bg-gray-500">{isSubmitting ? 'Publicando...' : 'Publicar Tópico'}</button>
            </div>
        </form>
    );
};


const ForumTab = ({ onReturn }) => {
    const { user } = useAuth();
    const { activityId } = useParams();

    // Controlo de navegação e dados
    const [view, setView] = useState('categories'); // 'categories', 'topics', 'topic_detail', 'create_topic'
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [topics, setTopics] = useState([]);
    const [selectedTopic, setSelectedTopic] = useState(null);

    // Controlo de UI e formulários
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [newPostBody, setNewPostBody] = useState('');

    // --- LÓGICA DE BUSCA DE DADOS ---
    const fetchCategories = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/forum/activity/${activityId}/categories`, { headers: { 'Authorization': `Bearer ${user.token}` } });
            if (!response.ok) throw new Error("Não foi possível carregar os canais do fórum.");
            setCategories(await response.json());
        } catch (err) { setError(err.message); } finally { setIsLoading(false); }
    }, [activityId, user.token]);

    const fetchTopics = useCallback(async (categoryId) => {
        setIsLoading(true);
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/forum/category/${categoryId}/topics`, { headers: { 'Authorization': `Bearer ${user.token}` } });
            if (!response.ok) throw new Error("Não foi possível carregar os tópicos.");
            setTopics(await response.json());
        } catch (err) { setError(err.message); } finally { setIsLoading(false); }
    }, [user.token]);

    const fetchTopicDetails = useCallback(async (topicId) => {
        setIsLoading(true);
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/forum/topics/${topicId}`, { headers: { 'Authorization': `Bearer ${user.token}` } });
            if (!response.ok) throw new Error("Não foi possível carregar o tópico.");
            setSelectedTopic(await response.json());
            setView('topic_detail');
        } catch (err) { setError(err.message); } finally { setIsLoading(false); }
    }, [user.token]);

    useEffect(() => { if (view === 'categories') { fetchCategories(); } }, [view, fetchCategories]);

    // --- LÓGICA DE CRIAÇÃO/ATUALIZAÇÃO ---
    const handleToggleLike = async (postId) => {
        // Não precisa de 'isSubmitting' para não bloquear a UI inteira por um like
        try {
            await fetch(`${import.meta.env.VITE_API_URL}/api/forum/posts/${postId}/like`, {
                method: 'POST', // A mesma rota lida com adicionar e remover
                headers: { 'Authorization': `Bearer ${user.token}` },
            });

            // Otimização: Atualiza o estado localmente para uma resposta visual instantânea
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

            // Opcional, mas bom para consistência: Recarrega os dados do servidor em segundo plano
            // await fetchTopicDetails(selectedTopic.id);

        } catch (err) {
            setError("Não foi possível registrar o like. Tente novamente.");
        }
    };
    const handleCreateTopic = async (title, body, isPinned) => {
        setIsSubmitting(true);
        try {
            await fetch(`${import.meta.env.VITE_API_URL}/api/forum/category/${selectedCategory.id}/topics`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user.token}` },
                body: JSON.stringify({ title, body, is_pinned: isPinned }),
            });
            await fetchTopics(selectedCategory.id); // Recarrega a lista de tópicos
            setView('topics');
        } catch (err) { setError(err.message); } finally { setIsSubmitting(false); }
    };

    const handleCreatePost = async () => {
        if (!newPostBody.trim()) return;
        setIsSubmitting(true);
        try {
            await fetch(`${import.meta.env.VITE_API_URL}/api/forum/topics/${selectedTopic.id}/posts`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user.token}` },
                body: JSON.stringify({ body: newPostBody }),
            });
            setNewPostBody('');
            await fetchTopicDetails(selectedTopic.id);
        } catch (err) { setError(err.message); } finally { setIsSubmitting(false); }
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

    // --- RENDERIZAÇÃO CONDICIONAL ---
    const renderContent = () => {
        if (isLoading) return <div className="text-center p-8">Carregando...</div>;
        if (error) return <div className="text-red-400 text-center p-8">{error}</div>;

        switch (view) {
            case 'create_topic':
                return <CreateTopicForm onSubmit={handleCreateTopic} onCancel={() => setView('topics')} isSubmitting={isSubmitting} />;

            case 'topic_detail':
                console.log('Comparando IDs:', {
                    userId: user.id,
                    typeUserId: typeof user.id,
                    authorId: selectedTopic.author_id,
                    typeAuthorId: typeof selectedTopic.author_id,
                    saoIguais: user.id === selectedTopic.author_id
                });
                return (
                    // MODIFICAÇÃO 1: O contêiner principal já tem as classes corretas (flex flex-col h-full)
                    // Isso garante que ele tentará ocupar todo o espaço do seu pai.
                    <div className="flex flex-col h-full">
                        {/* --- SEÇÃO DO CABEÇALHO (Não rola) --- */}
                        <div>
                            <button onClick={() => setView('topics')} className="mb-4 flex items-center gap-2 text-yellow-400 hover:text-yellow-200">
                                <FaArrowLeft /> Voltar para os tópicos
                            </button>
                            <div className="bg-border-color p-4 rounded-lg mb-4">
                                <h2 className="text-2xl font-bold text-primary-text">{selectedTopic.title}</h2>
                                <p className="text-sm text-secondary-text">por {selectedTopic.author_name}</p>
                                <p className="text-secondary-text mt-4 whitespace-pre-wrap">{selectedTopic.body}</p>
                            </div>
                            <h3 className="font-bold mb-2">Respostas</h3>
                        </div>

                        {/* MODIFICAÇÃO 2: A MÁGICA ACONTECE AQUI */}
                        {/* Este div agora é o contêiner de rolagem.
                - 'flex-grow': Faz ele se expandir para preencher o espaço disponível.
                - 'overflow-y-auto': Adiciona a barra de rolagem vertical APENAS quando necessário.
                - 'min-h-0': Uma propriedade importante do flexbox para evitar que ele mesmo cause um overflow no pai.
            */}
                        <div className="flex-grow space-y-4 overflow-y-auto pr-2 min-h-0">
                            {selectedTopic.posts.map(post => (
                                <PostItem key={post.id} post={post}
                                    isTopicAuthor={Number(user.id) === Number(selectedTopic.author_id)}
                                    onMarkBest={handleMarkBest}
                                    isBestAnswer={post.id === selectedTopic.best_answer_id}
                                    onToggleLike={handleToggleLike}
                                />
                            ))}
                        </div>

                        {/* --- SEÇÃO DO RODAPÉ / CAIXA DE RESPOSTA (Não rola) --- */}
                        {/* MODIFICAÇÃO 3: Esta seção fica fixa na parte de baixo.
                - 'flex-shrink-0': Garante que a caixa de resposta não encolha.
            */}
                        <div className="mt-4 flex-shrink-0">
                            <textarea value={newPostBody} onChange={e => setNewPostBody(e.target.value)} placeholder="Escreva a sua resposta..." className="w-full bg-border-color p-2 rounded-t-lg focus:outline-none resize-none h-20" />
                            <button onClick={handleCreatePost} disabled={isSubmitting} className="w-full bg-teal-600 p-2 rounded-b-lg disabled:bg-gray-500 font-bold flex items-center justify-center gap-2">
                                <FaPaperPlane /> Publicar Resposta
                            </button>
                        </div>
                    </div>
                );


            case 'topics':
                return (
                    <>
                        <button onClick={() => setView('categories')} className="mb-4 flex items-center gap-2 text-yellow-400 hover:text-yellow-200"><FaArrowLeft /> Voltar para os canais</button>
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-2xl font-bold">{selectedCategory?.title}</h2>
                            <button onClick={() => setView('create_topic')} className="bg-blue-600 py-2 px-3 rounded-lg flex items-center gap-2 font-bold"><FaPlus /> Criar Tópico</button>
                        </div>
                        <div className="space-y-3">
                            {topics.length > 0 ? topics.map(topic => <TopicListItem key={topic.id} topic={topic} onSelect={fetchTopicDetails} />) : <p className="text-secondary-text text-center p-8">Nenhum tópico criado neste canal ainda.</p>}
                        </div>
                    </>
                );

            default: // 'categories'
                return (
                    <>
                        <h2 className="text-2xl font-bold text-teal-400 mb-4">Canais do Fórum</h2>
                        <div className="space-y-3">
                            {categories.map(category => (
                                <CategoryListItem key={category.id} category={category} onSelect={(category) => {
                                    setSelectedCategory(category);
                                    fetchTopics(category.id);
                                    setView('topics');
                                }} />
                            ))}
                        </div>
                    </>
                );
        }
    };

    return (
        // O contêiner principal continua com a altura fixa e agora é o nosso contêiner flex.
        <div className="bg-primary-bg p-6 rounded-lg text-primary-text flex flex-col" style={{ height: '80vh', maxHeight: '700px' }}>
            {/* O botão "Voltar" agora é um filho direto do contêiner flex. 
            Usamos 'flex-shrink-0' para garantir que ele não seja esmagado. */}
            <div className='flex-shrink-0'>
                <button onClick={onReturn} className="absolute top-4 left-4 flex items-center gap-2 text-yellow-400 hover:text-yellow-200 transition-colors z-20">
                    <FaArrowLeft /> Voltar ao Tabuleiro
                </button>
            </div>

            {/* O conteúdo renderizado agora ocupa o espaço restante.
            'flex-grow': permite que ele cresça.
            'relative': necessário se houver elementos posicionados absolutamente dentro.
            'mt-8': a margem que estava no div anterior.
            'min-h-0': crucial para evitar que o conteúdo flex cresça além do limite do pai.
        */}
            <div className="flex-grow relative mt-8 min-h-0">
                {renderContent()}
            </div>
        </div>
    );
};

export default ForumTab;