// src/test/setup.ts
// Global test setup — runs before every test file

import '@testing-library/jest-dom';

// Reset all mocks after each test
afterEach(() => {
  vi.clearAllMocks();
});

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    get length() {
      return Object.keys(store).length;
    },
    key: (index: number) => Object.keys(store)[index] ?? null,
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock matchMedia (not available in jsdom)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }),
});

// Suppress known jsdom console errors from aria-* attributes
const originalError = console.error.bind(console.error);
beforeAll(() => {
  console.error = (msg: unknown, ...args: unknown[]) => {
    if (typeof msg === 'string' && msg.includes('aria-')) return;
    originalError(msg, ...args);
  };
});
afterAll(() => {
  console.error = originalError;
});
