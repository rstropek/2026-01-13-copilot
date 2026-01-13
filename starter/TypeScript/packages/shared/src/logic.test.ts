import { describe, it, expect } from '@jest/globals';
import { add } from './logic.js';

describe('add', () => {
  it('should add two positive numbers correctly', () => {
    expect(add(2, 3)).toBe(5);
  });

  it('should add negative numbers correctly', () => {
    expect(add(-5, -3)).toBe(-8);
  });

  it('should add positive and negative numbers correctly', () => {
    expect(add(10, -5)).toBe(5);
  });

  it('should handle zero correctly', () => {
    expect(add(0, 0)).toBe(0);
    expect(add(5, 0)).toBe(5);
    expect(add(0, 5)).toBe(5);
  });

  it('should handle decimal numbers correctly', () => {
    expect(add(1.5, 2.5)).toBe(4);
    expect(add(0.1, 0.2)).toBeCloseTo(0.3);
  });
});
