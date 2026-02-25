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

    // Padrão Regex para capturar o ID (11 caracteres) de qualquer URL do YouTube
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = urlString.match(regExp);

    if (match && match[2].length === 11) {
        return `https://www.youtube.com/embed/${match[2]}`;
    }

    // Fallback: se não achar que é youtube, devolve o link formatado com https://
    return /^https?:\/\//i.test(urlString) ? urlString : `https://${urlString}`;
};

const formatExternalUrl = (url) => {
    if (!url) return '';
    const trimmedUrl = url.trim();
    return /^https?:\/\//i.test(trimmedUrl) ? trimmedUrl : `https://${trimmedUrl}`;
};

const LearningMaterialViewer = ({ content, onComplete }) => {
    const { video_url, text_content, material_link } = content || {};

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
        <div className="flex flex-col h-full w-full max-w-6xl mx-auto bg-secondary-bg rounded-xl shadow-2xl overflow-hidden border border-[var(--border-color)] animate-fade-in transition-colors duration-300">

            <div className="p-4 border-b border-[var(--border-color)] bg-secondary-bg">
                <h2 className="text-xl font-bold text-primary-text flex items-center gap-2">
                    📚 Material de Estudo
                </h2>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar bg-secondary-bg">

                {/* CONTAINER DO VÍDEO CORRIGIDO - Iframe Nativo */}
                {finalVideoUrl && (
                    <div className="relative pt-[56.25%] bg-black rounded-lg overflow-hidden shadow-lg border border-[var(--border-color)] ring-1 ring-white/10">
                        <iframe
                            className="absolute top-0 left-0 w-full h-full"
                            src={finalVideoUrl}
                            title="Video player"
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            allowFullScreen
                        ></iframe>
                    </div>
                )}

                {text_content && (
                    <div className="bg-primary-bg p-6 rounded-lg border border-[var(--border-color)] shadow-inner transition-colors duration-300">
                        <article className="
                            prose max-w-none 
                            prose-p:my-4
                            text-secondary-text prose-p:leading-relaxed prose-p:mb-6
                            prose-headings:text-primary-text prose-headings:font-bold prose-headings:mt-8 prose-headings:mb-4
                            prose-ul:my-6 prose-li:my-2 prose-li:text-secondary-text
                            prose-strong:text-accent-yellow 
                            prose-a:text-info prose-a:no-underline hover:prose-a:underline
                            prose-blockquote:border-l-4 prose-blockquote:border-success 
                            prose-blockquote:bg-secondary-bg prose-blockquote:text-secondary-text
                            prose-blockquote:px-4 prose-blockquote:py-2 prose-blockquote:rounded-r prose-blockquote:not-italic
                            prose-pre:bg-secondary-bg prose-pre:border prose-pre:border-[var(--border-color)] prose-pre:text-primary-text
                            prose-code:text-accent-purple prose-code:bg-secondary-bg prose-code:px-1 prose-code:rounded
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
                    <div className="text-center text-secondary-text py-10 italic">
                        Nenhum conteúdo cadastrado para este passo.
                    </div>
                )}
            </div>

            <div className="p-4 bg-secondary-bg border-t border-[var(--border-color)] flex flex-wrap justify-between items-center gap-4">

                {safeMaterialLink ? (
                    <a
                        href={safeMaterialLink}
                        target="_blank"
                        rel="noreferrer"
                        className="px-6 py-3 border-2 border-info text-info hover:bg-info hover:text-white font-bold rounded-lg transition-colors duration-200 flex items-center gap-2"
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
                    className="px-8 py-3 bg-success hover:bg-success/90 text-white dark:text-primary-bg font-bold rounded-lg shadow-lg transform transition-all duration-200 hover:scale-105 active:scale-95 flex items-center gap-2 ml-auto"
                >
                    <span>Entendi, continuar!</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clipRule="evenodd" />
                    </svg>
                </button>
            </div>
        </div>
    );
};

export default LearningMaterialViewer;