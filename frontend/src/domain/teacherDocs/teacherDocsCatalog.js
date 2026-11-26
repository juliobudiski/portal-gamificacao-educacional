/**
 * teacherDocsCatalog.js
 *
 * Repositório canônico Docs-as-Code da Central de Documentação Docente & FAQ do GamificaEdu.
 * Estruturado segundo o framework Diátaxis (Tutorials, How-To Guides, Explanation, Reference & FAQ)
 * e inspirado na ergonomia de leitura do Overleaf Learn.
 *
 * Rastreabilidade: US-26 | RF-16 | RNF-11 | ADR-024
 */

export const TEACHER_DOCS_CATEGORIES = Object.freeze([
  {
    slug: 'primeiros-passos',
    title: 'Primeiros Passos',
    diataxisType: 'Tutorial',
    badge: 'Início Rápido',
    iconName: 'Rocket',
    description: 'Aprenda a lógica central da plataforma e publique sua primeira missão gamificada em minutos.'
  },
  {
    slug: 'autoria-wizard',
    title: 'Criação & Editores (Wizard)',
    diataxisType: 'How-To Guide',
    badge: 'Autoria',
    iconName: 'Compass',
    description: 'Domine as etapas do assistente de criação, rascunhos automáticos e editores de Quiz, Narrativa e Markdown.'
  },
  {
    slug: 'motor-mdc-hexad',
    title: 'Motor Pedagógico MDC & Hexad',
    diataxisType: 'Explanation',
    badge: 'Ciência & SAD',
    iconName: 'Brain',
    description: 'Entenda os 6 perfis Hexad, o Sistema de Apoio à Decisão (MDC/MUI) e a prevenção do Dark Side da gamificação.'
  },
  {
    slug: 'orquestracao-ia',
    title: 'Inteligência Artificial (Gemini)',
    diataxisType: 'How-To Guide',
    badge: 'IA Generativa',
    iconName: 'Sparkles',
    description: 'Gere roteiros narrativos e baterias de questões comentadas com validação docente obrigatória (Human-in-the-Loop).'
  },
  {
    slug: 'economia-tabuleiro',
    title: 'Economia, Tabuleiro & Medalhas',
    diataxisType: 'Explanation',
    badge: 'Regras de Jogo',
    iconName: 'Trophy',
    description: 'Separação entre XP Vitalício e Moedas (ADR-004), critérios de conclusão, Loja de Cosméticos e Roleta Diária.'
  },
  {
    slug: 'turmas-avaliacao',
    title: 'Turmas, Prazos, Social & LGPD',
    diataxisType: 'Reference',
    badge: 'Gestão & Dados',
    iconName: 'BarChart2',
    description: 'Códigos de ingresso, agendamento pós-prazo, Fórum vs. Chat em tempo real, relatórios analíticos e proteção LGPD.'
  }
]);

export const TEACHER_DOCS_ARTICLES = Object.freeze([
  // =========================================================================
  // MÓDULO 1: PRIMEIROS PASSOS
  // =========================================================================
  {
    id: 'doc-visao-geral-ecossistema',
    categorySlug: 'primeiros-passos',
    slug: 'visao-geral-ecossistema',
    title: 'Visão Geral do Ecossistema GamificaEdu',
    subtitle: 'Como Turmas, Banco de Atividades, Tabuleiro Imersivo e Telemetria se conectam na rotina docente.',
    readingTimeMinutes: 4,
    diataxis: 'Tutorial',
    lastUpdated: 'v2.1',
    keywords: ['introducao', 'visao geral', 'ecossistema', 'como funciona', 'arquitetura pedagogica', 'overleaf'],
    relatedFaqIds: ['faq-fluxo-basico-professor', 'faq-diferenca-rascunho-publicada', 'faq-aluno-precisa-pagar'],
    actionLinks: [
      { label: 'Ir para o Painel do Professor', to: '/professor/dashboard', variant: 'primary' },
      { label: 'Gerenciar Minhas Turmas', to: '/professor/gerenciar-turmas', variant: 'secondary' }
    ],
    sections: [
      {
        id: 'arquitetura-pedagogica',
        heading: '1. O Ciclo Pedagógico em 4 Pilares',
        paragraphs: [
          'O GamificaEdu não é apenas um criador de questionários: ele opera como um Sistema de Apoio à Decisão (SAD) fundamentado em Engenharia de Software Educacional, Teoria da Autodeterminação (SDT), Taxonomia de Bloom e tipologia Hexad.',
          'Toda a experiência do professor foi desenhada para separar a autoria reutilizável (Modelo Mestre) da aplicação em turmas específicas, permitindo que uma mesma trilha seja aplicada em vários semestres sem retrabalho.'
        ],
        callout: {
          type: 'tip',
          title: 'Princípio do Modelo Mestre (ADR-017)',
          text: 'Você cria a atividade uma única vez no Banco de Atividades e pode atribuí-la para quantas turmas desejar, com prazos independentes para cada turma.'
        }
      },
      {
        id: 'mapa-modulos-professor',
        heading: '2. Mapa de Ferramentas do Professor',
        paragraphs: [
          'Consulte abaixo o papel exato de cada área disponível no menu superior Professor e no seu Painel Central:'
        ],
        table: {
          headers: ['Módulo do Portal', 'Rota Principal', 'Responsabilidade Pedagógica'],
          rows: [
            ['Gerenciar Turmas', '/professor/gerenciar-turmas', 'Cria salas virtuais, gera o código único de matrícula e lista estudantes inscritos.'],
            ['Criar Atividade (Wizard)', '/professor/criar-atividade', 'Assistente guiado com validação pedagógica MDC e geração assistida por IA Gemini.'],
            ['Banco de Atividades', '/professor/banco-atividades', 'Catálogo pessoal para editar rascunhos, visualizar prévias e atribuir missões às turmas.'],
            ['Desempenho Alunos', '/professor/desempenho-alunos', 'Painel analítico com taxas de conclusão, tentativas por nó de quiz e alertas de intervenção.'],
            ['Ranking Docente', '/professor/ranking', 'Reconhecimento institucional de engajamento docente na plataforma.']
          ]
        }
      },
      {
        id: 'visao-professor-vs-aluno',
        heading: '3. O que o Aluno Vê quando Você Publica?',
        paragraphs: [
          'Enquanto o professor trabalha em editores estruturados e matrizes de recomendação, o estudante vivencia uma cena imersiva de Tabuleiro Gamificado (Vila da Aventura, Flowchart ou Espacial).',
          'Cada passo que você adiciona no editor torna-se uma casa interativa no mapa do aluno, liberada progressivamente conforme ele lê o conteúdo, interage com os personagens da narrativa e supera os desafios avaliativos.'
        ]
      }
    ]
  },
  {
    id: 'doc-primeira-atividade-5-minutos',
    categorySlug: 'primeiros-passos',
    slug: 'primeira-atividade-5-minutos',
    title: 'Guia Rápido: Sua Primeira Missão em 5 Minutos',
    subtitle: 'Roteiro passo a passo do zero até o compartilhamento do código da turma com seus estudantes.',
    readingTimeMinutes: 5,
    diataxis: 'Tutorial',
    lastUpdated: 'v2.1',
    keywords: ['quickstart', '5 minutos', 'primeira atividade', 'passo a passo', 'tutorial rapido', 'iniciante'],
    relatedFaqIds: ['faq-fluxo-basico-professor', 'faq-codigo-turma-onde-fica', 'faq-autosave-rascunho'],
    actionLinks: [
      { label: 'Criar Nova Turma Agora', to: '/professor/turmas/nova', variant: 'secondary' },
      { label: 'Abrir Assistente de Criação', to: '/professor/criar-atividade', variant: 'primary' }
    ],
    sections: [
      {
        id: 'roteiro-5-passos',
        heading: '1. Sequência Recomendada para Primeira Aula',
        paragraphs: [
          'Se esta é sua primeira vez no portal, siga esta ordem enxuta para colocar uma trilha completa no ar em poucos minutos:'
        ],
        steps: [
          {
            title: 'Crie sua Turma Acadêmica',
            detail: 'Acesse "Gerenciar Turmas -> Nova Turma", informe o nome da disciplina (ex.: Engenharia de Software I - 2026) e copie o código alfanumérico gerado.'
          },
          {
            title: 'Inicie uma Atividade no Wizard (ou a partir de Template)',
            detail: 'Clique em "Criar Atividade". Defina título, área do conhecimento e os problemas reais observados na turma (ex.: baixa leitura prévia ou dificuldade em testes).'
          },
          {
            title: 'Consulte o Motor MDC e Selecione os Elementos',
            detail: 'Informe o perfil predominante da turma (Hexad) e aceite os elementos de jogo marcados em verde pelo Motor de Recomendação Contextual.'
          },
          {
            title: 'Monte a Trilha do Tabuleiro (Manual ou com IA)',
            detail: 'Combine pelo menos 1 nó de Narrativa (contexto), 1 nó de Conteúdo (teoria em Markdown/vídeo) e 1 nó de Quiz (fixação com feedback).'
          },
          {
            title: 'Publique e Atribua à Turma com Prazo',
            detail: 'Finalize a publicação, vá ao Banco de Atividades, clique em "Atribuir à Turma" e defina a janela de abertura e entrega.'
          }
        ]
      },
      {
        id: 'boas-praticas-primeira-trilha',
        heading: '2. Regra de Ouro Pedagógica na Estreia',
        paragraphs: [
          'Evite começar uma trilha diretamente com um Quiz avaliativo frio. Estudos de carga cognitiva (Sweller) demonstram que situar o estudante com uma breve Narrativa ou Material de Apoio antes da cobrança reduz a ansiedade e eleva a retenção conceitual.'
        ],
        callout: {
          type: 'warning',
          title: 'Atenção aos Rascunhos de IA',
          text: 'Caso utilize o gerador automático Gemini para criar passos rapidamente, lembre-se de clicar em cada passo gerado para revisar e validar o gabarito antes de avançar para a publicação.'
        }
      }
    ]
  },

  // =========================================================================
  // MÓDULO 2: AUTORIA NO WIZARD & EDITORES
  // =========================================================================
  {
    id: 'doc-guia-etapas-wizard',
    categorySlug: 'autoria-wizard',
    slug: 'guia-etapas-wizard',
    title: 'Dominando as Etapas do Wizard de Criação',
    subtitle: 'Referência completa sobre diagnóstico de contexto, objetivos SMART/Bloom, logística e validações de cada passo.',
    readingTimeMinutes: 7,
    diataxis: 'How-To Guide',
    lastUpdated: 'v2.1',
    keywords: ['wizard', 'passo a passo', 'analise preliminar', 'cenario desejado', 'logistica', 'individual', 'equipe', 'autosave'],
    relatedFaqIds: ['faq-autosave-rascunho', 'faq-erro-validacao-wizard', 'faq-individual-vs-equipe'],
    actionLinks: [
      { label: 'Iniciar Nova Atividade no Wizard', to: '/professor/criar-atividade', variant: 'primary' },
      { label: 'Ver Meus Rascunhos no Banco', to: '/professor/banco-atividades', variant: 'secondary' }
    ],
    sections: [
      {
        id: 'diagnostico-contexto',
        heading: '1. Análise Preliminar e Diagnóstico de Contexto',
        paragraphs: [
          'Na etapa inicial do Wizard, você registra o título, a área de conhecimento e os problemas concretos observados no cenário atual (Mora et al., 2015; Kapp, 2012).',
          'Esses metadados não são meramente burocráticos: eles alimentam tanto o cálculo de sinergia do Motor de Recomendação Contextual quanto o contexto semântico (grounding) enviado à Inteligência Artificial caso você opte por gerar rascunhos.'
        ],
        callout: {
          type: 'note',
          title: 'Auto-Save Contínuo Ativo',
          text: 'O hook de salvamento automático preserva o progresso do seu rascunho periodicamente. Você pode retomar qualquer atividade inacabada pelo Banco de Atividades.'
        }
      },
      {
        id: 'objetivos-smart-bloom',
        heading: '2. Cenário Desejado e Objetivos de Aprendizagem',
        paragraphs: [
          'Ao preencher o Cenário Desejado, articule verbos observáveis alinhados à Taxonomia de Bloom (ex.: Compreender, Aplicar, Analisar, Projetar) e competências técnicas reais (como áreas de conhecimento do SWEBOK no ensino de Computação).',
          'Quando o estudante percebe a instrumentalidade futura da tarefa — isto é, por que aquele desafio importa na vida profissional ou acadêmica — a motivação intrínseca cresce sustentavelmente.'
        ]
      },
      {
        id: 'logistica-individual-equipe',
        heading: '3. Planejamento Logístico: Individual vs. Equipe e Ambiente',
        paragraphs: [
          'O validador estrutural exige duas definições logísticas explícitas antes de liberar o desenho das mecânicas: a Dinâmica de Participação (Individual ou em Equipe) e o Ambiente de Aplicação (Laboratório Presencial, Online Assíncrono ou Desplugado/Híbrido).'
        ],
        table: {
          headers: ['Configuração Logística', 'Quando Escolher', 'Impacto nas Mecânicas'],
          rows: [
            ['Individual', 'Fixação conceitual, avaliação diagnóstica e autorregulação no ritmo do aluno.', 'Favorece trilhas de maestria progressiva, feedback imediato e conquistas pessoais.'],
            ['Em Equipe', 'Estudos de caso, revisão por pares, projetos ágeis e resolução colaborativa.', 'Potencializa missões cooperativas, fórum estruturado e senso de pertencimento social.'],
            ['Online / Laboratório', 'Acesso individualizado a dispositivos com internet.', 'Habilita vídeos embarcados, roleta interativa, chat síncrono e submissão em tempo real.']
          ]
        }
      }
    ]
  },
  {
    id: 'doc-editores-narrativa-conteudo-quiz',
    categorySlug: 'autoria-wizard',
    slug: 'editores-narrativa-conteudo-quiz',
    title: 'Editores de Passo: Narrativa, Markdown e Quiz Formativo',
    subtitle: 'Como construir nós ricos no tabuleiro com código destacado, vídeos do YouTube e feedbacks explicativos por alternativa.',
    readingTimeMinutes: 6,
    diataxis: 'How-To Guide',
    lastUpdated: 'v2.1',
    keywords: ['editor', 'quiz', 'narrativa', 'markdown', 'youtube', 'video', 'codigo', 'tabuleiro', 'nos'],
    relatedFaqIds: ['faq-youtube-formatos-aceitos', 'faq-markdown-blocos-codigo', 'faq-ordem-nos-tabuleiro'],
    actionLinks: [
      { label: 'Ir para o Banco de Atividades', to: '/professor/banco-atividades', variant: 'primary' }
    ],
    sections: [
      {
        id: 'anatomia-trilha-tabuleiro',
        heading: '1. Os 3 Tipos de Nós da Trilha de Progressão',
        paragraphs: [
          'O Editor do Tabuleiro permite encadear quantos passos forem necessários. Uma sequência altamente eficaz alterna contextualização, fundamentação e verificação ativa:'
        ],
        steps: [
          {
            title: 'Nó de Narrativa (Storytelling Imersivo)',
            detail: 'Cria diálogos entre Mentor/Instrutor e Estudante/Aprendiz com expressões de avatar e cenários temáticos. Ideal para apresentar um problema do mundo real.'
          },
          {
            title: 'Nó de Material Didático (Markdown & Multimídia)',
            detail: 'Suporta formatação Markdown completa com pré-visualização lado a lado, listas, citações, blocos de código com numeração de linhas e embed inteligente de vídeos do YouTube.'
          },
          {
            title: 'Nó de Quiz Avaliativo (Múltipla Escolha com Feedback)',
            detail: 'Permite até 5 alternativas por questão, justificativa pedagógica específica para acertos/erros e controle de tentativas.'
          }
        ]
      },
      {
        id: 'sintaxe-markdown-exemplos',
        heading: '2. Sintaxe Rápida de Markdown para Material Didático',
        paragraphs: [
          'No editor de Conteúdo, você pode escrever textos técnicos limpos exatamente como em repositórios Git ou Overleaf Markdown:'
        ],
        codeBlock: {
          language: 'markdown',
          code: `# Conceito: Inversão de Dependência (DIP)\n\nMódulos de alto nível **não devem depender** de módulos de baixo nível.\n\n\`\`\`python\nclass NotificadorPort:\n    def enviar(self, destinatario: str, msg: str) -> None:\n        raise NotImplementedError\n\`\`\`\n\n> **Dica Pedagógica:** Observe como a interface isola o domínio das bibliotecas externas.`
        },
        callout: {
          type: 'tip',
          title: 'Links do YouTube Inteligentes',
          text: 'Você pode colar links comuns (youtube.com/watch?v=...), links curtos (youtu.be/...), YouTube Shorts ou até o código <iframe> completo — o portal extrai o ID automaticamente com segurança.'
        }
      }
    ]
  },

  // =========================================================================
  // MÓDULO 3: MOTOR PEDAGÓGICO MDC & HEXAD
  // =========================================================================
  {
    id: 'doc-perfis-jogadores-hexad',
    categorySlug: 'motor-mdc-hexad',
    slug: 'perfis-jogadores-hexad',
    title: 'Perfis de Jogadores Gamification User Types Hexad',
    subtitle: 'Como mapear as motivações intrínsecas e extrínsecas da sua turma segundo o modelo científico de Marczewski / Tondello.',
    readingTimeMinutes: 6,
    diataxis: 'Explanation',
    lastUpdated: 'v2.1',
    keywords: ['hexad', 'marczewski', 'tondello', 'bartle', 'perfil jogador', 'achiever', 'philanthropist', 'socialiser', 'free spirit', 'player', 'disruptor'],
    relatedFaqIds: ['faq-nao-sei-perfil-hexad-turma', 'faq-diferenca-hexad-bartle'],
    actionLinks: [
      { label: 'Experimentar no Wizard', to: '/professor/criar-atividade', variant: 'primary' }
    ],
    sections: [
      {
        id: 'por-que-hexad',
        heading: '1. Por que Usamos a Escala Hexad em Educação?',
        paragraphs: [
          'Diferente da taxonomia clássica de Bartle (criada para jogos comerciais multiusuário MMORPG), a escala Hexad (Marczewski, 2015; Tondello et al., 2016) foi validada empiricamente para sistemas gamificados e educacionais, conectando-se diretamente aos 3 pilares da Teoria da Autodeterminação (Autonomia, Competência e Pertencimento).'
        ]
      },
      {
        id: 'tabela-6-perfis',
        heading: '2. Guia de Referência dos 6 Arquétipos Hexad',
        paragraphs: [
          'Use a tabela abaixo para estimar a composição da sua turma durante o Passo de Perfil do Jogador:'
        ],
        table: {
          headers: ['Arquétipo Hexad', 'Motivação Central', 'Mecânicas de Maior Sinergia no Portal'],
          rows: [
            ['Philanthropist (Filantropo)', 'Propósito e auxílio mútuo', 'Fórum de dúvidas moderado, mentoria em equipe e compartilhamento de conhecimento.'],
            ['Socialiser (Socializador)', 'Pertencimento e conexão social', 'Atividades em equipe, Chat da turma em tempo real e desafios cooperativos.'],
            ['Free Spirit (Espírito Livre)', 'Autonomia, exploração e criatividade', 'Narrativas ricas, escolha de avatares/cosméticos e nós opcionais de aprofundamento.'],
            ['Achiever (Realizador)', 'Competência, domínio e superação', 'Trilha de progressão em etapas, catálogo de 20 medalhas e níveis de maestria XP.'],
            ['Player (Jogador)', 'Recompensas extrínsecas tangíveis', 'Moedas de ouro por desempenho, Loja de Itens e Roleta Diária da Sorte.'],
            ['Disruptor (Disruptor)', 'Mudança positiva e teste de limites', 'Desafios complexos de pensamento crítico, inovação e feedback direto.' ]
          ]
        },
        callout: {
          type: 'note',
          title: 'E se minha turma for heterogênea?',
          text: 'Nenhuma turma real possui um único perfil puro! Selecione uma combinação equilibrada (ex.: Achiever + Socialiser + Player) para que o Motor MDC sugira um mix inclusivo de mecânicas.'
        }
      }
    ]
  },
  {
    id: 'doc-vetos-pedagogicos-dark-side',
    categorySlug: 'motor-mdc-hexad',
    slug: 'vetos-pedagogicos-dark-side',
    title: 'Motor MDC/MUI e Prevenção do Dark Side da Gamificação',
    subtitle: 'Como o algoritmo calcula sinergias e por que certas combinações competitivas recebem alerta ou veto pedagógico.',
    readingTimeMinutes: 7,
    diataxis: 'Explanation',
    lastUpdated: 'v2.1',
    keywords: ['mdc', 'mui', 'mrc', 'veto', 'dark side', 'ranking', 'competicao', 'ansiedade', 'recomendacao', 'elementos de jogos'],
    relatedFaqIds: ['faq-por-que-elemento-bloqueado-mdc', 'faq-ranking-anonimizado-lgpd'],
    actionLinks: [
      { label: 'Criar Atividade com Apoio MDC', to: '/professor/criar-atividade', variant: 'primary' }
    ],
    sections: [
      {
        id: 'o-que-e-dark-side',
        heading: '1. O Que é o "Dark Side" (Lado Sombrio) da Gamificação?',
        paragraphs: [
          'A literatura científica (Toda et al., 2018; Deterding; Hamari) alerta que aplicar pontos, cronômetros agressivos e rankings de exposição pública sem alinhamento contextual pode gerar efeitos colaterais severos: desmotivação dos alunos com defasagem inicial, ansiedade avaliativa, competição predatória e substituição do prazer de aprender pela caça mecânica a pontos (efeito de sobrejustificação).',
          'O Motor de Recomendação Contextual (MDC/MUI) do GamificaEdu atua como um copiloto científico que cruza seus objetivos educacionais e perfis Hexad contra evidências empíricas.'
        ]
      },
      {
        id: 'interpretando-clusters-mdc',
        heading: '2. Como Interpretar as 3 Faixas de Recomendação',
        paragraphs: [
          'Na etapa de Seleção de Elementos de Jogos, o sistema classifica cada mecânica em tempo real:'
        ],
        steps: [
          {
            title: 'Recomendados (Alta Sinergia — Verde)',
            detail: 'Elementos que reforçam diretamente os objetivos pedagógicos e os perfis Hexad informados, maximizando engajamento saudável.'
          },
          {
            title: 'Neutros / Complementares (Amarelo/Cinza)',
            detail: 'Podem ser adicionados com moderação para estética ou variedade, desde que não sobrecarreguem cognitivamente a atividade.'
          },
          {
            title: 'Não Recomendados / Alerta de Risco (Vermelho / Veto RN-03)',
            detail: 'Combinações com risco comprovado de frustração no contexto escolhido (ex.: pressão competitiva extrema em atividade introdutória cooperativa). Caso o índice de risco ultrapasse o limiar seguro (RN-03), o sistema exige ajuste antes da publicação.'
          }
        ],
        callout: {
          type: 'important',
          title: 'Dupla Perspectiva de Elementos (US-24)',
          text: 'Cada elemento selecionado reflete simultaneamente o esforço de configuração do professor na autoria e a mecânica vivenciada pelo estudante no tabuleiro.'
        }
      }
    ]
  },

  // =========================================================================
  // MÓDULO 4: ORQUESTRAÇÃO COM IA GENERATIVA GEMINI
  // =========================================================================
  {
    id: 'doc-orquestracao-rascunhos-ia',
    categorySlug: 'orquestracao-ia',
    slug: 'orquestracao-rascunhos-ia',
    title: 'Geração Assistida de Atividades com IA Google Gemini',
    subtitle: 'Boas práticas de engenharia de prompt docente, resiliência multi-modelo e protocolo obrigatório de revisão humana.',
    readingTimeMinutes: 6,
    diataxis: 'How-To Guide',
    lastUpdated: 'v2.1',
    keywords: ['ia', 'inteligencia artificial', 'gemini', 'rascunho', 'prompt', 'alucinacao', 'isdraft', 'fallback'],
    relatedFaqIds: ['faq-ia-bloqueio-rascunho-nao-validado', 'faq-ia-demora-ou-cota-excedida', 'faq-chave-api-propria'],
    actionLinks: [
      { label: 'Testar Orquestrador IA no Wizard', to: '/professor/criar-atividade', variant: 'primary' },
      { label: 'Configurar Preferências no Perfil', to: '/perfil', variant: 'secondary' }
    ],
    sections: [
      {
        id: 'como-funciona-pipeline-ia',
        heading: '1. Como o Roteirista e Avaliador Virtual Funciona',
        paragraphs: [
          'No Wizard de criação, você pode acionar a Inteligência Artificial para transformar seu tema, público-alvo e objetivos em uma trilha estruturada contendo diálogos narrativos contextualizados, textos base em Markdown e questões de múltipla escolha com justificativas de gabarito.',
          'Sob o capô (ADR-021 / RNF-06), a plataforma utiliza uma cascata resiliente de modelos Google Gemini com timeout controlado de 45 segundos e fallback automático em caso de pico de demanda.'
        ]
      },
      {
        id: 'protocolo-human-in-the-loop',
        heading: '2. Revisão Docente Obrigatória (Human-in-the-Loop)',
        paragraphs: [
          'Por rigor acadêmico e segurança pedagógica, nenhuma questão ou texto gerado por IA vai diretamente para os alunos sem curadoria do professor:',
          'Todo nó recém-gerado nasce marcado com a flag interna de rascunho automático (isDraft: true). O validador da Etapa do Tabuleiro bloqueia o avanço até que você abra cada passo gerado, confira a precisão conceitual e salve sua aprovação.'
        ],
        callout: {
          type: 'warning',
          title: 'Por que o botão "Próximo" bloqueou após gerar com IA?',
          text: 'Verifique os cards da trilha que exibem o selo "Rascunho IA Pendente". Basta clicar em Editar no respectivo nó, revisar o conteúdo/gabarito e clicar em Salvar para converter em passo homologado pelo professor.'
        }
      },
      {
        id: 'dicas-prompts-pedagogicos',
        heading: '3. Como Obter Resultados Superiores da IA',
        paragraphs: [
          'Especifique claramente no diagnóstico da atividade: (1) o nível de maturidade da turma (ex.: 3º período de Ciência da Computação vs. Ensino Médio Técnico), (2) um estudo de caso concreto (ex.: sistema hospitalar, e-commerce) e (3) os erros conceituais mais comuns dos alunos para que a IA crie distratores inteligentes nos quizzes.'
        ]
      }
    ]
  },

  // =========================================================================
  // MÓDULO 5: ECONOMIA DUPLA, TABULEIRO & MEDALHAS
  // =========================================================================
  {
    id: 'doc-xp-vitalicio-vs-moedas',
    categorySlug: 'economia-tabuleiro',
    slug: 'xp-vitalicio-vs-moedas',
    title: 'Economia Dupla: XP Vitalício vs. Moedas de Ouro (ADR-004)',
    subtitle: 'Entenda a separação matemática entre progresso acadêmico imutável e moeda virtual gastável na Loja e Roleta.',
    readingTimeMinutes: 5,
    diataxis: 'Explanation',
    lastUpdated: 'v2.1',
    keywords: ['xp', 'moedas', 'coins', 'economia', 'loja', 'roleta', 'nivel', 'cosmeticos', 'adr-004'],
    relatedFaqIds: ['faq-xp-diminui-ao-comprar-loja', 'faq-como-aluno-ganha-moedas', 'faq-roleta-diaria-cooldown'],
    actionLinks: [
      { label: 'Ver Desempenho e XP das Turmas', to: '/professor/desempenho-alunos', variant: 'primary' }
    ],
    sections: [
      {
        id: 'separacao-estrita-economia',
        heading: '1. Por que Separamos XP e Moedas?',
        paragraphs: [
          'Em plataformas antigas onde o aluno gastava seus próprios pontos de ranking para comprar itens na loja, ocorria uma distorção grave: os estudantes mais engajados caíam no placar acadêmico ao personalizar seu avatar!',
          'Por isso, o GamificaEdu implementa estritamente a Economia Dupla (RN-01 e RN-02 / ADR-004):'
        ],
        table: {
          headers: ['Atributo Econômico', 'Natureza no Sistema', 'Regras Invariantes de Domínio'],
          rows: [
            ['XP Vitalício (Experiência)', 'Indicador cumulativo de maturidade e estudo', 'Nunca diminui (RN-01). Define o Nível do estudante e sua posição nos relatórios de progresso.'],
            ['Moedas de Ouro (Coins)', 'Moeda transacional de engajamento lúdico', 'Ganha ao acertar quizzes (ADR-019) e na Roleta Diária. Gastável na Loja de Cosméticos; saldo jamais fica negativo (RN-02).']
          ]
        }
      },
      {
        id: 'loja-e-roleta-diaria',
        heading: '2. Loja de Cosméticos e Roleta Diária (24h)',
        paragraphs: [
          'Os itens vendidos na Loja (avatares temáticos, molduras, títulos honoríficos e efeitos visuais) são puramente cosméticos (ADR-023): eles valorizam a identidade e autonomia do aluno sem conceder vantagens injustas em notas acadêmicas ("pay-to-win" inexistente).',
          'Já a Roleta Diária da Sorte oferece um giro gratuito a cada janela determinística de 24 horas (RN-04), incentivando o hábito de retorno regular ao ambiente de estudo.'
        ]
      }
    ]
  },
  {
    id: 'doc-criterios-conclusao-e-medalhas',
    categorySlug: 'economia-tabuleiro',
    slug: 'criterios-conclusao-e-medalhas',
    title: 'Critérios de Conclusão, Ações Recompensadas e 20 Medalhas',
    subtitle: 'Como funcionam nós obrigatórios vs. opcionais, tentativas em quizzes e o desbloqueio automático de conquistas.',
    readingTimeMinutes: 5,
    diataxis: 'Explanation',
    lastUpdated: 'v2.1',
    keywords: ['conclusao', 'medalhas', 'conquistas', 'badges', 'tentativas', 'acoes recompensadas', 'obrigatorio', 'opcional'],
    relatedFaqIds: ['faq-aluno-travado-no-tabuleiro', 'faq-como-funcionam-medalhas'],
    actionLinks: [
      { label: 'Gerenciar Banco de Atividades', to: '/professor/banco-atividades', variant: 'primary' }
    ],
    sections: [
      {
        id: 'nos-obrigatorios-opcionais',
        heading: '1. Progressão no Tabuleiro e Critério Flexível (ADR-018)',
        paragraphs: [
          'O estudante avança pela trilha cumprindo os nós sequenciais. Ao configurar ações recompensadas, privilegie o aprendizado por tentativa e erro formativo: acertar na primeira tentativa concede bônus máximo, mas permitir novas tentativas com feedback imediato evita evasão nos alunos com maior dificuldade inicial.'
        ],
        callout: {
          type: 'tip',
          title: 'Feedback Imediato > Punição Severa',
          text: 'Conforme Dicheva et al. (2015), o erro seguro acompanhado de explicação imediata é um dos preditores mais fortes de retenção em ambientes gamificados.'
        }
      },
      {
        id: 'catalogo-medalhas-automaticas',
        heading: '2. Concessão Automática de Medalhas (RF-10)',
        paragraphs: [
          'Você não precisa distribuir medalhas manualmente aluno por aluno: o motor de conquistas (MedalService) monitora automaticamente marcos acadêmicos — como primeira trilha concluída, precisão elevada em quizzes, assiduidade e participação construtiva — creditando as insígnias em tempo real na vitrine do estudante.'
        ]
      }
    ]
  },

  // =========================================================================
  // MÓDULO 6: TURMAS, PRAZOS, COMUNICAÇÃO & ANALYTICS LGPD
  // =========================================================================
  {
    id: 'doc-prazos-agendamento-e-fair-play',
    categorySlug: 'turmas-avaliacao',
    slug: 'prazos-agendamento-e-fair-play',
    title: 'Gestão de Turmas, Códigos de Matrícula, Prazos e Fair Play',
    subtitle: 'Como matricular estudantes por código, agendar janelas de entrega e aplicar bloqueio automático pós-prazo.',
    readingTimeMinutes: 6,
    diataxis: 'Reference',
    lastUpdated: 'v2.1',
    keywords: ['turma', 'codigo', 'matricula', 'prazo', 'agendamento', 'bloqueio', 'regras', 'fair play', 'atribuir'],
    relatedFaqIds: ['faq-codigo-turma-onde-fica', 'faq-prorrogar-prazo-atividade', 'faq-remover-aluno-turma'],
    actionLinks: [
      { label: 'Abrir Gerenciamento de Turmas', to: '/professor/gerenciar-turmas', variant: 'primary' },
      { label: 'Ver Banco para Atribuir Missão', to: '/professor/banco-atividades', variant: 'secondary' }
    ],
    sections: [
      {
        id: 'fluxo-matricula-codigo',
        heading: '1. Código Único de Ingresso e Gestão de Matriculados',
        paragraphs: [
          'Cada turma criada gera automaticamente um identificador único de matrícula. Basta projetar o código em sala ou enviá-lo no AVA institucional (Moodle, Google Classroom, SIGAA): o estudante logado acessa "Entrar em Turma", digita o código e fica imediatamente vinculado.',
          'Em Detalhes da Turma, você pode acompanhar a lista nominal de inscritos e remover matrículas indevidas a qualquer momento.'
        ]
      },
      {
        id: 'agendamento-bloqueio-pos-prazo',
        heading: '2. Agendamento Temporal e Bloqueio Pós-Prazo (RF-06)',
        paragraphs: [
          'Ao vincular uma atividade a uma turma ("Atribuir à Turma"), você controla a data/hora de abertura e o prazo limite de encerramento validados pelo relógio UTC do servidor.',
          'Encerrado o prazo, novas submissões avaliativas são bloqueadas automaticamente para preservar a isonomia (Fair Play) entre os estudantes. Caso precise conceder segunda chamada ou estender o calendário da turma, basta editar o agendamento da atribuição.'
        ]
      },
      {
        id: 'forum-vs-chat-turma',
        heading: '3. Comunicação Pedagógica: Fórum Assíncrono vs. Chat em Tempo Real',
        paragraphs: [
          'Seguindo a ADR-014, o portal separa dois canais complementares de interação social:'
        ],
        table: {
          headers: ['Canal Social', 'Dinâmica Temporal', 'Melhor Uso Docente'],
          rows: [
            ['Fórum da Atividade', 'Assíncrono e categorizado por tópicos', 'Dúvidas conceituais profundas, debates estruturados e respostas que ficam salvas para consulta de toda a turma.'],
            ['Chat da Turma (WebSocket)', 'Síncrono em tempo real isolado por sala', 'Avisos rápidos durante aulas de laboratório, engajamento imediato e coordenação de dinâmicas ao vivo.']
          ]
        }
      }
    ]
  },
  {
    id: 'doc-relatorios-analytics-e-lgpd',
    categorySlug: 'turmas-avaliacao',
    slug: 'relatorios-analytics-e-lgpd',
    title: 'Painel de Desempenho Docente, Intervenção e Conformidade LGPD',
    subtitle: 'Como ler indicadores de tentativas em quizzes, identificar alunos em risco e garantir privacidade nos rankings.',
    readingTimeMinutes: 6,
    diataxis: 'Reference',
    lastUpdated: 'v2.1',
    keywords: ['relatorios', 'desempenho', 'analytics', 'lgpd', 'anonimizacao', 'privacidade', 'intervencao', 'notas'],
    relatedFaqIds: ['faq-ranking-anonimizado-lgpd', 'faq-ver-quem-esta-com-dificuldade', 'faq-isolamento-dados-entre-professores'],
    actionLinks: [
      { label: 'Abrir Desempenho dos Alunos', to: '/professor/desempenho-alunos', variant: 'primary' }
    ],
    sections: [
      {
        id: 'leitura-painel-analitico',
        heading: '1. Identificando Gargalos de Aprendizagem com Dados',
        paragraphs: [
          'Na página Desempenho dos Alunos (/professor/desempenho-alunos), filtre por turma e atividade para visualizar acurácia, status de conclusão, pontuação conquistada e número de tentativas realizadas nos questionários.',
          'Quando vários alunos acumulam mais de 2 ou 3 tentativas em um mesmo nó do tabuleiro, isso sinaliza um ponto exato do conteúdo que merece revisão expositiva no início da próxima aula.'
        ]
      },
      {
        id: 'privacidade-lgpd-isolamento',
        heading: '2. Privacidade Estudantil (LGPD) e Isolamento Docente',
        paragraphs: [
          'O GamificaEdu aplica controles rigorosos de segurança e proteção de dados pessoais desde a concepção (Privacy by Design):',
          '1. Isolamento Estrito Anti-IDOR: Cada professor visualiza exclusivamente os dados analíticos das turmas sob sua própria titularidade.',
          '2. Anonimização em Rankings Competitivos (RN-05 / RNF-07): Para evitar constrangimento público de estudantes nas posições inferiores e proteger menores de idade, rankings competitivos utilizam mascaramento determinístico (ex.: Aluno #1482), enquanto somente o professor titular enxerga a identificação pedagógica completa em seu relatório privado.'
        ],
        callout: {
          type: 'important',
          title: 'Ética em Pesquisa Científica (DSR)',
          text: 'Toda coleta demográfica e telemetria de eventos respeita o consentimento informado e a minimização de dados exigida pela Lei Geral de Proteção de Dados (Lei nº 13.709/2018).'
        }
      }
    ]
  }
]);

export const TEACHER_DOCS_FAQS = Object.freeze([
  // --- PRIMEIROS PASSOS & FLUXO GERAL ---
  {
    id: 'faq-fluxo-basico-professor',
    categorySlug: 'primeiros-passos',
    badge: 'Fluxo Inicial',
    question: 'Qual é a ordem correta para aplicar uma atividade aos meus alunos?',
    answer: 'O fluxo ideal tem 3 etapas rápidas: (1) Crie uma Turma em "Gerenciar Turmas" e compartilhe o código de ingresso com os alunos; (2) Elabore e publique sua missão em "Criar Atividade"; (3) No "Banco de Atividades", clique em "Atribuir à Turma" para definir prazo de abertura e encerramento.',
    relatedArticleSlug: 'primeiros-passos/primeira-atividade-5-minutos'
  },
  {
    id: 'faq-diferenca-rascunho-publicada',
    categorySlug: 'primeiros-passos',
    badge: 'Ciclo de Vida',
    question: 'Os alunos conseguem ver atividades salvas como Rascunho?',
    answer: 'Não. Atividades em modo Rascunho ficam visíveis apenas para você no seu Banco de Atividades pessoal. Os estudantes só enxergam uma missão depois que ela é Publicada e explicitamente Atribuída à turma em que estão matriculados.',
    relatedArticleSlug: 'primeiros-passos/visao-geral-ecossistema'
  },
  {
    id: 'faq-aluno-precisa-pagar',
    categorySlug: 'primeiros-passos',
    badge: 'Acesso',
    question: 'Meus alunos precisam instalar algum aplicativo ou pagar para usar?',
    answer: 'Não! O GamificaEdu roda 100% no navegador web (computadores, tablets ou celulares responsivos) e é totalmente gratuito para fins educacionais e acadêmicos.',
    relatedArticleSlug: 'primeiros-passos/visao-geral-ecossistema'
  },
  {
    id: 'faq-reutilizar-atividade-varias-turmas',
    categorySlug: 'primeiros-passos',
    badge: 'Reuso',
    question: 'Posso usar a mesma atividade em duas ou mais turmas diferentes?',
    answer: 'Sim! Graças ao Modelo Mestre (ADR-017), você cria a atividade uma única vez no Banco de Atividades e pode atribuí-la para quantas turmas quiser, configurando datas limite independentes para cada turma.',
    relatedArticleSlug: 'primeiros-passos/visao-geral-ecossistema'
  },

  // --- AUTORIA NO WIZARD & EDITORES ---
  {
    id: 'faq-autosave-rascunho',
    categorySlug: 'autoria-wizard',
    badge: 'Auto-Save',
    question: 'Se a internet cair durante a criação no Wizard, perco tudo o que digitei?',
    answer: 'O assistente conta com salvamento automático de rascunho (useAutoSave) e indicador de status de conexão no topo da tela. Assim que uma atividade inicial é criada, seu progresso é sincronizado para que você possa retomá-la no Banco de Atividades.',
    relatedArticleSlug: 'autoria-wizard/guia-etapas-wizard'
  },
  {
    id: 'faq-erro-validacao-wizard',
    categorySlug: 'autoria-wizard',
    badge: 'Validação',
    question: 'Por que o Wizard não me deixa avançar para a próxima etapa?',
    answer: 'Cada etapa possui pré-requisitos pedagógicos mínimos validados automaticamente: na Etapa 1 são exigidos Título, Área e ao menos 1 desafio atual; na Etapa 3, Dinâmica (Individual/Equipe) e Ambiente; na Etapa 6, ao menos 1 passo no tabuleiro sem rascunhos de IA pendentes de revisão.',
    relatedArticleSlug: 'autoria-wizard/guia-etapas-wizard'
  },
  {
    id: 'faq-individual-vs-equipe',
    categorySlug: 'autoria-wizard',
    badge: 'Logística',
    question: 'Qual a diferença prática entre marcar a atividade como Individual ou em Equipe?',
    answer: 'Essa escolha orienta o Motor de Recomendação Contextual (MDC): atividades individuais priorizam mecânicas de autorregulação e progresso pessoal, enquanto atividades em equipe elevam a recomendação de dinâmicas cooperativas, interação social e avaliação conjunta.',
    relatedArticleSlug: 'autoria-wizard/guia-etapas-wizard'
  },
  {
    id: 'faq-youtube-formatos-aceitos',
    categorySlug: 'autoria-wizard',
    badge: 'Multimídia',
    question: 'Quais formatos de link de vídeo funcionam no Editor de Material Didático?',
    answer: 'O extrator inteligente aceita URLs padrão do YouTube (watch?v=...), links encurtados (youtu.be/...), vídeos Shorts e até códigos <iframe> copiados do botão Incorporar, convertendo tudo automaticamente para o player responsivo seguro.',
    relatedArticleSlug: 'autoria-wizard/editores-narrativa-conteudo-quiz'
  },
  {
    id: 'faq-markdown-blocos-codigo',
    categorySlug: 'autoria-wizard',
    badge: 'Markdown',
    question: 'Como exibir código-fonte formatado (Python, Java, SQL, JS) nos conteúdos?',
    answer: 'No Editor de Conteúdo, envolva seu código com três crases seguidas do nome da linguagem (ex.: ```python ... ```). O portal renderizará automaticamente destaque de sintaxe colorido para facilitar a leitura técnica pelos estudantes.',
    relatedArticleSlug: 'autoria-wizard/editores-narrativa-conteudo-quiz'
  },
  {
    id: 'faq-ordem-nos-tabuleiro',
    categorySlug: 'autoria-wizard',
    badge: 'Tabuleiro',
    question: 'Qual é a melhor sequência de passos para montar no Tabuleiro?',
    answer: 'Recomendamos a tríade Contexto -> Estudo -> Prática: inicie com um nó de Narrativa situando um desafio real, adicione um nó de Material Didático com a teoria/exemplos e feche o ciclo com um nó de Quiz contendo feedback explicativo em cada alternativa.',
    relatedArticleSlug: 'autoria-wizard/editores-narrativa-conteudo-quiz'
  },

  // --- MOTOR PEDAGÓGICO MDC & HEXAD ---
  {
    id: 'faq-nao-sei-perfil-hexad-turma',
    categorySlug: 'motor-mdc-hexad',
    badge: 'Hexad',
    question: 'Ainda não conheço bem a turma no início do semestre. Qual perfil Hexad devo marcar?',
    answer: 'Para turmas novas ou heterogêneas, combine "Achiever (Realizador)" + "Socialiser (Socializador)" + "Free Spirit (Espírito Livre)". Essa tríade equilibra desafios de domínio, colaboração saudável e autonomia sem introduzir competição excessiva.',
    relatedArticleSlug: 'motor-mdc-hexad/perfis-jogadores-hexad'
  },
  {
    id: 'faq-diferenca-hexad-bartle',
    categorySlug: 'motor-mdc-hexad',
    badge: 'Fundamentação',
    question: 'Por que o portal prioriza os perfis Hexad em vez dos 4 tipos clássicos de Bartle?',
    answer: 'O modelo de Bartle foi concebido para mundos virtuais de entretenimento (MMORPGs), enquanto a escala Hexad (Marczewski/Tondello) foi especificamente desenvolvida e validada para gamificação aplicada à educação, mapeando motivações intrínsecas da Teoria da Autodeterminação.',
    relatedArticleSlug: 'motor-mdc-hexad/perfis-jogadores-hexad'
  },
  {
    id: 'faq-por-que-elemento-bloqueado-mdc',
    categorySlug: 'motor-mdc-hexad',
    badge: 'Veto MDC',
    question: 'Por que o sistema emitiu um alerta vermelho ou veto ao escolher certos elementos de jogo?',
    answer: 'Trata-se da proteção científica contra o "Dark Side" da gamificação (RN-03). Certas mecânicas (como pressão temporal severa ou exposição competitiva em tarefas cooperativas/introdutórias) geram ansiedade e queda de desempenho. Ajuste os elementos para a faixa Recomendada.',
    relatedArticleSlug: 'motor-mdc-hexad/vetos-pedagogicos-dark-side'
  },

  // --- INTELIGÊNCIA ARTIFICIAL GEMINI ---
  {
    id: 'faq-ia-bloqueio-rascunho-nao-validado',
    categorySlug: 'orquestracao-ia',
    badge: 'Revisão IA',
    question: 'Gerei os passos com a IA Gemini, mas o sistema bloqueia o avanço dizendo que há rascunhos não validados. Como resolver?',
    answer: 'Por segurança pedagógica (Human-in-the-Loop), todo passo criado pela IA exige validação do professor. Clique para abrir/editar cada nó marcado como rascunho no tabuleiro, revise o texto ou gabarito das questões e salve para homologá-lo.',
    relatedArticleSlug: 'orquestracao-ia/orquestracao-rascunhos-ia'
  },
  {
    id: 'faq-ia-demora-ou-cota-excedida',
    categorySlug: 'orquestracao-ia',
    badge: 'Resiliência IA',
    question: 'O que acontece se a API da IA demorar ou atingir limite de requisições?',
    answer: 'O backend opera com Circuit Breaker e cascata multi-modelo automática (gemini-flash-lite -> flash -> pro) com timeout máximo de 45 segundos (ADR-021). Se todos os modelos estiverem temporariamente indisponíveis, você recebe um aviso limpo e pode criar ou editar os passos manualmente sem perder nada.',
    relatedArticleSlug: 'orquestracao-ia/orquestracao-rascunhos-ia'
  },
  {
    id: 'faq-chave-api-propria',
    categorySlug: 'orquestracao-ia',
    badge: 'Configuração',
    question: 'Posso configurar minha própria chave de API de IA no meu perfil?',
    answer: 'Sim. Em "Minhas Configurações" (/perfil), professores pesquisadores podem gerenciar chaves próprias caso realizem uso intensivo de geração em lote, mantendo armazenamento protegido no servidor.',
    relatedArticleSlug: 'orquestracao-ia/orquestracao-rascunhos-ia'
  },

  // --- ECONOMIA DUPLA, TABULEIRO & MEDALHAS ---
  {
    id: 'faq-xp-diminui-ao-comprar-loja',
    categorySlug: 'economia-tabuleiro',
    badge: 'Economia',
    question: 'Quando o aluno compra avatares na Loja ou gira a Roleta, ele perde XP ou cai de nível?',
    answer: 'Jamais! Pela Regra de Negócio RN-01 (ADR-004), o XP é vitalício e mede exclusivamente a evolução acadêmica. As compras utilizam apenas Moedas de Ouro (Coins), preservando 100% do nível e histórico do estudante.',
    relatedArticleSlug: 'economia-tabuleiro/xp-vitalicio-vs-moedas'
  },
  {
    id: 'faq-como-aluno-ganha-moedas',
    categorySlug: 'economia-tabuleiro',
    badge: 'Moedas',
    question: 'Como os estudantes acumulam Moedas de Ouro na plataforma?',
    answer: 'Principalmente pelo desempenho acadêmico nos quizzes das trilhas (ADR-019), conclusão de desafios do tabuleiro e participação na Roleta Diária gratuita.',
    relatedArticleSlug: 'economia-tabuleiro/xp-vitalicio-vs-moedas'
  },
  {
    id: 'faq-roleta-diaria-cooldown',
    categorySlug: 'economia-tabuleiro',
    badge: 'Roleta 24h',
    question: 'Quantas vezes o aluno pode girar a Roleta da Sorte?',
    answer: 'O sistema aplica um cooldown determinístico no servidor de 1 giro gratuito a cada período de 24 horas por estudante (RN-04), evitando abuso ou distração durante a aula.',
    relatedArticleSlug: 'economia-tabuleiro/xp-vitalicio-vs-moedas'
  },
  {
    id: 'faq-aluno-travado-no-tabuleiro',
    categorySlug: 'economia-tabuleiro',
    badge: 'Suporte Aluno',
    question: 'Um aluno relatou que a próxima casa do tabuleiro está com cadeado. Por quê?',
    answer: 'Existem dois motivos normais: (1) ele ainda não concluiu o nó imediatamente anterior na trilha sequencial, ou (2) o prazo final da atividade atribuída à turma já se encerrou.',
    relatedArticleSlug: 'economia-tabuleiro/criterios-conclusao-e-medalhas'
  },
  {
    id: 'faq-como-funcionam-medalhas',
    categorySlug: 'economia-tabuleiro',
    badge: 'Conquistas',
    question: 'Preciso entregar medalhas manualmente aos alunos que se destacam?',
    answer: 'Não é necessário. O catálogo oficial de 20 medalhas possui gatilhos automáticos avaliados pelo backend conforme o aluno atinge marcos de estudo, precisão e constância.',
    relatedArticleSlug: 'economia-tabuleiro/criterios-conclusao-e-medalhas'
  },

  // --- TURMAS, PRAZOS & ANALYTICS LGPD ---
  {
    id: 'faq-codigo-turma-onde-fica',
    categorySlug: 'turmas-avaliacao',
    badge: 'Matrícula',
    question: 'Onde encontro o código da turma para passar aos estudantes?',
    answer: 'Acesse "Professor -> Gerenciar Turmas". Cada card de turma exibe o código alfanumérico de matrícula com botão rápido de cópia e opção de compartilhamento.',
    relatedArticleSlug: 'turmas-avaliacao/prazos-agendamento-e-fair-play'
  },
  {
    id: 'faq-prorrogar-prazo-atividade',
    categorySlug: 'turmas-avaliacao',
    badge: 'Prazos',
    question: 'O prazo da atividade venceu e quero reabrir para a turma. Os alunos perdem o que já fizeram?',
    answer: 'Não perdem nada! Todo o progresso por passo fica salvo na tabela ActivityProgress. Ao atualizar a data limite da atribuição para uma data futura, os estudantes retomam exatamente do nó em que pararam.',
    relatedArticleSlug: 'turmas-avaliacao/prazos-agendamento-e-fair-play'
  },
  {
    id: 'faq-remover-aluno-turma',
    categorySlug: 'turmas-avaliacao',
    badge: 'Gestão Turma',
    question: 'Um aluno de outra disciplina entrou na minha turma por engano. Posso removê-lo?',
    answer: 'Sim. Entre em "Gerenciar Turmas", clique para abrir os detalhes da turma desejada e utilize a ação de remoção de matrícula ao lado do nome do estudante.',
    relatedArticleSlug: 'turmas-avaliacao/prazos-agendamento-e-fair-play'
  },
  {
    id: 'faq-ranking-anonimizado-lgpd',
    categorySlug: 'turmas-avaliacao',
    badge: 'LGPD',
    question: 'Por que alguns nomes aparecem mascarados como "Aluno #XXXX" no ranking competitivo?',
    answer: 'Para atender à LGPD (RNF-07 / RN-05) e proteger estudantes contra exposição pública indesejada. Na área privada "Desempenho dos Alunos", você (professor titular da turma) visualiza os nomes reais completos para fins avaliativos.',
    relatedArticleSlug: 'turmas-avaliacao/relatorios-analytics-e-lgpd'
  },
  {
    id: 'faq-ver-quem-esta-com-dificuldade',
    categorySlug: 'turmas-avaliacao',
    badge: 'Analytics',
    question: 'Como identificar rapidamente quais alunos precisam de reforço pedagógico?',
    answer: 'Consulte o card de "Atenção Pedagógica" no Painel do Professor e acesse "Desempenho Alunos" (/professor/desempenho-alunos). Ordene ou filtre pelas colunas de acurácia e número de tentativas para localizar quem enfrentou dificuldades nos quizzes.',
    relatedArticleSlug: 'turmas-avaliacao/relatorios-analytics-e-lgpd'
  },
  {
    id: 'faq-isolamento-dados-entre-professores',
    categorySlug: 'turmas-avaliacao',
    badge: 'Segurança',
    question: 'Outros professores da plataforma conseguem ver as notas ou e-mails dos meus alunos?',
    answer: 'Não. O backend aplica verificação estrita de propriedade em todas as rotas de turmas e relatórios (proteção anti-BOLA/IDOR), garantindo que apenas o professor responsável pela turma acesse os dados nominais de seus estudantes.',
    relatedArticleSlug: 'turmas-avaliacao/relatorios-analytics-e-lgpd'
  }
]);

/**
 * Mapa bidirecional conectando cada chave de ajuda contextual do Wizard (helpContent.jsx)
 * ao capítulo correspondente na Central de Documentação Docente estilo Overleaf Learn.
 */
export const WIZARD_HELP_TO_DOCS_MAP = Object.freeze({
  analise_preliminar: {
    categorySlug: 'autoria-wizard',
    articleSlug: 'guia-etapas-wizard',
    sectionAnchor: 'diagnostico-contexto',
    label: 'Análise Preliminar e Diagnóstico de Contexto'
  },
  cenario_desejado: {
    categorySlug: 'autoria-wizard',
    articleSlug: 'guia-etapas-wizard',
    sectionAnchor: 'objetivos-smart-bloom',
    label: 'Objetivos Pedagógicos e Taxonomia de Bloom'
  },
  planejamento_atividade: {
    categorySlug: 'autoria-wizard',
    articleSlug: 'guia-etapas-wizard',
    sectionAnchor: 'logistica-individual-equipe',
    label: 'Logística Individual vs. Equipe e Ambientes'
  },
  perfil_jogador: {
    categorySlug: 'motor-mdc-hexad',
    articleSlug: 'perfis-jogadores-hexad',
    sectionAnchor: 'tabela-6-perfis',
    label: 'Guia Completo dos 6 Perfis Hexad'
  },
  elementos_jogos: {
    categorySlug: 'motor-mdc-hexad',
    articleSlug: 'vetos-pedagogicos-dark-side',
    sectionAnchor: 'interpretando-clusters-mdc',
    label: 'Motor MDC e Prevenção do Dark Side'
  },
  tabuleiro_progressao: {
    categorySlug: 'autoria-wizard',
    articleSlug: 'editores-narrativa-conteudo-quiz',
    sectionAnchor: 'anatomia-trilha-tabuleiro',
    label: 'Construção da Trilha: Narrativa, Markdown e Quiz'
  },
  recompensas_oferecidas: {
    categorySlug: 'economia-tabuleiro',
    articleSlug: 'xp-vitalicio-vs-moedas',
    sectionAnchor: 'separacao-estrita-economia',
    label: 'Economia Dupla: XP Vitalício vs. Moedas'
  },
  acoes_recompensadas: {
    categorySlug: 'economia-tabuleiro',
    articleSlug: 'criterios-conclusao-e-medalhas',
    sectionAnchor: 'nos-obrigatorios-opcionais',
    label: 'Ações Recompensadas, Tentativas e Medalhas'
  },
  regras_gamificacao: {
    categorySlug: 'turmas-avaliacao',
    articleSlug: 'prazos-agendamento-e-fair-play',
    sectionAnchor: 'agendamento-bloqueio-pos-prazo',
    label: 'Regras de Jogo, Prazos e Fair Play'
  }
});
