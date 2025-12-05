// frontend/src/pages/LearningContentEditorPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaVideo, FaSave, FaExternalLinkAlt, FaAlignLeft } from 'react-icons/fa';
import ReactPlayer from 'react-player';
import { useActivityCreation } from '../context/ActivityCreationContext';

function LearningContentEditorPage({ initialData, onSave, isOfflineMode = false }) {
    const { activityId, stepId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { activityData } = useActivityCreation();

    // Estado inicial
    const [contentConfig, setContentConfig] = useState(() => {
        if (initialData) return initialData;
        // Tenta pegar do contexto (Modo Criação)
        const stepContent = activityData?.gamificationDesign?.progression_path?.find(p => p.id === stepId)?.content;
        return {
            video_url: stepContent?.video_url || '',
            text_content: stepContent?.text_content || '',
            material_link: stepContent?.material_link || ''
        };
    });

    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    // Fetch de dados (Apenas Online/Edição)
    const fetchContent = useCallback(async () => {
        if (isOfflineMode || !activityId || !stepId || !user?.token) return;

        setLoading(true);
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/content_editor/activity/${activityId}/step/${stepId}/content?type=content`, {
                headers: { 'Authorization': `Bearer ${user.token}` },
            });
            const data = await response.json();
            if (response.ok && data) {
                setContentConfig({
                    video_url: data.video_url || '',
                    text_content: data.text_content || '',
                    material_link: data.material_link || ''
                });
            }
        } catch (err) {
            console.error("Erro ao buscar conteúdo:", err);
        } finally {
            setLoading(false);
        }
    }, [activityId, stepId, user?.token, isOfflineMode]);

    useEffect(() => { fetchContent(); }, [fetchContent]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setContentConfig(prev => ({ ...prev, [name]: value }));
    };

    const handleSaveChanges = async () => {
        // 1. Modo Offline (Wizard de Criação)
        if (isOfflineMode) {
            if (onSave) onSave(contentConfig);
            return;
        }

        // 2. Modo Online (Edição de Atividade Existente)
        setLoading(true);
        setMessage('');
        setError('');

        try {
            const payload = { type: 'content', ...contentConfig };
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/content_editor/activity/${activityId}/step/${stepId}/content`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user.token}` },
                body: JSON.stringify(payload)
            });

            if (!res.ok) throw new Error('Falha ao salvar conteúdo.');

            setMessage('Conteúdo salvo com sucesso!');
            setTimeout(() => navigate(`/professor/atividades/${activityId}/edit`, { state: { fromStep: 5 } }), 1500);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-primary-bg text-primary-text p-4 md:p-8">
            <div className="max-w-5xl mx-auto">
                {/* Cabeçalho */}
                <div className="flex items-center gap-3 mb-8">
                    <div className="bg-gradient-to-r from-blue-500 to-cyan-500 p-3 rounded-xl">
                        <FaVideo className="text-xl text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold">Editor de Conteúdo</h1>
                        <p className="text-secondary-text">Adicione videoaulas e textos explicativos.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                    {/* Coluna da Esquerda: Formulário */}
                    <div className="space-y-6">

                        {/* Campo de Vídeo */}
                        <div className="bg-secondary-bg p-6 rounded-xl border border-border-color shadow-lg">
                            <label className="block text-sm font-bold mb-2 flex items-center gap-2">
                                <FaVideo className="text-red-500" /> Link do YouTube
                            </label>
                            <input
                                type="text"
                                name="video_url"
                                value={contentConfig.video_url}
                                onChange={handleInputChange}
                                placeholder="https://www.youtube.com/watch?v=..."
                                className="w-full p-3 bg-primary-bg rounded-lg border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                            />
                            <p className="text-xs text-gray-400 mt-2">
                                Dica: Copie o link completo do vídeo do navegador.
                            </p>
                        </div>

                        {/* Campo de Material Extra */}
                        <div className="bg-secondary-bg p-6 rounded-xl border border-border-color shadow-lg">
                            <label className="block text-sm font-bold mb-2 flex items-center gap-2">
                                <FaExternalLinkAlt className="text-blue-400" /> Link de Material Complementar (PDF/Slide)
                            </label>
                            <input
                                type="text"
                                name="material_link"
                                value={contentConfig.material_link}
                                onChange={handleInputChange}
                                placeholder="https://drive.google.com/..."
                                className="w-full p-3 bg-primary-bg rounded-lg border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                            />
                        </div>

                        {/* Campo de Texto (Markdown) */}
                        <div className="bg-secondary-bg p-6 rounded-xl border border-border-color shadow-lg">
                            <label className="block text-sm font-bold mb-2 flex items-center gap-2">
                                <FaAlignLeft className="text-green-400" /> Conteúdo em Texto (Markdown suportado)
                            </label>
                            <textarea
                                name="text_content"
                                rows="12"
                                value={contentConfig.text_content}
                                onChange={handleInputChange}
                                placeholder="# Título da Aula&#10;&#10;Escreva aqui o conteúdo teórico..."
                                className="w-full p-3 bg-primary-bg rounded-lg border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-mono text-sm"
                            />
                        </div>
                    </div>

                    {/* Coluna da Direita: Preview */}
                    <div className="space-y-6">
                        <h3 className="text-xl font-bold text-secondary-text">Pré-visualização do Vídeo</h3>

                        <div className="aspect-video bg-black rounded-xl overflow-hidden shadow-2xl border border-gray-700 flex items-center justify-center">
                            {contentConfig.video_url ? (
                                <ReactPlayer
                                    url={contentConfig.video_url}
                                    width="100%"
                                    height="100%"
                                    controls
                                />
                            ) : (
                                <div className="text-gray-500 flex flex-col items-center">
                                    <FaVideo size={40} className="mb-2 opacity-50" />
                                    <p>Cole um link para visualizar</p>
                                </div>
                            )}
                        </div>

                        <div className="bg-info-bg p-4 rounded-lg border border-info/30 text-info text-sm">
                            <strong>Nota:</strong> O texto escrito ao lado aparecerá formatado abaixo do vídeo na visão do aluno.
                        </div>
                    </div>
                </div>

                {/* Footer de Ação */}
                <div className="mt-8 pt-6 border-t border-border-color flex flex-col md:flex-row gap-4 items-center">
                    <button
                        onClick={handleSaveChanges}
                        disabled={loading}
                        className="w-full md:w-auto bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white font-bold py-3 px-8 rounded-xl shadow-lg transform transition hover:scale-105 flex items-center justify-center gap-2"
                    >
                        <FaSave /> {loading ? 'Salvando...' : 'Salvar Conteúdo'}
                    </button>

                    {message && <span className="text-green-400 font-medium animate-pulse">{message}</span>}
                    {error && <span className="text-red-400 font-medium">{error}</span>}
                </div>
            </div>
        </div>
    );
}

export default LearningContentEditorPage;