import React, { useState } from 'react';
import { Copy, Check, Terminal } from 'lucide-react';

/**
 * CodeBlockViewer (Melhoria 24: Editor e Visualizador de Código com Destaque de Sintaxe e Linhas)
 */
export default function CodeBlockViewer({ code = '', language = 'javascript' }) {
    const [copied, setCopied] = useState(false);

    if (!code) return null;

    const lines = code.trim().split('\n');

    const handleCopy = () => {
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="my-3 rounded-2xl overflow-hidden border border-border-color bg-gray-950 text-gray-100 shadow-xl font-mono text-xs">
            {/* Header com Linguagem e Botão Copiar */}
            <div className="flex items-center justify-between px-4 py-2 bg-gray-900 border-b border-white/10 text-secondary-text">
                <span className="flex items-center gap-1.5 text-[11px] font-bold text-accent-teal uppercase tracking-wider">
                    <Terminal size={14} /> {language}
                </span>
                <button
                    onClick={handleCopy}
                    className="flex items-center gap-1 text-[11px] font-bold hover:text-white transition-colors py-0.5 px-2 rounded-md hover:bg-white/10"
                    title="Copiar código"
                >
                    {copied ? (
                        <>
                            <Check size={13} className="text-green-400" />
                            <span className="text-green-400">Copiado!</span>
                        </>
                    ) : (
                        <>
                            <Copy size={13} />
                            <span>Copiar</span>
                        </>
                    )}
                </button>
            </div>

            {/* Linhas de Código com Numeração */}
            <div className="p-3 overflow-x-auto space-y-1">
                {lines.map((line, idx) => (
                    <div key={idx} className="flex gap-3 leading-relaxed hover:bg-white/5 px-1 rounded">
                        <span className="select-none text-gray-500 text-right w-6 shrink-0 text-[11px]">
                            {idx + 1}
                        </span>
                        <code className="text-emerald-300 font-mono whitespace-pre">
                            {line}
                        </code>
                    </div>
                ))}
            </div>
        </div>
    );
}