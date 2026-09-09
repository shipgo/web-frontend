import { describe, expect, it } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axe from 'axe-core';

import { renderWithProviders } from '../../../../test/renderWithProviders';
import { LANDING_SEO } from '../../constants/seo';

import LandingPage from './index';

describe('LandingPage', () => {
  it('renderiza el hero, el "qué resuelve" y el "cómo funciona"', () => {
    renderWithProviders(<LandingPage />);

    expect(
      screen.getByRole('heading', { level: 1, name: /todo en un solo lugar/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /qué resuelve shipgo/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /cómo funciona/i })).toBeInTheDocument();
  });

  it('setea el título y la meta description mientras está montada', () => {
    const { unmount } = renderWithProviders(<LandingPage />);

    expect(document.title).toBe(LANDING_SEO.title);
    expect(
      document.head.querySelector('meta[name="description"]')?.getAttribute('content'),
    ).toBe(LANDING_SEO.description);
    expect(
      document.head.querySelector('meta[property="og:title"]')?.getAttribute('content'),
    ).toBe(LANDING_SEO.title);

    unmount();

    // Se limpia al desmontar para no ensuciar el <head> en otra pantalla.
    expect(document.head.querySelector('meta[property="og:title"]')).not.toBeInTheDocument();
  });

  it('expone los 4 accesos diferenciados con destinos distintos', () => {
    renderWithProviders(<LandingPage />);

    expect(screen.getByRole('link', { name: /iniciar sesión/i })).toHaveAttribute(
      'href',
      '/login',
    );
    expect(screen.getByRole('link', { name: /ingresar al portal/i })).toHaveAttribute(
      'href',
      '/portal/ingresar',
    );
    expect(screen.getByRole('link', { name: /crear cuenta/i })).toHaveAttribute(
      'href',
      '/registro',
    );
    expect(screen.getByRole('link', { name: /ver seguimiento/i })).toHaveAttribute(
      'href',
      '/tracking',
    );
  });

  it('el bloque de tracking rápido navega a /tracking/:codigo con un código válido', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LandingPage />);

    await user.type(screen.getByLabelText(/código de seguimiento/i), '7K2M9QX4TP');
    await user.click(screen.getByRole('button', { name: /consultar/i }));

    await waitFor(() => {
      expect(window.location.pathname).toBe('/tracking/7K2M9QX4TP');
    });
  });

  it('sin violaciones axe-core críticas/serias', async () => {
    const { container } = renderWithProviders(<LandingPage />);

    const results = await axe.run(container);
    const graves = results.violations.filter((violation) =>
      ['critical', 'serious'].includes(violation.impact),
    );

    expect(
      graves,
      graves.map((v) => `${v.id}: ${v.description}`).join('\n'),
    ).toEqual([]);
  });
});
