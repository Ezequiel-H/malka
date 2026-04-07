import { describe, it, expect } from 'vitest';
import { formatAuthError, normalizePhone } from './authErrors.js';

describe('normalizePhone', () => {
  it('strips spaces', () => {
    expect(normalizePhone('54 11 1234')).toBe('54111234');
  });
});

describe('formatAuthError', () => {
  it('returns fallback when no response', () => {
    expect(formatAuthError(new Error('net'), 'fallback')).toBe('fallback');
  });

  it('uses message string from API', () => {
    const err = { response: { data: { message: '  bad  ' } } };
    expect(formatAuthError(err, 'x')).toBe('bad');
  });

  it('joins express-validator errors', () => {
    const err = {
      response: { data: { errors: [{ msg: 'A' }, { msg: 'B' }] } }
    };
    expect(formatAuthError(err, 'x')).toBe('A B');
  });

  it('detects duplicate key in stringified body', () => {
    const err = { response: { data: { detail: 'E11000 duplicate key error' } } };
    expect(formatAuthError(err, 'x')).toBe(
      'Ya existe una cuenta con ese email, teléfono o DNI.'
    );
  });
});
