import { describe, it, expect, beforeEach } from 'vitest';
import {
  setAuthRedirect,
  getAuthRedirect,
  clearAuthRedirect,
  resolvePostAuthPath
} from './authRedirect';

describe('authRedirect', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('stores and reads redirect path', () => {
    setAuthRedirect('/activities/abc123');
    expect(getAuthRedirect()).toBe('/activities/abc123');
    clearAuthRedirect();
    expect(getAuthRedirect()).toBeNull();
  });

  it('prefers location.state.from over sessionStorage', () => {
    setAuthRedirect('/activities/stored');
    const path = resolvePostAuthPath(
      { role: 'participant', estado: 'approved' },
      { state: { from: { pathname: '/activities/from-state', search: '' } } }
    );
    expect(path).toBe('/activities/from-state');
    expect(getAuthRedirect()).toBeNull();
  });

  it('falls back to role-based default when no redirect', () => {
    expect(resolvePostAuthPath({ role: 'admin' }, {})).toBe('/admin');
    expect(resolvePostAuthPath({ role: 'participant', estado: 'approved' }, {})).toBe('/activities');
    expect(resolvePostAuthPath({ role: 'participant', estado: 'pending' }, {})).toBe('/dashboard');
  });
});
