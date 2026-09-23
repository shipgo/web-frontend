import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';

import { useToggleColorScheme } from './useToggleColorScheme';

const MANTINE_COLOR_SCHEME_STORAGE_KEY = 'mantine-color-scheme-value';

const mockMatchMediaPrefersDark = (prefersDark) => {
  window.matchMedia = vi.fn().mockImplementation((query) => ({
    matches: prefersDark && query === '(prefers-color-scheme: dark)',
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
};

const wrapper = ({ children }) => (
  <MantineProvider defaultColorScheme="auto">{children}</MantineProvider>
);

describe('useToggleColorScheme', () => {
  const originalMatchMedia = window.matchMedia;

  beforeEach(() => {
    window.localStorage.removeItem(MANTINE_COLOR_SCHEME_STORAGE_KEY);
  });

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
    window.localStorage.removeItem(MANTINE_COLOR_SCHEME_STORAGE_KEY);
  });

  it('retorna computedColorScheme y handleToggleColorScheme', () => {
    mockMatchMediaPrefersDark(false);
    const { result } = renderHook(() => useToggleColorScheme(), { wrapper });

    expect(result.current).toHaveProperty('computedColorScheme');
    expect(result.current).toHaveProperty('handleToggleColorScheme');
    expect(typeof result.current.handleToggleColorScheme).toBe('function');
  });

  it('refleja la preferencia del SO cuando defaultColorScheme es "auto"', () => {
    mockMatchMediaPrefersDark(true);
    const { result } = renderHook(() => useToggleColorScheme(), { wrapper });

    expect(result.current.computedColorScheme).toBe('dark');
  });

  it('alterna el tema con un solo click desde "auto"/oscuro a claro', () => {
    mockMatchMediaPrefersDark(true);
    const { result, rerender } = renderHook(() => useToggleColorScheme(), { wrapper });

    expect(result.current.computedColorScheme).toBe('dark');

    // Llamar a handleToggleColorScheme
    act(() => {
      result.current.handleToggleColorScheme();
    });

    // Rerender para reflejar los cambios
    rerender();

    expect(result.current.computedColorScheme).toBe('light');
  });

  it('respeta una preferencia explícita guardada y alterna correctamente', () => {
    // El SO dice "claro" pero el usuario ya había elegido "oscuro"
    mockMatchMediaPrefersDark(false);
    window.localStorage.setItem(MANTINE_COLOR_SCHEME_STORAGE_KEY, 'dark');

    const { result, rerender } = renderHook(() => useToggleColorScheme(), { wrapper });

    expect(result.current.computedColorScheme).toBe('dark');

    act(() => {
      result.current.handleToggleColorScheme();
    });

    rerender();

    expect(result.current.computedColorScheme).toBe('light');
  });
});
