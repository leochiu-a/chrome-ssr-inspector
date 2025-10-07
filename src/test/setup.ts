import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/jest-dom';
import '@testing-library/jest-dom/vitest';

// Cleanup after each test
afterEach(() => {
  cleanup();
});
