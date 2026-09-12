import { describe, expect, it, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';

import { renderWithProviders } from '../../test/renderWithProviders';

const mockUseAuth = vi.fn();
vi.mock('@contexts/auth', () => ({
  useAuth: () => mockUseAuth(),
}));

import PublicLayout from './PublicLayout';

describe('PublicLayout', () => {
  beforeEach(() => {
    mockUseAuth.mockReset();
    mockUseAuth.mockReturnValue({ user: null, isAuthenticated: false });
  });

  it('renderiza branding, contenido y footer sin navbar de admin', () => {
    renderWithProviders(
      <PublicLayout>
        <p>contenido publico</p>
      </PublicLayout>,
    );

    expect(screen.getByText('contenido publico')).toBeInTheDocument();
    expect(screen.getByAltText('ShipGo')).toBeInTheDocument();
    expect(screen.getByText(/seguimiento de envíos/i)).toBeInTheDocument();
  });

  // SHG-FE-054: sin `homeHref` explícito, el wordmark linkea a la landing
  // pública sin sesión, o al home por rol si ya hay sesión (`/tracking` es
  // accesible con o sin sesión, así que este layout no puede asumir ninguna).

  it('sin sesión, el wordmark linkea a la landing pública (/)', () => {
    mockUseAuth.mockReturnValue({ user: null, isAuthenticated: false });
    renderWithProviders(
      <PublicLayout>
        <p>contenido</p>
      </PublicLayout>,
    );

    expect(
      screen.getByRole('link', { name: /shipgo — inicio/i }),
    ).toHaveAttribute('href', '/');
  });

  it('con sesión (ADMIN), el wordmark linkea al home por rol', () => {
    mockUseAuth.mockReturnValue({
      user: { authorities: [{ name: 'ROLE_ADMIN' }] },
      isAuthenticated: true,
    });
    renderWithProviders(
      <PublicLayout>
        <p>contenido</p>
      </PublicLayout>,
    );

    expect(
      screen.getByRole('link', { name: /shipgo — inicio/i }),
    ).toHaveAttribute('href', '/');
  });

  it('con sesión (CUSTOMER), el wordmark linkea al home del portal', () => {
    mockUseAuth.mockReturnValue({
      user: { authorities: [{ name: 'ROLE_CUSTOMER' }] },
      isAuthenticated: true,
    });
    renderWithProviders(
      <PublicLayout>
        <p>contenido</p>
      </PublicLayout>,
    );

    expect(
      screen.getByRole('link', { name: /shipgo — inicio/i }),
    ).toHaveAttribute('href', '/portal/envios');
  });

  it('un `homeHref` explícito (ej. PortalLayout) siempre pisa el default por sesión', () => {
    mockUseAuth.mockReturnValue({
      user: { authorities: [{ name: 'ROLE_CUSTOMER' }] },
      isAuthenticated: true,
    });
    renderWithProviders(
      <PublicLayout homeHref="~/portal/envios">
        <p>contenido</p>
      </PublicLayout>,
    );

    // El `Link` de wouter resuelve/quita el prefijo `~` (fuerza ruta
    // absoluta) al armar el `href` final — ver `PortalLayout`, que pasa
    // `homeHref` con ese mismo prefijo por vivir dentro de un `nest`.
    expect(
      screen.getByRole('link', { name: /shipgo — inicio/i }),
    ).toHaveAttribute('href', '/portal/envios');
  });
});
