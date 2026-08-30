import re
import bleach
import unicodedata
import logging

logger = logging.getLogger(__name__)

# --- CONFIGURAÇÃO DE SEGURANÇA ---

# Lista de termos proibidos, total de 622 palavras bloqueadas
BLOCKED_TERMS = [
    # ============================================================
    # ======================= PT-BR ==============================
    # ============================================================

    # Discriminação racial/étnica
    "macaco", "macaca", "crioulo", "crioula", "preto imundo", "negro imundo",
    "neguinho", "neguinha", "urubu", "carvão", "escurinho", "beiçudo",
    "cabelo de bombril", "favelado", "favelada", "mulato sujo",

    # Xenofobia
    "gringo de merda", "estrangeiro nojento", "imigrante ilegal",
    "paraíba", "baiano preguiçoso", "nordestino burro",
    "carioca vagabundo", "paulista nojento", "boludo", "paraguaio ladrão",

    # LGBTfobia
    "viado", "viadinho", "boiola", "bicha", "bichinha", "marica",
    "sapatão", "sapatao", "traveco", "travesti imundo",
    "gayzinho", "aberração", "invertido",

    # Misoginia / Misandria
    "puta", "putinha", "vadia", "vagabunda", "piranha", "prostituta",
    "mulherzinha", "feminazi", "cadela", "galinha",
    "homem lixo", "macho escroto", "incel", "pau mole",

    # Capacitismo
    "retardado", "retardada", "mongol", "mongoloide", "aleijado",
    "aleijada", "deficiente", "débil mental", "doente mental",
    "autista do caralho",

    # Assédio sexual / palavrões gerais
    "merda", "bosta", "caralho", "caralhos", "porra", "poha",
    "foda", "foder", "fuder", "cu", "cuzão", "cuzao",
    "buceta", "pau", "pinto", "cacete", "rola", "piroca",
    "corno", "cornos", "otario", "otária", "idiota", "imbecil",
    "babaca", "trouxa", "burro", "burra", "inútil", "inuteis", "arrombada",
    "arrombadas", "arrombado", "babaca", "bacurinha",
    "baitola", "bichona", "bixa", "boceta", "boiola", "caraiba",
    "bolcinha", "bolsinha", "boquete", "boqueteira", "p0rn0",
    "boqueteiro", "boquetera", "boquetero", "boquetes",
    "bosta", "brecheca", "bucefula", "buceta", "vagina",
    "bucetao", "bucetas", "bucetasso", "bucetinha", "xvideos",
    "bucetinhas", "bucetonas", "cacete", "cachuleta", "pornhub",
    "cagalhao", "carai", "caraio", "caralha", "caralho",
    "caralhudo", "caralho", "cassete", "cequelada", "cequelado",
    "chalerinha", "chatico", "chavasca", "checheca", "chereca",
    "chibio", "chimbica", "chupada", "chupador", "chupadora",
    "chupando", "chupeta", "chupetinha", "chupetinha", "chupou",
    "porra", "crossdresser", "cu", "cuecao", "custozinha",
    "cuzao", "cuzinho", "cuzinhos", "dadeira", "encoxada",
    "enrabadas", "fornicada", "fudendo", "fudido", "furustreca",
    "gostozudas", "gozada", "gozadas", "greludas", "gulosinha",
    "katchanga", "bilau", "lesbofetiche", "lixa-pica",
    "mede-rola", "megasex", "mela-pentelho", "meleca", "melequinha",
    "menage", "menages", "merda", "merdao", "meretriz",
    "metendo", "mijada", "otario", "papa-duro", "pau",
    "pausudas", "pechereca", "peidao", "peido", "peidorreiro",
    "peitos", "peituda", "peitudas", "periquita", "pica",
    "piranhuda", "piriguetes", "piroca", "pirocao", "pirocas",
    "pirocudo", "pitbitoca", "pitchbicha", "pitchbitoca", "pithbicha",
    "pithbitoca", "pitibicha", "pitrica", "pixota", "caralho",
    "prencheca", "prexeca", "priquita", "priquito",
    "punheta", "punheteiro", "pussy", "puta",
    "putaria", "putas", "putinha", "quenga", "rabuda",
    "rabudas", "rameira", "rapariga", "retardado",
    "saca-rola", "safada", "safadas", "safado", "onlyfans",
    "safados", "sequelada", "sexboys", "sexgatas", "sirica",
    "siririca", "sotravesti", "suruba", "surubas", "taioba",
    "tarada", "tchaca", "tcheca", "tchonga", "tchuchuca",
    "tchutchuca", "tesuda", "tesudas", "tesudo", "tetinha",
    "tezao", "tezuda", "tezudo", "tgatas", "t-girls",
    "tobinha", "tomba-macho", "topsexy", "transa",
    "transando", "travecas", "traveco", "travecos",
    "trepada", "trepadas", "vacilao", "vadjaina",
    "vadia", "vagabunda", "vagabundo", "vaginismo",
    "vajoca", "veiaca", "veiaco", "viadinho",
    "viado", "xabasca", "xana", "xaninha", "conteúdo adulto",
    "xatico", "xavasca", "xebreca", "xereca",
    "xexeca", "xibio", "xoroca", "xota", "putas", "putos"
    "xotinha", "xoxota", "xoxotas", "xoxotinha",
    "xulipa", "xumbrega", "xupaxota", "xupeta", "xupetinha",

    # Abreviações e evasões
    "fdp", "f.d.p", "vsf", "vtnc", "tnc", "pqp", "krl", "kralho",
    "crlh", "bct", "fdpt", "vag@", "put@", "c#ralho", "@rromb@d@",
    "@rromb@d@s", "@rromb@do", "b@b@c@", "b@curinh@", "b@itol@",
    "bichon@", "bix@", "bocet@", "boiol@", "bolcinh@",
    "bolsinh@", "boqueteir@", "boqueter@", "bost@",
    "brechec@", "buceful@", "bucet@", "bucet@o", "bucet@s",
    "bucet@sso", "bucetinh@", "bucetinh@s", "buceton@s",
    "c@cete", "c@chulet@", "c@g@lh@o", "c@r@i", "c@r@lh@",
    "c@r@lho", "c@r@lhudo", "c@r@lho", "c@ssete", "cequel@d@",
    "cequel@do", "ch@lerinh@", "ch@tico", "ch@v@sc@", "chechec@",
    "cherec@", "chimbic@", "chup@d@", "chup@dor", "chup@dor@",
    "chup@ndo", "chupet@", "chupetinh@", "chupetinh@", "cuec@o",
    "custozinh@", "cuz@o", "d@deir@", "progr@m@", "encox@d@",
    "enr@b@d@s", "put@", "fornic@d@", "furustrec@", "gostozud@s",
    "goz@d@", "goz@d@s", "grelud@s", "gulosinh@", "k@tch@ng@",
    "l@bios de feme@", "l@rgo do bil@u", "lix@-pic@", "mede-rol@",
    "meg@sex", "mel@-pentelho", "melec@", "melequinh@",
    "men@ge", "men@ges", "merd@", "merd@o", "mij@d@",
    "rol@", "ot@rio", "p@u", "p@p@-duro", "p@usud@s",
    "pecherec@", "peid@o", "peitud@", "peitud@s", "periquit@",
    "pic@", "pir@nhud@", "piroc@", "piroc@o", "piroc@s",
    "pitbitoc@", "pitchbich@", "pitchbitoc@", "pithbich@", "pithbitoc@",
    "pitibich@", "pitric@", "pixot@", "porr@", "c@r@lho",
    "prenchec@", "prexec@", "priquit@", "punhet@", "put@",
    "put@ri@", "put@s", "putinh@", "queng@", "r@bud@",
    "r@bud@s", "r@meir@", "r@p@rig@", "ret@rd@do", "s@f@d@",
    "s@f@d@s", "s@f@do", "s@f@dos", "sequel@d@", "sexg@t@s",
    "siric@", "siriric@", "sotr@vesti", "surub@", "surub@s",
    "t@iob@", "t@r@d@", "tch@c@", "tchec@", "tchong@",
    "tchuchuc@", "tchutchuc@", "tesud@", "tesud@s", "tetinh@",
    "tez@o", "tezud@", "tg@t@s", "tobinh@", "tomb@-m@cho",
    "tr@ns@", "tr@ns@ndo", "tr@vec@s", "trep@d@", "trep@d@s",
    "v@cil@o", "v@dj@in@", "v@dia", "v@g@bund@", "v@g@bundo",
    "v@ginismo", "v@joc@", "vei@c@", "vei@co", "vi@dinho",
    "vi@do", "x@b@sc@", "x@n@", "x@ninh@", "x@tico",
    "x@v@sc@", "xebrec@", "xerec@", "xexec@", "xoroc@",
    "xot@", "xotinh@", "xoxot@", "xoxot@s", "xoxotinh@",
    "xulip@", "xumbreg@", "xup@xot@", "xupet@", "xupetinh@"

    # ============================================================
    # ======================= ENGLISH =============================
    # ============================================================

    # Racial / Ethnic discrimination
    "nigger", "nigga", "monkey", "ape", "coon", "spic", "wetback",
    "chink", "gook", "raghead", "sandnigger", "cracker",
    "white trash", "porch monkey",

    # Xenophobia
    "illegal alien", "dirty immigrant", "go back to your country",
    "foreign trash", "border jumper",

    # LGBTphobia
    "faggot", "fag", "dyke", "tranny", "shemale", "queer freak",
    "homo", "no homo", "fairy",

    # Misogyny / Misandry
    "bitch", "slut", "whore", "hoe", "skank", "cunt",
    "feminazi", "gold digger",
    "manchild", "male pig", "incel",

    # Ableism
    "retard", "retarded", "moron", "imbecile", "cripple",
    "spastic", "psycho", "autistic fuck",

    # Sexual harassment / profanity
    "fuck", "fucking", "motherfucker", "mf", "shit", "bullshit",
    "asshole", "dick", "cock", "pussy", "twat",
    "prick", "bastard", "jerk", "dumbass",

    # Abbreviations / evasions
    "stfu", "gtfo", "fck", "f*ck", "sh1t", "b1tch",
    "a$$hole", "d1ck", "pu$$y",

    # ============================================================
    # ======================= ESPAÑOL =============================
    # ============================================================

    # Discriminación racial/étnica
    "negro de mierda", "mono", "simio", "sudaca", "indio sucio",
    "prieto", "negrata", "mestizo asqueroso",

    # Xenofobia
    "extranjero de mierda", "inmigrante ilegal",
    "vete a tu país", "gringo asqueroso",

    # LGBTfobia
    "maricón", "marica", "puto", "putito", "joto",
    "travelo", "trava", "tortillera", 

    # Misoginia / Misandria
    "puta", "zorra", "perra", "golfa", "ramera",
    "feminazi",
    "macho inútil", "hombre basura",

    # Capacitismo
    "retrasado", "retrasada", "mongólico", "lisiado",
    "subnormal", "enfermo mental",

    # Assédio sexual / insultos gerais
    "mierda", "joder", "coño", "carajo", "verga",
    "polla", "culo", "imbécil", "idiota", "estúpido",
    "pendejo", "cabron", "gilipollas", "tarado",

    # Abreviações e variações
    "hdp", "ptm", "ctm", "jodete", "p*ta", "z0rra", "m1erda"
]


# Tags HTML permitidas (Whitelisting).
# Para CHAT: Geralmente queremos lista vazia [] (texto puro).
# Para FÓRUM: Podemos permitir formatação básica.
ALLOWED_TAGS_FORUM = ['b', 'i', 'u', 'em', 'strong', 'a', 'code', 'pre', 'blockquote']
ALLOWED_ATTRS_FORUM = {
    'a': ['href', 'title', 'target']
}

def normalize_text(text: str) -> str:
    """
    Remove acentos e converte para minúsculas para facilitar a detecção de palavrões.
    Ex: 'É uma AÇÃO' -> 'e uma acao'
    """
    if not text:
        return ""
    
    # Normaliza unicode (NFD separa caracteres de seus acentos)
    normalized = unicodedata.normalize('NFD', text)
    # Filtra apenas caracteres não-diacríticos (remove acentos) e converte para lower
    return "".join(c for c in normalized if unicodedata.category(c) != 'Mn').lower()

def clean_text(text: str, context: str = 'chat') -> str:
    """
    Remove tags HTML perigosas (XSS) e limpa espaços extras.
    
    @param text: O texto bruto do usuário.
    @param context: 'chat' (remove tudo) ou 'forum' (permite negrito, links, etc).
    @return: Texto limpo e seguro.
    """
    if not text:
        return ""

    # Define quais tags são permitidas baseadas no contexto
    tags = ALLOWED_TAGS_FORUM if context == 'forum' else []
    attrs = ALLOWED_ATTRS_FORUM if context == 'forum' else {}

    # Bleach limpa o HTML mantendo apenas o permitido
    # strip=True remove as tags não permitidas em vez de "escapá-las" (ex: <script> vira vazio, não &lt;script&gt;)
    cleaned = bleach.clean(text, tags=tags, attributes=attrs, strip=True)

    # Remove espaços em branco excessivos no início/fim
    return cleaned.strip()

# --- PROTEÇÃO CONTRA INJECTIONS (WAF) ---

PROMPT_INJECTION_PATTERNS = [
    r"ignore\s+(all\s+)?(previous\s+)?(instructions|rules|directions)",
    r"forget\s+(all\s+)?(previous\s+)?(instructions|rules|directions)",
    r"desconsidere\s+as\s+instruções",
    r"ignore\s+as\s+regras",
    r"you\s+are\s+now",
    r"system\s+prompt",
    r"bypass",
    r"modo\s+desenvolvedor",
    r"developer\s+mode",
    r"jailbreak",
    r"print\s+all\s+instructions"
]

STRICT_SQL_PATTERNS = [
    r"(?i)\b(SELECT|INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|TRUNCATE|EXEC|UNION)\b",
    r"(--|;|\/\*|\*\/|@@)", # Comentários SQL e variáveis globais
    r"(\bOR\b|\bAND\b)\s+['\"0-9a-zA-Z]+\s*[=<>]\s*['\"0-9a-zA-Z]+" # ' OR '1'='1
]

def detect_prompt_injection(text: str) -> bool:
    """Verifica se o texto contém padrões clássicos de tentativa de manipular o LLM."""
    if not text:
        return False
    normalized = text.lower()
    for pattern in PROMPT_INJECTION_PATTERNS:
        if re.search(pattern, normalized, re.IGNORECASE):
            logger.warning(f"🚨 PROMPT INJECTION DETECTADO: {pattern}")
            return True
    return False

def detect_strict_sql_injection(text: str) -> bool:
    """Validação RÍGIDA contra caracteres SQL (Usar apenas em campos restritos como Auth)."""
    if not text:
        return False
    for pattern in STRICT_SQL_PATTERNS:
        if re.search(pattern, text):
            logger.warning(f"🚨 STRICT SQL INJECTION DETECTADO: {pattern}")
            return True
    return False

def check_profanity(text: str) -> bool:
    """
    Verifica se o texto contém termos proibidos usando Regex e Normalização.
    Retorna True se encontrar profanidade.
    
    @param text: Texto a ser verificado.
    @return: True se contiver termos bloqueados, False se estiver limpo.
    """
    if not text:
        return False

    # 1. Normaliza o texto (remove acentos, deixa minúsculo)
    normalized_text = normalize_text(text)

    # 2. Verifica cada termo bloqueado
    # Usamos \b (borda de palavra) para evitar o "Problema de Scunthorpe".
    # Ex: Bloquear "cú" não deve bloquear "cuidadoso".
    # Mas se o termo for composto ou parte de gíria, o regex deve ser ajustado.
    
    for term in BLOCKED_TERMS:
        # Normaliza o termo proibido também, por garantia
        term_clean = normalize_text(term)
        
        # Cria regex compilado para performance se a lista for grande
        # Procura a palavra exata no texto
        if re.search(r'\b' + re.escape(term_clean) + r'\b', normalized_text):
            logger.warning(f"Profanidade detectada: termo '{term}' no texto.")
            return True

    return False

def censor_text(text: str, replacement: str = "$@#!$") -> str:
    """
    Substitui termos proibidos pelo texto de substituição, preservando o restante.
    Útil para fóruns onde não queremos descartar todo o texto do usuário.
    """
    if not text:
        return ""
        
    # 1. Ordena por tamanho (decrescente) para garantir que frases maiores 
    # sejam substituídas antes de palavras menores (ex: "puta merda" antes de "merda")
    # Isso evita substituições parciais estranhas.
    sorted_terms = sorted(BLOCKED_TERMS, key=len, reverse=True)
    
    # 2. Cria um padrão Regex gigante: \b(palavra1|palavra2|...)\b
    # re.escape garante que caracteres especiais na lista não quebrem o regex
    pattern_str = r'\b(' + '|'.join(re.escape(term) for term in sorted_terms) + r')\b'
    
    # 3. Compila com IGNORECASE para pegar "Merda", "MERDA", "merda"
    try:
        pattern = re.compile(pattern_str, re.IGNORECASE)
        return pattern.sub(replacement, text)
    except Exception as e:
        logger.error(f"Erro ao censurar texto: {e}")
        return text # Em caso de erro, retorna o texto original (Fail Open)