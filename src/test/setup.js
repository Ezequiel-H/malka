import '@testing-library/jest-dom/vitest';
import { afterAll, afterEach, beforeAll, vi } from 'vitest';
import { server } from './msw/server.js';

export const locationStub = {
  pathname: '/',
  href: 'http://localhost:5173/',
  assign: vi.fn(),
  replace: vi.fn(),
  reload: vi.fn()
};

Object.defineProperty(window, 'location', {
  configurable: true,
  get: () => locationStub
});

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' });
});

afterEach(() => {
  server.resetHandlers();
  localStorage.clear();
  locationStub.pathname = '/';
  locationStub.href = 'http://localhost:5173/';
});

afterAll(() => {
  server.close();
});
