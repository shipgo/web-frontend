import { afterEach, describe, expect, it, vi } from 'vitest';

import { esAppInstaladaMovil } from './appInstalada';

const originalMatchMedia = window.matchMedia;

/** Simula `matchMedia`: `standalone` para display-mode y `movil` para el ancho. */
const simular = ({ standalone, movil }) => {
  window.matchMedia = vi.fn().mockImplementation((query) => ({
    matches: query.includes('display-mode') ? standalone : movil,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
};

afterEach(() => {
  window.matchMedia = originalMatchMedia;
  delete window.navigator.standalone;
});

describe('esAppInstaladaMovil', () => {
  it('instalada y en un celular -> true', () => {
    simular({ standalone: true, movil: true });
    expect(esAppInstaladaMovil()).toBe(true);
  });

  it('en una pestaña del navegador (celular o escritorio) -> false', () => {
    simular({ standalone: false, movil: true });
    expect(esAppInstaladaMovil()).toBe(false);
    simular({ standalone: false, movil: false });
    expect(esAppInstaladaMovil()).toBe(false);
  });

  it('instalada en escritorio -> false', () => {
    simular({ standalone: true, movil: false });
    expect(esAppInstaladaMovil()).toBe(false);
  });

  it('iOS viejo: navigator.standalone cuenta como instalada', () => {
    simular({ standalone: false, movil: true });
    Object.defineProperty(window.navigator, 'standalone', { value: true, configurable: true });
    expect(esAppInstaladaMovil()).toBe(true);
  });

  it('sin matchMedia no rompe', () => {
    window.matchMedia = undefined;
    expect(esAppInstaladaMovil()).toBe(false);
  });
});
