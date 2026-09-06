import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

/**
 * ContactPage
 * 
 * Architectural intent: Provides a decoupled, generic form interface for user feedback and support requests.
 * It encapsulates its own form state and submission logic, keeping it completely isolated from the core
 * gamification engine and maintaining a strict Separation of Concerns.
 */
const ContactPage = () => {
    const { user } = useContext(AuthContext); // Pegar dados se logado
    const navigate = useNavigate();
    const location = useLocation();

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: '',
        message: ''
    });
    const [loading, setLoading] = useState(false);
    const [feedback, setFeedback] = useState({ type: '', msg: '' });

    // Preenche automático se user existir e busca parâmetros da URL
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const subjectParam = params.get('subject');
        const bodyParam = params.get('body');

        setFormData(prev => ({
            ...prev,
            name: user?.name || prev.name,
            email: user?.email || prev.email,
            subject: subjectParam || prev.subject,
            message: bodyParam || prev.message
        }));
    }, [user, location.search]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setFeedback({ type: '', msg: '' });

        try {
            const response = await fetch('/api/contact/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(localStorage.getItem('token') ? { 'Authorization': `Bearer ${localStorage.getItem('token')}` } : {})
                },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                // 1. Feedback visual imediato
                setFeedback({ type: 'success', msg: 'Mensagem enviada! Voltando ao dashboard...' });

                // Opcional: Limpar formulário se não estiver logado
                if (!user) setFormData({ name: '', email: '', subject: '', message: '' });

                // 2. O Delay de 2 segundos (2000ms)
                setTimeout(() => {
                    // Lógica inteligente: Se tiver usuário logado -> Dashboard. Se for visitante -> Home.
                    if (user) {
                        navigate('/dashboard'); // Certifique-se que essa rota existe
                    } else {
                        navigate('/'); // Visitantes voltam para a landing page
                    }
                }, 2000);

            } else {
                throw new Error('Erro ao enviar mensagem.');
            }
        } catch (error) {
            setFeedback({ type: 'error', msg: 'Houve um problema. Tente novamente.' });
        } finally {
            // Nota: Se quiser que o botão continue desabilitado durante os 2 segundos de espera,
            // mova o setLoading(false) para dentro do bloco 'catch' ou verifique o sucesso antes.
            // Do jeito que está abaixo, ele reabilita o botão enquanto espera, o que é aceitável.
            if (!feedback.type === 'success') {
                setLoading(false);
            }
        }
    };

    return (
        <div className="min-h-screen bg-primary-bg text-gray-800 dark:text-gray-100 p-6 flex items-center justify-center">
            <div className="max-w-full w-full bg-secondary-bg rounded-xl shadow-lg p-8 border border-border-color">

                <h1 className="text-3xl font-bold mb-2 text-indigo-600 dark:text-indigo-400">Fale Conosco</h1>
                <p className="text-secondary-text mb-8">
                    Tem dúvidas sobre o Gamefica.Edu ou encontrou um bug? Mande uma mensagem.
                </p>

                {feedback.msg && (
                    <div className={`p-4 mb-6 rounded-md ${feedback.type === 'success' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'}`}>
                        {feedback.msg}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium mb-1">Nome</label>
                            <input
                                type="text"
                                name="name"
                                required
                                value={formData.name}
                                onChange={handleChange}
                                className="w-full p-3 rounded-lg border border-border-color bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-indigo-500 outline-none transition"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">E-mail</label>
                            <input
                                type="email"
                                name="email"
                                required
                                value={formData.email}
                                onChange={handleChange}
                                className="w-full p-3 rounded-lg border border-border-color bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-indigo-500 outline-none transition"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Assunto</label>
                        <input
                            type="text"
                            name="subject"
                            required
                            value={formData.subject}
                            onChange={handleChange}
                            placeholder="Ex: Dúvida sobre XP / Bug no Tabuleiro"
                            className="w-full p-3 rounded-lg border border-border-color bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-indigo-500 outline-none transition"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Mensagem</label>
                        <textarea
                            name="message"
                            rows="5"
                            required
                            value={formData.message}
                            onChange={handleChange}
                            className="w-full p-3 rounded-lg border border-border-color bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-indigo-500 outline-none transition"
                        ></textarea>
                    </div>

                    <div className="flex items-center justify-between mt-4">
                        <button
                            type="button"
                            onClick={() => navigate(-1)}
                            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition"
                        >
                            Voltar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className={`px-6 py-3 rounded-lg bg-indigo-600 text-white font-semibold shadow-md hover:bg-indigo-700 transition transform hover:scale-105 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {loading ? 'Enviando...' : 'Enviar Mensagem'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ContactPage;