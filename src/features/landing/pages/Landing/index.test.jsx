import { afterEach, describe, expect, it } from 'vitest';
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

  it('el header ofrece el menú "Ingresar" con las dos entradas', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LandingPage />);

    await user.click(screen.getByRole('button', { name: /ingresar/i }));

    const items = await screen.findAllByRole('menuitem', { hidden: true });
    expect(items.map((item) => [item.textContent, item.getAttribute('href')])).toEqual([
      ['Soy cliente', '/portal/ingresar'],
      ['Soy del equipo', '/login'],
    ]);
  });

  describe('en mobile', () => {
    const originalMatchMedia = window.matchMedia;
    afterEach(() => {
      window.matchMedia = originalMatchMedia;
    });
    const mockMobile = () => {
      window.matchMedia = (query) => ({
        matches: true,
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
      });
    };

    it('el hero trae el campo de seguimiento (una sola vez) y navega al enviar', async () => {
      mockMobile();
      const user = userEvent.setup();
      renderWithProviders(<LandingPage />);

      expect(
        screen.getByRole('heading', { level: 1, name: /seguí tu envío con el código/i }),
      ).toBeInTheDocument();
      expect(screen.getAllByLabelText(/código de seguimiento/i)).toHaveLength(1);
      expect(screen.getByRole('link', { name: /creá tu cuenta/i })).toHaveAttribute(
        'href',
        '/registro',
      );

      await user.type(screen.getByLabelText(/código de seguimiento/i), '7K2M9QX4TP');
      await user.click(screen.getByRole('button', { name: /consultar/i }));
      await waitFor(() => {
        expect(window.location.pathname).toBe('/tracking/7K2M9QX4TP');
      });
    });

    it('los accesos son 2 filas compactas: cliente y equipo', () => {
      mockMobile();
      renderWithProviders(<LandingPage />);

      expect(screen.getByRole('link', { name: /soy cliente/i })).toHaveAttribute(
        'href',
        '/portal/ingresar',
      );
      expect(screen.getByRole('link', { name: /soy del equipo/i })).toHaveAttribute(
        'href',
        '/login',
      );
    });

    it('los créditos de las fotos están plegados detrás de un enlace', async () => {
      mockMobile();
      const user = userEvent.setup();
      renderWithProviders(<LandingPage />);

      const toggle = screen.getByRole('button', { name: /créditos de las fotos/i });
      expect(toggle).toHaveAttribute('aria-expanded', 'false');
      await user.click(toggle);
      expect(toggle).toHaveAttribute('aria-expanded', 'true');
      expect(await screen.findByRole('link', { name: 'Arum Visuals' })).toBeInTheDocument();
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
