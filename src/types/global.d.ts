/// <reference types="chrome" />

declare global {
  interface Window {
    __SSR_DATA__?: unknown;
  }
}

export {};
