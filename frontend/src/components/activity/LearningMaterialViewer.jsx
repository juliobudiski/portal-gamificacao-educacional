import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github-dark.css';

// Helper inteligente: Extrai o ID do YouTube de QUALQUER formato e monta a URL oficial de embed
const getYouTubeEmbedUrl = (input) => {
    if (!input) return null;
    let urlString = input.trim();

    // Se o professor colou o <iframe> inteiro, extrai só o conteúdo do src
    const iframeMatch = urlString.match(/src=["'](.*?)["']/i);
    if (iframeMatch) {
        urlString = iframeMatch[1];
    }

    // Tenta extrair o ID do vídeo (geralmente 11 caracteres)
    const regExp = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/|shorts\/)([^"&?\/\s]{11})/i;
    const match = urlString.match(regExp);

    if (match && match[1].length === 11) {
        return `https://www.youtube.com/embed/${match[1]}`;
    }

    // Fallback: se não achar que é youtube, devolve a URL formatada
    return /^https?:\/\//i.test(urlString) ? urlString : `https://${urlString}`;
};

const formatExternalUrl = (url) => {
    if (!url) return '';
    const trimmedUrl = url.trim();
    return /^https?:\/\//i.test(trimmedUrl) ? trimmedUrl : `https://${trimmedUrl}`;
};

const LearningMaterialViewer = ({ content, onComplete }) => {
    const { video_url, text_content, material_link } = content || {};
    const [isVideoLoaded, setIsVideoLoaded] = React.useState(false);

    const processedText = React.useMemo(() => {
        if (!text_content) return '';
        let text = text_content.replace(/\\n/g, '\n');
        if (text.includes('python') && !text.includes('```python')) {
            text = text.replace(/python\n/g, '```python\n');
            if (text.includes('> **Dica')) {
                text = text.replace(/> \*\*Dica/g, '```\n\n> **Dica');
            } else {
                text += '\n```';
            }
        }
        return text;
    }, [text_content]);

    const finalVideoUrl = getYouTubeEmbedUrl(video_url);
    const safeMaterialLink = formatExternalUrl(material_link);

    return (
        <div className="flex flex-col h-full w-full max-w-6xl mx-auto bg-primary-bg rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden border border-white/10 animate-fade-in transition-all duration-300 relative mt-8 mb-8">
            {/* Efeito de luz de fundo */}
            <div className="absolute top-0 right-1/4 w-[500px] h-[300px] bg-blue-600/20 rounded-full blur-[100px] pointer-events-none"></div>

            <div className="p-6 border-b border-white/10 bg-black/40 backdrop-blur-md relative z-10 flex items-center justify-between">
                <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] flex items-center gap-3 tracking-tight">
                    <span className="text-4xl">📚</span> Material de Apoio
                </h2>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar bg-transparent relative z-10">

                {/* CONTAINER DO VÍDEO CORRIGIDO - Iframe Nativo */}
                {finalVideoUrl && (
                    <div className="relative pt-[56.25%] bg-black rounded-2xl overflow-hidden shadow-[0_0_30px_rgba(0,0,0,0.6)] border border-white/10 group">
                        {!isVideoLoaded && (
                            <div className="absolute inset-0 flex items-center justify-center bg-gray-800 animate-pulse">
                                <div className="flex flex-col items-center">
                                    <svg className="w-12 h-12 text-gray-500 mb-2 animate-bounce" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/>
                                    </svg>
                                    <span className="text-gray-400 font-medium tracking-wide">Carregando player...</span>
                                </div>
                            </div>
                        )}
                        <iframe
                            className={`absolute top-0 left-0 w-full h-full transition-opacity duration-500 ${isVideoLoaded ? 'opacity-100' : 'opacity-0'}`}
                            src={finalVideoUrl}
                            title="Video player"
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            allowFullScreen
                            onLoad={() => setIsVideoLoaded(true)}
                        ></iframe>
                        <div className="absolute inset-0 border-2 border-transparent group-hover:border-white/20 rounded-2xl pointer-events-none transition-colors duration-300"></div>
                    </div>
                )}

                {text_content && (
                    <div className="bg-black/30 backdrop-blur-md p-8 rounded-2xl border border-white/5 shadow-inner transition-colors duration-300">
                        <article className="
                            prose max-w-none 
                            prose-p:my-4
                            text-gray-200 prose-p:leading-relaxed prose-p:mb-6 prose-p:text-lg
                            prose-headings:text-white prose-headings:font-bold prose-headings:mt-8 prose-headings:mb-4
                            prose-ul:my-6 prose-li:my-2 prose-li:text-secondary-text
                            prose-strong:text-cyan-400 
                            prose-a:text-blue-400 prose-a:no-underline hover:prose-a:underline hover:prose-a:text-cyan-300
                            prose-blockquote:border-l-4 prose-blockquote:border-cyan-500 
                            prose-blockquote:bg-white/5 prose-blockquote:text-secondary-text
                            prose-blockquote:px-6 prose-blockquote:py-3 prose-blockquote:rounded-r-lg prose-blockquote:not-italic prose-blockquote:shadow-md
                            prose-pre:bg-primary-bg prose-pre:border prose-pre:border-white/10 prose-pre:text-gray-200 prose-pre:rounded-xl prose-pre:shadow-lg
                            prose-code:text-pink-400 prose-code:bg-white/10 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md
                        ">
                            <ReactMarkdown
                                remarkPlugins={[remarkGfm, remarkBreaks]}
                                rehypePlugins={[rehypeHighlight]}
                            >
                                {processedText}
                            </ReactMarkdown>
                        </article>
                    </div>
                )}

                {!video_url && !text_content && (
                    <div className="text-center text-gray-500 py-16 italic text-lg bg-black/20 rounded-2xl border border-white/5">
                        Nenhum conteúdo cadastrado para este passo.
                    </div>
                )}
            </div>

            <div className="p-6 bg-black/40 backdrop-blur-md border-t border-white/10 flex flex-wrap justify-between items-center gap-4 relative z-10">

                {safeMaterialLink ? (
                    <a
                        href={safeMaterialLink}
                        target="_blank"
                        rel="noreferrer"
                        className="px-6 py-3 border border-cyan-500/50 text-cyan-400 bg-cyan-900/20 hover:bg-cyan-500 hover:text-primary-text font-bold rounded-xl transition-all duration-300 flex items-center gap-3 shadow-lg hover:shadow-[0_0_20px_rgba(6,182,212,0.6)]"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                        </svg>
                        Material Complementar
                    </a>
                ) : (
                    <div></div>
                )}

                <button
                    onClick={() => onComplete(content.step_id)}
                    className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold rounded-xl shadow-[0_0_15px_rgba(16,185,129,0.4)] hover:shadow-[0_0_25px_rgba(16,185,129,0.7)] transform transition-all duration-300 hover:-translate-y-1 active:scale-95 flex items-center gap-3 ml-auto"
                >
                    <span className="text-lg">Entendi, continuar!</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clipRule="evenodd" />
                    </svg>
                </button>
            </div>
        </div>
    );
};

export default LearningMaterialViewer;