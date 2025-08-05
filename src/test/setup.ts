import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

// Extends Vitest's expect method with methods from react-testing-library
expect.extend(matchers);

// Cleanup after each test case (e.g. clearing jsdom)
afterEach(() => {
  cleanup();
});

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
});

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  root: Element | null = null;
  rootMargin: string = '0px';
  thresholds: ReadonlyArray<number> = [0];

  constructor(
    _callback: IntersectionObserverCallback,
    options?: IntersectionObserverInit
  ) {
    this.root = (options?.root instanceof Element) ? options.root : null;
    this.rootMargin = options?.rootMargin || '0px';
    this.thresholds = options?.threshold ? 
      (Array.isArray(options.threshold) ? options.threshold : [options.threshold]) : 
      [0];
  }

  observe() {
    return null;
  }

  disconnect() {
    return null;
  }

  unobserve() {
    return null;
  }

  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
};