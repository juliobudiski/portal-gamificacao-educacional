import React from "react";

/**
 * helpContent
 * 
 * Architectural intent: Centralizes the static text content used by the Help Modals across the application.
 * By extracting this extensive textual data into a standalone configuration module, it keeps the UI components
 * clean and simplifies future localization or content updates.
 */
export const helpContent = {
    analise_preliminar: {
        title: "Ajuda - Análise Preliminar e Competências",
        content: (
            <>
                <div className="space-y-4 text-primary-text text-justify">
                    {/* --- NOVO CONTEÚDO ADICIONADO (Início) --- */}
                    <div className="mb-6 pb-4 border-b border-gray-100">
                        <h4 className="font-bold text-lg text-accent-teal mb-2">Entendendo o Contexto Atual</h4>
                        <p className="mb-3">
                            Antes de gamificar, é crucial entender onde você está pisando. A literatura indica que a gamificação não é um remédio universal, mas uma técnica que depende do contexto. Esta etapa serve para mapear a situação atual antes de intervir.
                        </p>
                        <ul className="list-disc pl-5 space-y-2 text-gray-700">
                            <li>
                                <strong>Por que isso importa?</strong> Frameworks de design enfatizam a "análise de contexto" como o primeiro passo iterativo para o sucesso. Ignorar o contexto pode levar a soluções que falham por não se adequarem à realidade dos alunos ou da infraestrutura.
                            </li>
                            <li>
                                <strong>Dica:</strong> Considere se o ambiente é puramente educacional ou se envolve aspectos sociais e emocionais. A gamificação deve ser vista como o uso de elementos de jogos para resolver problemas reais, e não apenas para entretenimento.
                            </li>
                        </ul>
                    </div>
                    {/* --- NOVO CONTEÚDO ADICIONADO (Fim) --- */}

                    <p>
                        <strong>Avalie as habilidades e competências requeridas:</strong> Realize uma análise das habilidades e competências necessárias para os profissionais de engenharia de software. Isso pode incluir conhecimento em linguagens de programação, práticas de desenvolvimento ágil, padrões de design, testes automatizados, entre outros. Identificar essas competências auxiliará na definição dos objetivos de aprendizagem.
                    </p>
                    <p>
                        <strong>Considere o ambiente de trabalho em engenharia de software:</strong> Avalie as características do ambiente de trabalho em engenharia de software, como a colaboração em equipe, a pressão por prazos, o uso de ferramentas e tecnologias específicas. Isso ajudará a adaptar a gamificação para refletir as situações reais enfrentadas pelos profissionais nessa área.
                    </p>
                </div>

                <div className="mt-6 border-t pt-4">
                    <h4 className="font-bold text-primary-text mb-2">Leitura Complementar:</h4>
                    <ul className="list-disc pl-5 text-sm text-gray-600 space-y-2">
                        <li>
                            <a href="https://drive.google.com/file/d/14jM0EJt6OpH4woHQRh3bXzFaW2spF7oY/view?usp=drive_link" target="_blank" rel="noopener noreferrer" className="text-accent-teal hover:text-accent-purple font-medium hover:underline transition-colors">
                                MORA, Alberto et al. A literature review of gamification design frameworks. IEEE, 2015.
                            </a>
                        </li>
                        <li>
                            <a href="https://drive.google.com/file/d/1z4nAb8mY5zeW3c4Pj-Se11hTAG840u6P/view?usp=drive_link" target="_blank" rel="noopener noreferrer" className="text-accent-teal hover:text-accent-purple font-medium hover:underline transition-colors">
                                HAMARI, Juho et al. Does gamification work? IEEE, 2014.
                            </a>
                        </li>
                        <li>
                            KAPP, Karl M. The gamification of learning and instruction. John Wiley & Sons, 2012.
                        </li>
                    </ul>
                </div>
            </>
        ),
    },

    cenario_desejado: {
        title: "Ajuda - Cenário Desejado",
        content: (
            <>
                <div className="space-y-4 text-primary-text text-justify">
                    {/* --- NOVO CONTEÚDO ADICIONADO (Início) --- */}
                    <div className="mb-6 pb-4 border-b border-gray-100">
                        <h4 className="font-bold text-lg text-accent-teal mb-2">Definindo Objetivos e Metas</h4>
                        <p className="mb-3">
                            O que você espera alcançar? A gamificação eficaz começa com a definição clara de objetivos de negócio (ou de aprendizado). Você não está apenas criando um jogo, está tentando moldar comportamentos ou facilitar a aprendizagem.
                        </p>
                        <ul className="list-disc pl-5 space-y-2 text-gray-700">
                            <li>
                                <strong>Por que isso importa?</strong> Estudos indicam que a percepção de "instrumentalidade" (a utilidade futura do que se aprende) é uma estratégia motivacional poderosa. Se o aluno perceber que a atividade o leva a um objetivo valioso (cenário desejado), o engajamento aumenta.
                            </li>
                            <li>
                                <strong>Dica:</strong> Seja específico. Você quer aumentar a participação, a colaboração ou a retenção de conteúdo? Frameworks consagrados, como o 6D de Werbach e Hunter, iniciam sempre pela definição dos objetivos.
                            </li>
                        </ul>
                    </div>
                    {/* --- NOVO CONTEÚDO ADICIONADO (Fim) --- */}

                    <p>Definir objetivos claros e específicos requer algumas etapas:</p>
                    <ul className="list-disc pl-5 space-y-1">
                        <li><strong>Identifique o objetivo geral:</strong> determine o que você deseja alcançar.</li>
                        <li><strong>Seja específico:</strong> defina o objetivo de forma clara e detalhada.</li>
                        <li><strong>Mantenha-o realista:</strong> estabeleça metas alcançáveis e realistas de acordo com suas habilidades e recursos.</li>
                        <li><strong>Mantenha-o mensurável:</strong> determine como você medirá o sucesso em relação ao objetivo.</li>
                        <li><strong>Mantenha o prazo:</strong> estabeleça uma data para alcançar o objetivo.</li>
                        <li><strong>Mantenha-o relevante:</strong> certifique-se de que o objetivo seja importante para você e esteja alinhado com suas metas a longo prazo.</li>
                    </ul>

                    <p>Para garantir que seus objetivos são alcançáveis, é importante seguir algumas dicas:</p>
                    <ul className="list-disc pl-5 space-y-1">
                        <li><strong>Analise suas habilidades e recursos:</strong> certifique-se de que você possui as habilidades e os recursos necessários.</li>
                        <li><strong>Divida o objetivo em pequenas metas:</strong> estabeleça metas intermediárias que ajudem a chegar ao objetivo final.</li>
                        <li><strong>Mantenha o foco:</strong> evite se distrair com tarefas irrelevantes.</li>
                        <li><strong>Mantenha-se motivado:</strong> mantenha-se comprometido com o objetivo.</li>
                    </ul>
                </div>
            </>
        ),
    },

    elementos_jogos: {
        title: "Ajuda - Elementos de Jogos",
        content: (
            <>
                <div className="space-y-4 text-primary-text text-justify">
                    {/* --- NOVO CONTEÚDO ADICIONADO (Início) --- */}
                    <div className="mb-6 pb-4 border-b border-gray-100">
                        <h4 className="font-bold text-lg text-accent-teal mb-2">Mecânicas e Dinâmicas</h4>
                        <p className="mb-3">
                            Agora é hora de escolher as ferramentas: Pontos, Medalhas (Badges) e Rankings (Leaderboards) são os mais comuns, mas não os únicos. Esses elementos são chamados na literatura de "affordances motivacionais".
                        </p>
                        <ul className="list-disc pl-5 space-y-2 text-gray-700 mb-4">
                            <li>
                                <strong>Pontos e Rankings:</strong> São eficazes para feedback de status e comparação social.
                            </li>
                            <li>
                                <strong>Medalhas (Badges):</strong> Servem para reconhecer conquistas específicas e flexibilizar os caminhos de aprendizado.
                            </li>
                            <li>
                                <strong>Níveis/Barras de Progresso:</strong> Fundamentais para dar a sensação de avanço e maestria.
                            </li>
                        </ul>
                        <div className="mt-4 p-4 rounded-r-xl text-sm border-l-4 bg-accent-yellow/10 border-accent-yellow text-gray-700 dark:text-gray-200">
                            <strong className="text-accent-yellow font-bold uppercase tracking-wide">Cuidado: </strong>{' '}
                            O uso excessivo de competição (rankings) pode ser desmotivador para alguns perfis.
                            Considere equilibrar com elementos cooperativos. A literatura mostra que os
                            elementos mais citados em estudos empíricos são pontos, rankings e medalhas.
                        </div>
                    </div>
                    {/* --- NOVO CONTEÚDO ADICIONADO (Fim) --- */}

                    <p>Descrição detalhada das mecânicas e componentes dos jogos:</p>
                    <ul className="list-disc pl-5 space-y-2">
                        <li><strong>Competição e Pressão de tempo:</strong> Considere adicionar rankings ou tabelas de liderança. Útil incluir recompensas para pontuações excepcionais.</li>
                        <li><strong>Progressão e Nível:</strong> Certifique-se de que a progressão é gradual. Considere permitir personalização de estatísticas.</li>
                        <li><strong>Feedback e Reconhecimento:</strong> Inclua feedback imediato após cada ação e reconhecimento por conquistas.</li>
                        <li><strong>Interação social e Reputação:</strong> Crie mecanismos para comunicação (fóruns, chat) e formação de equipes.</li>
                        <li><strong>Comunicação e Cooperação:</strong> Incentive a cooperação com recompensas para tarefas em equipe.</li>
                        <li><strong>Economia e Raridade:</strong> Ofereça personalização e considere elementos de economia (compra e venda de itens).</li>
                        <li><strong>Narrativas e Storytelling:</strong> Crie histórias envolventes que conectem os jogadores ao mundo do jogo.</li>
                        <li><strong>Recompensas atraentes:</strong> Devem ser desejáveis e distribuídas de maneira justa.</li>
                        <li><strong>Rankings e Pressão Social:</strong> Use com cuidado para não criar um ambiente tóxico.</li>
                    </ul>
                </div>

                <div className="mt-6 border-t pt-4">
                    <h4 className="font-bold text-primary-text mb-2">Leitura Complementar:</h4>
                    <ul className="list-disc pl-5 text-sm text-gray-600 space-y-2">
                        <li>
                            <a href="https://drive.google.com/file/d/1ZsXbv2JzATJn45r2LUVXVXNsJlGxAfRN/view?usp=drive_link" target="_blank" rel="noopener noreferrer" className="text-accent-teal hover:text-accent-purple font-medium hover:underline transition-colors">
                                TODA, Armando M. et al. Analysing gamification elements... Smart Learning Environments, 2019.
                            </a>
                        </li>
                        <li>
                            <a href="https://drive.google.com/file/d/1z3L6h_VX99MxTWgsigXYp5UDNxT0DT60/view?usp=drive_link" target="_blank" rel="noopener noreferrer" className="text-accent-teal hover:text-accent-purple font-medium hover:underline transition-colors">
                                DICHEVA, Darina et al. Gamification in education: A systematic mapping study. 2015.
                            </a>
                        </li>
                    </ul>
                </div>
            </>
        ),
    },

    perfil_jogador: {
        title: "Ajuda - Perfil do Jogador",
        content: (
            <>
                <div className="space-y-4 text-primary-text text-justify">
                    {/* --- NOVO CONTEÚDO ADICIONADO (Início) --- */}
                    <div className="mb-6 pb-4 border-b border-gray-100">
                        <h4 className="font-bold text-lg text-accent-teal mb-2">Focando no Usuário (Aluno)</h4>
                        <p className="mb-3">
                            Nem todos os alunos se motivam da mesma forma. Alguns preferem competir, outros colaborar ou explorar. Conhecer seu público é essencial para escolher as mecânicas certas.
                        </p>
                        <ul className="list-disc pl-5 space-y-2 text-gray-700 mb-2">
                            <li>
                                <strong>O que diz a ciência:</strong> Pesquisas no contexto brasileiro (como o QPJ-BR) identificaram que os interesses dos jogadores se agrupam principalmente em três grandes áreas:
                            </li>
                        </ul>

                        <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg border-l-4 border-accent-purple mb-3">
                            <ul className="list-disc pl-5 space-y-1 text-sm">
                                <li><strong>Realização:</strong> Foco em competir, vencer e superar desafios.</li>
                                <li><strong>Social:</strong> Foco em ajudar, relacionar-se e trabalhar em equipe.</li>
                                <li><strong>Imersão:</strong> Foco em personalizar, fantasiar e explorar narrativas.</li>
                            </ul>
                        </div>

                        <p className="text-sm italic text-gray-600">
                            <strong>Lembre-se:</strong> A maioria dos frameworks de design coloca o aluno no centro do processo. Adapte as dicas abaixo ao perfil predominante da sua turma.
                        </p>
                    </div>
                    {/* --- NOVO CONTEÚDO ADICIONADO (Fim) --- */}

                    <p>Elementos ideais para motivar cada tipo de jogador (Baseado em Hamari & Tuunanen, 2014):</p>

                    <div className="grid gap-4 sm:grid-cols-1">
                        <div className="bg-secondary-bg dark:bg-gray-800/40 p-4 rounded-xl border border-border-color shadow-sm hover:border-accent-teal transition-colors">
                            <strong className="block text-accent-purple text-lg mb-2">Jogador Competitivo:</strong>
                            <ul className="list-disc pl-5 text-sm">
                                <li>Competição clara e Rankings.</li>
                                <li>Objetivos desafiadores.</li>
                                <li>Feedback sobre progresso e personalização.</li>
                            </ul>
                        </div>

                        <div className="bg-secondary-bg dark:bg-gray-800/40 p-4 rounded-xl border border-border-color shadow-sm hover:border-accent-teal transition-colors">
                            <strong className="block text-accent-purple text-lg mb-2">Jogador Cooperativo:</strong>
                            <ul className="list-disc pl-5 text-sm">
                                <li>Trabalho em equipe e objetivos comuns.</li>
                                <li>Feedback do time e recompensas coletivas.</li>
                            </ul>
                        </div>

                        <div className="bg-secondary-bg dark:bg-gray-800/40 p-4 rounded-xl border border-border-color shadow-sm hover:border-accent-teal transition-colors">
                            <strong className="block text-accent-purple text-lg mb-2">Jogador Imersivo:</strong>
                            <ul className="list-disc pl-5 text-sm">
                                <li>Narrativas envolventes e mundos detalhados.</li>
                                <li>Escolhas que afetam a história.</li>
                            </ul>
                        </div>

                        <div className="bg-secondary-bg dark:bg-gray-800/40 p-4 rounded-xl border border-border-color shadow-sm hover:border-accent-teal transition-colors">
                            <strong className="block text-accent-purple text-lg mb-2">Jogador de Realização:</strong>
                            <ul className="list-disc pl-5 text-sm">
                                <li>Objetivos claros e progressão por habilidade.</li>
                                <li>Recompensas atraentes e certificados.</li>
                            </ul>
                        </div>

                        <div className="bg-secondary-bg dark:bg-gray-800/40 p-4 rounded-xl border border-border-color shadow-sm hover:border-accent-teal transition-colors">
                            <strong className="block text-accent-purple text-lg mb-2">Jogador Social:</strong>
                            <ul className="list-disc pl-5 text-sm">
                                <li>Interação social e mentorias.</li>
                                <li>Recompensas coletivas.</li>
                            </ul>
                        </div>
                    </div>
                </div>

                <div className="mt-6 border-t pt-4">
                    <h4 className="font-bold text-primary-text mb-2">Leitura Complementar:</h4>
                    <ul className="list-disc pl-5 text-sm text-gray-600 space-y-2">
                        <li>
                            <a href="https://drive.google.com/file/d/15eDnth1Qh9cw4T1jIa5apTYXW6qZquCJ/view?usp=drive_link" target="_blank" rel="noopener noreferrer" className="text-accent-teal hover:text-accent-purple font-medium hover:underline transition-colors">
                                HAMARI, Juho; TUUNANEN, Janne. Player types: A meta-synthesis. 2014.
                            </a>
                        </li>
                        <li>
                            <a href="https://drive.google.com/file/d/1s4RKWrt1ob7Yu1uwyCzdEbipzCPe8UEM/view?usp=drive_link" target="_blank" rel="noopener noreferrer" className="text-accent-teal hover:text-accent-purple font-medium hover:underline transition-colors">
                                ANDRADE, Fernando et al. Qpj-br: questionário para identificação de perfis... 2016.
                            </a>
                        </li>
                        <li>YEE, Nick. Motivations for play in online games. 2006.</li>
                    </ul>
                </div>
            </>
        ),
    },

    recompensas_oferecidas: {
        title: "Ajuda - Recompensas Oferecidas",
        content: (
            <>
                <div className="space-y-4 text-primary-text text-justify">
                    {/* --- NOVO CONTEÚDO ADICIONADO (Início) --- */}
                    <div className="mb-6 pb-4 border-b border-gray-100">
                        <h4 className="font-bold text-lg text-accent-teal mb-2">Tipos de Recompensa</h4>
                        <p className="mb-3">
                            As recompensas não precisam ser apenas notas. Elas podem ser intrínsecas (satisfação pessoal) ou extrínsecas (bens virtuais ou físicos).
                        </p>
                        <p className="mb-2 text-sm font-semibold text-gray-700">
                            Segundo Hamari e Eranti, as recompensas podem ser divididas em:
                        </p>
                        <ul className="list-disc pl-5 space-y-2 text-gray-700 mb-4">
                            <li>
                                <strong>In-game:</strong> Itens ou poderes utilizáveis dentro da própria atividade.
                            </li>
                            <li>
                                <strong>Achievement-game:</strong> Pontos ou status no sistema geral de gamificação.
                            </li>
                            <li>
                                <strong>Out-game:</strong> Recompensas externas (ex: pontos extras na média, um certificado físico).
                            </li>
                        </ul>

                        <div className="mt-4 p-4 rounded-r-xl text-sm border-l-4 bg-accent-teal/10 border-accent-teal text-gray-700 dark:text-gray-200">
                            <strong className="text-accent-teal font-bold uppercase tracking-wide">Dica Importante:</strong> Cuidado para que recompensas externas não diminuam a motivação intrínseca (o prazer de aprender por si só). Tente alinhar a recompensa à percepção de utilidade futura (instrumentalidade) para o aluno.
                        </div>
                    </div>
                    {/* --- NOVO CONTEÚDO ADICIONADO (Fim) --- */}

                    <p>Relações entre perfis e recompensas:</p>
                    <ul className="list-disc pl-5 space-y-2">
                        <li><strong>Competitivo:</strong> Pontos bônus, Vantagens, Acesso exclusivo, Certificados, Liderança.</li>
                        <li><strong>Cooperativo:</strong> Conquistas digitais, Destaque em grupo, Sala VIP, Mentorias.</li>
                        <li><strong>Imersivo:</strong> Tempo extra, Acesso a lore/vídeos, Filmes extras, Reconhecimento.</li>
                        <li><strong>Realização:</strong> Pontos, Conquistas, Certificados, Liderança.</li>
                        <li><strong>Social:</strong> Brindes, Viagens/Eventos, Reconhecimento público, Mentoria.</li>
                    </ul>

                    <div className="bg-accent-teal/10 border border-accent-teal/30 p-5 rounded-xl mt-6 relative overflow-hidden">
                        <h5 className="font-bold text-accent-teal mb-3 flex items-center gap-2">Dicas de Alinhamento:</h5>
                        <ul className="list-disc pl-5 text-sm text-gray-700 dark:text-gray-200 space-y-1">
                            <li><strong>Defina claramente os objetivos:</strong> Antes de criar recompensas.</li>
                            <li><strong>Relacione recompensas aos objetivos:</strong> Ex: Colaboração gera recompensa de grupo.</li>
                            <li><strong>Use recompensas progressivas:</strong> Aumente o valor conforme a dificuldade.</li>
                            <li><strong>Personalize:</strong> Alinhe aos interesses dos alunos.</li>
                        </ul>
                    </div>
                </div>

                <div className="mt-6 border-t pt-4">
                    <h4 className="font-bold text-primary-text mb-2">Leitura Complementar:</h4>
                    <ul className="list-disc pl-5 text-sm text-gray-600 space-y-2">
                        <li>
                            <a href="https://drive.google.com/file/d/1mhdDZTYB2krbHiuxs10kxYmBpJXc41d9/view?usp=drive_link" target="_blank" rel="noopener noreferrer" className="text-accent-teal hover:text-accent-purple font-medium hover:underline transition-colors">
                                ALCARÁ & GUIMARÃES. A Instrumentalidade como estratégia motivacional. 2007.
                            </a>
                        </li>
                        <li>
                            <a href="https://drive.google.com/file/d/1sJmdnGSFx4mPf9WvW7K3QFSNb6BTVlSq/view?usp=drive_link" target="_blank" rel="noopener noreferrer" className="text-accent-teal hover:text-accent-purple font-medium hover:underline transition-colors">
                                HAMARI & ERANTI. Framework for Designing and Evaluating Game Achievements. 2011.
                            </a>
                        </li>
                        <li>BROPHY, Jere. Research on motivation in education. 1999.</li>
                        <li>PRZYBYLSKI, Andrew K. et al. Having to versus wanting to play. 2009.</li>
                    </ul>
                </div>
            </>
        ),
    },

    regras_gamificacao: {
        title: "Ajuda - Regras da Gamificação",
        content: (
            <>
                <div className="space-y-4 text-primary-text text-justify">
                    {/* --- NOVO CONTEÚDO ADICIONADO (Início) --- */}
                    <div className="mb-6 pb-4 border-b border-gray-100">
                        <h4 className="font-bold text-lg text-accent-teal mb-2">Regras Operacionais</h4>
                        <p className="mb-3">
                            As regras definem os limites e como o jogo funciona. Elas devem ser claras para evitar frustração. Na literatura de design de jogos, isso é descrito como a "camada operacional" das regras.
                        </p>
                        <ul className="list-disc pl-5 space-y-2 text-gray-700 mb-2">
                            <li>
                                <strong>Clareza:</strong> O aluno deve saber exatamente o que é esperado dele e quais são as restrições. Regras ambíguas podem gerar desengajamento.
                            </li>
                            <li>
                                <strong>Fair Play:</strong> Defina como o sistema lida com a cooperação versus competição. Se houver trabalhos em grupo, como a nota é distribuída? A percepção de justiça é vital para manter a motivação social.
                            </li>
                        </ul>
                    </div>
                    {/* --- NOVO CONTEÚDO ADICIONADO (Fim) --- */}

                    <p>Dicas para alinhar regras com objetivos e ações recompensadas:</p>
                    <ul className="list-disc pl-5 space-y-2">
                        <li><strong>Estabelecer regras claras:</strong> Devem sustentar os objetivos.</li>
                        <li><strong>Verificar consistência:</strong> Regras não podem contradizer a recompensa.</li>
                        <li><strong>Comunicar claramente:</strong> Todos devem entender como jogar.</li>
                        <li><strong>Envolver os alunos:</strong> Peça ajuda na definição das regras para gerar compromisso.</li>
                        <li><strong>Flexibilidade:</strong> Esteja pronto para ajustes se algo não funcionar.</li>
                        <li><strong>Monitoramento:</strong> Avalie se as regras estão funcionando.</li>
                        <li><strong>Suporte:</strong> Ajude quem tem dificuldade em entender ou seguir as regras.</li>
                    </ul>
                </div>

                <div className="mt-6 border-t pt-4">
                    <h4 className="font-bold text-primary-text mb-2">Leitura Complementar:</h4>
                    <ul className="list-disc pl-5 text-sm text-gray-600 space-y-2">
                        <li>ZICHERMANN & CUNNINGHAM. Gamification by design. 2011.</li>
                        <li>TEKINBAS & ZIMMERMAN. Rules of play: Game design fundamentals. 2003.</li>
                        <li>KAPP, Karl M. The gamification of learning and instruction. 2012.</li>
                    </ul>
                </div>
            </>
        ),
    },

    acoes_recompensadas: {
        title: "Ajuda - Ações Recompensadas",
        content: (
            <>
                <div className="space-y-4 text-primary-text text-justify">
                    {/* --- NOVO CONTEÚDO ADICIONADO (Início) --- */}
                    <div className="mb-6 pb-4 border-b border-gray-100">
                        <h4 className="font-bold text-lg text-accent-teal mb-2">Lógica de Completude e Feedback</h4>
                        <p className="mb-3">
                            O que o aluno precisa fazer exatamente para ganhar a recompensa? Definir o "gatilho" (ação) e a "condição" é fundamental para que o sistema seja justo e compreensível.
                        </p>
                        <ul className="list-disc pl-5 space-y-2 text-gray-700 mb-4">
                            <li>
                                <strong>Feedback Rápido:</strong> Em games, a ação gera uma reação imediata. Na educação, tente encurtar o tempo entre a entrega da tarefa (ação) e o feedback/recompensa.
                            </li>
                            <li>
                                <strong>Estrutura da Ação:</strong> Defina o <em>Gatilho</em> (ex: responder um quiz), a <em>Condição</em> (ex: acertar 80%) e o <em>Multiplicador</em> (ex: quantas vezes pode repetir a ação).
                            </li>
                        </ul>

                        <div className="mt-4 p-4 rounded-r-xl text-sm border-l-4 bg-accent-teal/10 border-accent-teal text-gray-700 dark:text-gray-200">
                            <strong className="text-accent-teal font-bold uppercase tracking-wide">Importante:</strong> Inclua a possibilidade de "tentativa e erro". Permitir que o aluno falhe e tente novamente sem punição severa é um princípio chave da gamificação na educação.
                        </div>
                    </div>
                    {/* --- NOVO CONTEÚDO ADICIONADO (Fim) --- */}

                    <p>Dicas para estabelecer ações claras e significativas:</p>
                    <ul className="list-disc pl-5 space-y-2">
                        <li><strong>Identificar comportamentos desejáveis:</strong> O que você quer incentivar? (Ex: participação, pontualidade).</li>
                        <li><strong>Especificar as ações:</strong> O critério deve ser objetivo (Ex: responder corretamente x tentar responder).</li>
                        <li><strong>Ajuste às habilidades:</strong> Não recompense o impossível.</li>
                        <li><strong>Significado:</strong> A recompensa deve ser valorizada pelo aluno.</li>
                        <li><strong>Feedback imediato:</strong> Não demore para entregar a recompensa após a ação.</li>
                        <li><strong>Variedade:</strong> Evite o tédio mudando as recompensas/ações.</li>
                        <li><strong>Envolvimento:</strong> Alunos que ajudam a definir as ações se engajam mais.</li>
                    </ul>
                </div>

                <div className="mt-6 border-t pt-4">
                    <h4 className="font-bold text-primary-text mb-2">Leitura Complementar:</h4>
                    <ul className="list-disc pl-5 text-sm text-gray-600 space-y-2">
                        <li>
                            <a href="https://drive.google.com/file/d/1z4nAb8mY5zeW3c4Pj-Se11hTAG840u6P/view?usp=drive_link" target="_blank" rel="noopener noreferrer" className="text-accent-teal hover:text-accent-purple font-medium hover:underline transition-colors">
                                HAMARI, Juho et al. Does gamification work? 2014.
                            </a>
                        </li>
                        <li>
                            <a href="https://drive.google.com/file/d/1z3L6h_VX99MxTWgsigXYp5UDNxT0DT60/view?usp=drive_link" target="_blank" rel="noopener noreferrer" className="text-accent-teal hover:text-accent-purple font-medium hover:underline transition-colors">
                                DICHEVA, Darina et al. Gamification in education. 2015.
                            </a>
                        </li>
                        <li>
                            <a href="https://drive.google.com/file/d/1Rv2NjUjF_Fz4_DhvT0k1kf-xXc5g5Nui/view?usp=drive_link" target="_blank" rel="noopener noreferrer" className="text-accent-teal hover:text-accent-purple font-medium hover:underline transition-colors">
                                DETERDING, Sebastian et al. Gamification... 2011.
                            </a>
                        </li>
                        <li>BERKMAN, Elliot T. The neuroscience of goals and behavior change. 2018.</li>
                    </ul>
                </div>
            </>
        ),
    },

    tabuleiro_progressao: {
        title: "Ajuda - Trilha de Progressão",
        content: (
            <>
                <div className="space-y-4 text-primary-text text-justify">
                    <div className="mb-6 pb-4 border-b border-gray-100">
                        <h4 className="font-bold text-lg text-accent-teal mb-2">Construindo a Jornada</h4>
                        <p className="mb-3">
                            A trilha de progressão é a espinha dorsal do seu tabuleiro. Ela guia o aluno por meio de narrativas, conteúdos e desafios (quizzes).
                        </p>
                        <ul className="list-disc pl-5 space-y-2 text-gray-700 mb-4">
                            <li>
                                <strong>Narrativas:</strong> Use para engajar o aluno na história antes de cobrar conhecimento.
                            </li>
                            <li>
                                <strong>Conteúdos:</strong> Disponibilize material de apoio, links ou textos para estudo.
                            </li>
                            <li>
                                <strong>Quizzes:</strong> Teste o conhecimento adquirido. Evite começar a trilha diretamente com um quiz sem introdução.
                            </li>
                        </ul>
                        <div className="mt-4 p-4 rounded-r-xl text-sm border-l-4 bg-accent-teal/10 border-accent-teal text-gray-700 dark:text-gray-200">
                            <strong className="text-accent-teal font-bold uppercase tracking-wide">Dica da IA:</strong> Você pode usar o Roteirista Virtual para gerar automaticamente a história interligando os passos da trilha!
                        </div>
                    </div>
                </div>
            </>
        )
    }
};