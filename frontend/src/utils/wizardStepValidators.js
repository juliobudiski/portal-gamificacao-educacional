/**
 * Arquitetura Orientada a Objetos para Validação e Orquestração do Wizard de Atividades
 * 
 * Pilares OO Aplicados:
 * - Abstração: Interface implícita e classe base abstrata BaseWizardStepValidator
 * - Herança: Classes especializadas de cada etapa herdando de BaseWizardStepValidator
 * - Polimorfismo: Cada validador sobrescreve validate() com sua regra de negócio específica
 * - Encapsulamento: WizardOrchestrator encapsula a coleção e execução dos validadores
 */

export class ValidationResult {
  constructor(isValid, errorMessage = null) {
    this.isValid = isValid;
    this.errorMessage = errorMessage;
  }

  static success() {
    return new ValidationResult(true);
  }

  static failure(errorMessage) {
    return new ValidationResult(false, errorMessage);
  }
}

/**
 * Classe Base Abstrata para os Validadores de Etapas do Wizard
 */
export class BaseWizardStepValidator {
  constructor(stepId, stepName) {
    if (new.target === BaseWizardStepValidator) {
      throw new TypeError("Não é permitido instanciar a classe abstrata BaseWizardStepValidator diretamente.");
    }
    this.stepId = stepId;
    this.stepName = stepName;
  }

  /**
   * Método polimórfico a ser implementado por cada classe concreta.
   * @param {object} activityData
   * @returns {ValidationResult}
   */
  validate(activityData) {
    throw new Error(`Método validate() deve ser implementado na subclasse ${this.constructor.name}`);
  }

  /**
   * Utilitário herdado para checar strings não vazias de forma defensiva.
   */
  hasValue(str) {
    return typeof str === 'string' && str.trim().length > 0;
  }

  /**
   * Utilitário herdado para checar arrays não vazios de forma defensiva.
   */
  hasItems(arr) {
    return Array.isArray(arr) && arr.length > 0;
  }
}

// ----------------------------------------------------
// IMPLEMENTAÇÕES POLIMÓRFICAS DAS ETAPAS (HERANÇA)
// ----------------------------------------------------

/**
 * Etapa 1: Detalhes Iniciais, Título, Área e Desafios
 */
export class Step1InitialDetailsValidator extends BaseWizardStepValidator {
  constructor() {
    super(1, "Detalhes Iniciais");
  }

  validate(activityData) {
    if (!activityData) {
      return ValidationResult.failure("Dados da atividade não informados.");
    }

    if (!this.hasValue(activityData.title) || !this.hasValue(activityData.areaKnowledge)) {
      return ValidationResult.failure("Por favor, preencha o Título e a Área de Conhecimento.");
    }

    const problems = activityData.currentScenario?.problems;
    if (!this.hasItems(problems)) {
      return ValidationResult.failure("Selecione pelo menos um desafio que seus alunos enfrentam.");
    }

    return ValidationResult.success();
  }
}

/**
 * Etapa 2: Cenário Desejado e Metas
 */
export class Step2DesiredScenarioValidator extends BaseWizardStepValidator {
  constructor() {
    super(2, "Cenário Desejado");
  }

  validate(activityData) {
    if (!activityData) return ValidationResult.failure("Dados da atividade não informados.");

    const objectives = activityData.desiredScenario?.objectives;
    if (!this.hasItems(objectives)) {
      return ValidationResult.failure("Selecione pelo menos uma meta ou objetivo.");
    }

    return ValidationResult.success();
  }
}

/**
 * Etapa 3: Planejamento, Dinâmica e Ambiente
 */
export class Step3PlanningValidator extends BaseWizardStepValidator {
  constructor() {
    super(3, "Planejamento da Atividade");
  }

  validate(activityData) {
    if (!activityData) return ValidationResult.failure("Dados da atividade não informados.");

    if (typeof activityData.activityPlanning?.isTeamActivity !== 'boolean') {
      return ValidationResult.failure("Selecione a Dinâmica de Participação (Individual ou Equipe).");
    }

    const characteristics = activityData.activityPlanning?.characteristics || [];
    const hasEnvironment = characteristics.some(c =>
      typeof c === 'string' && (c.includes("Laboratório") || c.includes("Desplugado") || c.includes("Online"))
    );

    if (!hasEnvironment) {
      return ValidationResult.failure("Selecione obrigatóriamente o Ambiente de Aplicação.");
    }

    return ValidationResult.success();
  }
}

/**
 * Etapa 4: Perfis de Jogadores
 */
export class Step4PlayerProfileValidator extends BaseWizardStepValidator {
  constructor() {
    super(4, "Perfis de Jogadores");
  }

  validate(activityData) {
    if (!activityData) return ValidationResult.failure("Dados da atividade não informados.");

    const profiles = activityData.playerProfile?.selectedProfiles;
    if (!this.hasItems(profiles)) {
      return ValidationResult.failure("Selecione pelo menos um perfil de jogador.");
    }

    return ValidationResult.success();
  }
}

/**
 * Etapa 5: Elementos de Jogos
 */
export class Step5GameElementsValidator extends BaseWizardStepValidator {
  constructor() {
    super(5, "Elementos de Jogos");
  }

  validate(activityData) {
    if (!activityData) return ValidationResult.failure("Dados da atividade não informados.");

    const elements = activityData.gameElements?.selectedElements;
    if (!this.hasItems(elements)) {
      return ValidationResult.failure("Selecione pelo menos um Elemento de Jogo para sua atividade.");
    }

    return ValidationResult.success();
  }
}

/**
 * Etapa 6: Tabuleiro de Progressão e Validação de Conteúdos da IA
 */
export class Step6GameBoardValidator extends BaseWizardStepValidator {
  constructor() {
    super(6, "Tabuleiro de Progressão");
  }

  validate(activityData) {
    if (!activityData) return ValidationResult.failure("Dados da atividade não informados.");

    const path = activityData.gamificationDesign?.progression_path || [];
    if (!this.hasItems(path)) {
      return ValidationResult.failure("O Editor do Tabuleiro não pode ficar vazio. Adicione pelo menos um passo (Conteúdo, Quiz ou Narrativa) à trilha.");
    }

    const hasUnvalidatedDrafts = path.some(step => step && step.isDraft === true);
    if (hasUnvalidatedDrafts) {
      return ValidationResult.failure("Atenção: Você possui rascunhos automáticos da IA no tabuleiro! Clique no lápis (✏️) em cada passo gerado para revisar e validar o conteúdo antes de avançar.");
    }

    return ValidationResult.success();
  }
}

/**
 * Etapa 7: Recompensas Ofertadas
 */
export class Step7RewardsValidator extends BaseWizardStepValidator {
  constructor() {
    super(7, "Recompensas Ofertadas");
  }

  validate(activityData) {
    if (!activityData) return ValidationResult.failure("Dados da atividade não informados.");

    const hasPredefined = this.hasItems(activityData.rewardsOffered?.selectedRewards);
    const hasCustom = this.hasValue(activityData.rewardsOffered?.otherReward);

    if (!hasPredefined && !hasCustom) {
      return ValidationResult.failure("Selecione pelo menos uma Recompensa para engajar seus alunos.");
    }

    return ValidationResult.success();
  }
}

/**
 * Etapa 8: Ações Recompensadas
 */
export class Step8RewardedActionsValidator extends BaseWizardStepValidator {
  constructor() {
    super(8, "Ações Recompensadas");
  }

  validate(activityData) {
    if (!activityData) return ValidationResult.failure("Dados da atividade não informados.");

    const hasPredefined = this.hasItems(activityData.rewardedActions?.selectedActions);
    const hasCustom = this.hasValue(activityData.rewardedActions?.otherAction);

    if (!hasPredefined && !hasCustom) {
      return ValidationResult.failure("Defina pelo menos uma Ação que os alunos devem fazer para ganhar as recompensas.");
    }

    return ValidationResult.success();
  }
}

/**
 * Etapa 9: Regras e Compartilhamento
 */
export class Step9RulesValidator extends BaseWizardStepValidator {
  constructor() {
    super(9, "Regras e Compartilhamento");
  }

  validate(activityData) {
    if (!activityData) return ValidationResult.failure("Dados da atividade não informados.");

    const hasPredefined = this.hasItems(activityData.gamificationRules?.generalRules);
    const hasCustom = this.hasValue(activityData.gamificationRules?.specificRules);

    if (!hasPredefined && !hasCustom) {
      return ValidationResult.failure("Estabeleça ao menos uma Regra para manter a atividade justa e organizada.");
    }

    return ValidationResult.success();
  }
}

// ----------------------------------------------------
// ORQUESTRADOR DO WIZARD (ENCAPSULAMENTO)
// ----------------------------------------------------

export class WizardOrchestrator {
  static validators = new Map([
    [1, new Step1InitialDetailsValidator()],
    [2, new Step2DesiredScenarioValidator()],
    [3, new Step3PlanningValidator()],
    [4, new Step4PlayerProfileValidator()],
    [5, new Step5GameElementsValidator()],
    [6, new Step6GameBoardValidator()],
    [7, new Step7RewardsValidator()],
    [8, new Step8RewardedActionsValidator()],
    [9, new Step9RulesValidator()],
  ]);

  /**
   * Valida uma etapa específica usando polimorfismo.
   * @param {number} stepNumber
   * @param {object} activityData
   * @returns {ValidationResult}
   */
  static validateStep(stepNumber, activityData) {
    const validator = this.validators.get(stepNumber);
    if (!validator) {
      // Se não há validador registrado para o número da etapa, permite a passagem defensivamente
      return ValidationResult.success();
    }
    return validator.validate(activityData);
  }

  /**
   * Valida todas as 9 etapas em lote antes da publicação oficial.
   * @param {object} activityData
   * @returns {ValidationResult}
   */
  static validateAll(activityData) {
    for (let step = 1; step <= 9; step++) {
      const result = this.validateStep(step, activityData);
      if (!result.isValid) {
        return ValidationResult.failure(`${result.errorMessage} (Volte à Etapa ${step})`);
      }
    }
    return ValidationResult.success();
  }
}
