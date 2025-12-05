import React from 'react';
import ReactPlayer from 'react-player';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks'; // <--- IMPORTANTE: Resolve o problema do Enter
import rehypeHighlight from 'rehype-highlight'; // <--- IMPORTANTE: Para código bonito
import 'highlight.js/styles/github-dark.css'; // Importe o estilo de código (verifique se o pacote highlight.js está instalado ou remova essa linha se não for usar agora)

const LearningMaterialViewer = ({ content, onComplete }) => {
    const { video_url, text_content, material_link } = content || {};

    const processedText = React.useMemo(() => {
        if (!text_content) return '';

        // 1. Corrige o escape do banco de dados
        let text = text_content.replace(/\\n/g, '\n');

        // 2. GAMBIARRA DO BEM: Tenta consertar código sem crase
        // Se encontrar "python" numz linha e logo depois algo que parece comentário ou código,
        // mas NÃO tem crase antes, a gente adiciona.
        if (text.includes('python') && !text.includes('```python')) {
            // Envolve a parte do código (heuristicamente começa após "python" e vai até o fim ou próxima seção)
            text = text.replace(/python\n/g, '```python\n');
            // Tenta fechar o bloco no final do texto ou antes de uma "Dica"
            if (text.includes('> **Dica')) {
                 text = text.replace(/> \*\*Dica/g, '```\n\n> **Dica');
            } else {
                 text += '\n```'; // Fecha no final se não tiver dica
            }
        }

        // 3. Garante espaçamento nos parágrafos normais (não mexe no que já for código)
        // Só aplica quebra dupla se não estivermos dentro de um bloco de código (simplificado)
        // Dica: O plugin remark-breaks já cuida de quebras simples, deixe o Markdown fluir.
        
        return text;
    }, [text_content]);

    console.log("TEXTO ORIGINAL:", JSON.stringify(text_content));
    console.log("TEXTO PROCESSADO:", JSON.stringify(processedText));

    return (
        // Container Principal: bg-secondary-bg para destacar do fundo da página
        <div className="flex flex-col h-full w-full max-w-6xl mx-auto bg-secondary-bg rounded-xl shadow-2xl overflow-hidden border border-[var(--border-color)] animate-fade-in transition-colors duration-300">

            {/* Header */}
            <div className="p-4 border-b border-[var(--border-color)] flex justify-between items-center bg-secondary-bg">
                <h2 className="text-xl font-bold text-primary-text flex items-center gap-2">
                    📚 Material de Estudo
                </h2>
                {material_link && (
                    <a
                        href={material_link}
                        target="_blank"
                        rel="noreferrer"
                        // Link usando cor semântica de Informação (Azul)
                        className="text-sm text-info hover:text-info/80 underline transition-colors font-medium"
                    >
                        Material Complementar ↗
                    </a>
                )}
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar bg-secondary-bg">

                {/* Seção de Vídeo */}
                {video_url && (
                    <div className="w-full aspect-video bg-black rounded-lg overflow-hidden shadow-lg border border-[var(--border-color)] ring-1 ring-white/10">
                        <ReactPlayer
                            url={video_url}
                            width="100%"
                            height="100%"
                            controls={true}
                        />
                    </div>
                )}

                {/* Seção de Texto (Markdown) - UPGRADE VISUAL */}
                {text_content && (
                    // Fundo primary-bg cria um contraste de profundidade dentro do card secondary
                    <div className="bg-primary-bg p-6 rounded-lg border border-[var(--border-color)] shadow-inner transition-colors duration-300">
                        <article className="
                            prose max-w-none 
                            prose-p:my-4
                            /* Base de Texto */
                            text-secondary-text prose-p:leading-relaxed prose-p:mb-6
                            
                            /* Títulos adaptáveis */
                            prose-headings:text-primary-text prose-headings:font-bold prose-headings:mt-8 prose-headings:mb-4
                            
                            /* Listas */
                            prose-ul:my-6 prose-li:my-2 prose-li:text-secondary-text
                            
                            /* Destaques e Links */
                            prose-strong:text-accent-yellow 
                            prose-a:text-info prose-a:no-underline hover:prose-a:underline
                            
                            /* Citações (Blockquotes) */
                            prose-blockquote:border-l-4 prose-blockquote:border-success 
                            prose-blockquote:bg-secondary-bg prose-blockquote:text-secondary-text
                            prose-blockquote:px-4 prose-blockquote:py-2 prose-blockquote:rounded-r prose-blockquote:not-italic
                            
                            /* Blocos de Código */
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

            {/* Footer */}
            <div className="p-4 bg-secondary-bg border-t border-[var(--border-color)] flex justify-end">
                <button
                    onClick={() => onComplete(content.step_id)}
                    // Botão Sucesso: Texto Branco no tema claro (Verde Escuro) / Texto Escuro no tema escuro (Verde Claro)
                    className="px-8 py-3 bg-success hover:bg-success/90 text-white dark:text-primary-bg font-bold rounded-lg shadow-lg transform transition-all duration-200 hover:scale-105 active:scale-95 flex items-center gap-2"
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