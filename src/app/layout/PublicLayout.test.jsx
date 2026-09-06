import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';

import { renderWithProviders } from '../../test/renderWithProviders';
import PublicLayout from './PublicLayout';

describe('PublicLayout', () => {
  it('renderiza branding, contenido y footer sin navbar de admin', () => {
    renderWithProviders(
      <PublicLayout>
        <p>contenido publico</p>
      </PublicLayout>,
    );

    expect(screen.getByText('contenido publico')).toBeInTheDocument();
    expect(screen.getByAltText('ShipGo')).toBeInTheDocument();
    expect(screen.getByText(/seguimiento de envíos/i)).toBeInTheDocument();
    // El wordmark linkea al inicio público por defecto.
    expect(
      screen.getByRole('link', { name: /shipgo — inicio/i }),
    ).toHaveAttribute('href', '/tracking');
  });
});
