import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
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

/** Recharts ResponsiveContainer */
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
global.ResizeObserver = ResizeObserverStub;

/** Recharts: jsdom suele dar 0×0 y loguea "width(0) and height(0) of chart" */
const originalGetBoundingClientRect = Element.prototype.getBoundingClientRect;
Element.prototype.getBoundingClientRect = function patchedGetBoundingClientRect() {
  const r = originalGetBoundingClientRect.call(this);
  if (r.width !== 0 || r.height !== 0) {
    return r;
  }
  const w = 800;
  const h = 600;
  return {
    x: r.x,
    y: r.y,
    width: w,
    height: h,
    top: r.top,
    left: r.left,
    right: r.left + w,
    bottom: r.top + h,
    toJSON() {
      return {};
    }
  };
};

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' });
});

afterEach(() => {
  cleanup();
  server.resetHandlers();
  localStorage.clear();
  locationStub.pathname = '/';
  locationStub.href = 'http://localhost:5173/';
});

afterAll(() => {
  server.close();
});
