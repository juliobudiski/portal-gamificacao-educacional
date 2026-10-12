import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { TeacherPrivacyNameFormatter, formatTeacherDisplayName } from './nameFormatter.js';

describe('TeacherPrivacyNameFormatter (LGPD Privacy)', () => {
  it('deve abreviar múltiplos sobrenomes e ignorar preposições', () => {
    const formatted = formatTeacherDisplayName('Julio Cesar da Silva Budiski');
    assert.equal(formatted, 'Julio C. S. B.');
  });

  it('deve manter nome único sem alterações', () => {
    const formatted = formatTeacherDisplayName('Sócrates');
    assert.equal(formatted, 'Sócrates');
  });

  it('deve tratar espaços múltiplos e preposições variadas', () => {
    const formatted = formatTeacherDisplayName('   Maria   de   Lourdes   dos   Santos   ');
    assert.equal(formatted, 'Maria L. S.');
  });

  it('deve abreviar nome e sobrenome simples', () => {
    const formatted = formatTeacherDisplayName('Carlos Drummond');
    assert.equal(formatted, 'Carlos D.');
  });

  it('deve retornar fallback seguro para valores nulos (Chaos Monkey)', () => {
    assert.equal(formatTeacherDisplayName(null), 'Professor Anônimo');
    assert.equal(formatTeacherDisplayName(undefined), 'Professor Anônimo');
    assert.equal(formatTeacherDisplayName('   '), 'Professor Anônimo');
    assert.equal(formatTeacherDisplayName(1234), 'Professor Anônimo');
  });
});
