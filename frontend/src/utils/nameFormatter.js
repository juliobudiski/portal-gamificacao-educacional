/**
 * Utilitário de Privacidade e Anonimização de Nomes (LGPD)
 * Formata nomes completos para exibir o primeiro nome e as iniciais dos sobrenomes.
 * Exemplo: "Julio Cesar da Silva Budiski" -> "Julio C. S. B."
 */

const PREPOSITIONS = new Set(['de', 'da', 'do', 'das', 'dos', 'e']);

/**
 * Classe responsável por encapsular a estratégia de ofuscação de nomes para privacidade.
 */
export class TeacherPrivacyNameFormatter {
  /**
   * Anonimiza o nome informado de forma segura e resiliente a entradas nulas/anômalas.
   * @param {string} rawName 
   * @returns {string}
   */
  static format(rawName) {
    if (!rawName || typeof rawName !== 'string') {
      return 'Professor Anônimo';
    }

    // Normaliza múltiplos espaços e quebras
    const cleaned = rawName.trim().replace(/\s+/g, ' ');
    if (!cleaned) {
      return 'Professor Anônimo';
    }

    const tokens = cleaned.split(' ');
    const firstName = tokens[0].charAt(0).toUpperCase() + tokens[0].slice(1).toLowerCase();

    if (tokens.length === 1) {
      return firstName;
    }

    const initials = [];
    for (let i = 1; i < tokens.length; i++) {
      const token = tokens[i];
      const lower = token.toLowerCase();
      if (PREPOSITIONS.has(lower)) {
        continue;
      }
      const char = token.charAt(0).toUpperCase();
      if (/[A-Za-zÀ-ÖØ-öø-ÿ]/.test(char)) {
        initials.push(`${char}.`);
      }
    }

    if (initials.length === 0) {
      return firstName;
    }

    return `${firstName} ${initials.join(' ')}`;
  }
}

export function formatTeacherDisplayName(name) {
  return TeacherPrivacyNameFormatter.format(name);
}
