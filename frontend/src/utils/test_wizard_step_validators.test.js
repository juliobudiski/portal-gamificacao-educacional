import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  WizardOrchestrator,
  Step1InitialDetailsValidator,
  Step3PlanningValidator,
  Step6GameBoardValidator,
  BaseWizardStepValidator
} from './wizardStepValidators.js';

describe('Wizard Step Validators (OO Architecture: Polimorfismo, Herança, Abstração, Encapsulamento)', () => {
  it('não deve permitir instanciar diretamente a classe abstrata BaseWizardStepValidator', () => {
    assert.throws(() => {
      new BaseWizardStepValidator(99, "Teste");
    }, TypeError);
  });

  it('US01: Etapa 1 - Deve validar com sucesso dados completos de título, área e desafios', () => {
    const validData = {
      title: 'Matemática Divertida',
      areaKnowledge: 'Matemática',
      currentScenario: { problems: ['Dificuldade em frações'] }
    };
    const result = WizardOrchestrator.validateStep(1, validData);
    assert.equal(result.isValid, true);
    assert.equal(result.errorMessage, null);
  });

  it('US01: Etapa 1 - Deve falhar se título ou área estiverem vazios', () => {
    const invalidData = {
      title: '   ',
      areaKnowledge: '',
      currentScenario: { problems: ['Dificuldade'] }
    };
    const result = WizardOrchestrator.validateStep(1, invalidData);
    assert.equal(result.isValid, false);
    assert.match(result.errorMessage, /Título e a Área de Conhecimento/);
  });

  it('US01: Etapa 3 - Deve falhar se a dinâmica (individual/equipe) não for booleana', () => {
    const invalidData = {
      activityPlanning: {
        isTeamActivity: null,
        characteristics: ['Laboratório de Informática']
      }
    };
    const result = WizardOrchestrator.validateStep(3, invalidData);
    assert.equal(result.isValid, false);
    assert.match(result.errorMessage, /Dinâmica de Participação/);
  });

  it('US01: Etapa 3 - Deve falhar se não houver ambiente definido (Laboratório/Desplugado/Online)', () => {
    const invalidData = {
      activityPlanning: {
        isTeamActivity: false,
        characteristics: ['Outra característica qualquer']
      }
    };
    const result = WizardOrchestrator.validateStep(3, invalidData);
    assert.equal(result.isValid, false);
    assert.match(result.errorMessage, /Ambiente de Aplicação/);
  });

  it('US03: Etapa 6 - Deve falhar se o tabuleiro não tiver passos', () => {
    const invalidData = {
      gamificationDesign: { progression_path: [] }
    };
    const result = WizardOrchestrator.validateStep(6, invalidData);
    assert.equal(result.isValid, false);
    assert.match(result.errorMessage, /Editor do Tabuleiro não pode ficar vazio/);
  });

  it('US03: Etapa 6 - Deve bloquear se houver rascunhos de IA não validados (isDraft: true)', () => {
    const invalidData = {
      gamificationDesign: {
        progression_path: [
          { id: 'step-1', title: 'Introdução', isDraft: false },
          { id: 'step-2', title: 'Quiz IA', isDraft: true }
        ]
      }
    };
    const result = WizardOrchestrator.validateStep(6, invalidData);
    assert.equal(result.isValid, false);
    assert.match(result.errorMessage, /rascunhos automáticos da IA/);
  });

  it('US04 & US05 (Chaos Monkey): Deve resistir defensivamente a payloads nulos ou indefinidos', () => {
    const resultNull = WizardOrchestrator.validateStep(1, null);
    assert.equal(resultNull.isValid, false);

    const resultUndefined = WizardOrchestrator.validateStep(5, undefined);
    assert.equal(resultUndefined.isValid, false);

    const resultEmpty = WizardOrchestrator.validateStep(9, {});
    assert.equal(resultEmpty.isValid, false);
  });

  it('Deve validar com sucesso todas as etapas consecutivamente pelo validateAll', () => {
    const fullValidData = {
      title: 'Ciências Gamificadas',
      areaKnowledge: 'Ciências',
      currentScenario: { problems: ['Falta de atenção'] },
      desiredScenario: { objectives: ['Aprender fotossíntese'] },
      activityPlanning: { isTeamActivity: true, characteristics: ['Laboratório'] },
      playerProfile: { selectedProfiles: ['Explorador'] },
      gameElements: { selectedElements: ['Pontos'] },
      gamificationDesign: { progression_path: [{ id: '1', title: 'Fase 1', isDraft: false }] },
      rewardsOffered: { selectedRewards: ['Medalha de Botânica'] },
      rewardedActions: { selectedActions: ['Concluir o quiz'] },
      gamificationRules: { generalRules: ['Respeitar os colegas'] }
    };

    const result = WizardOrchestrator.validateAll(fullValidData);
    assert.equal(result.isValid, true);
  });
});
