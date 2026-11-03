import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';

import { renderWithProviders } from '../../../../test/renderWithProviders';
import VerificarCuentaPage from './index';

describe('VerificarCuentaPage', () => {
  it('sin token ("Enlace incompleto") ofrece acciones para volver', () => {
    renderWithProviders(<VerificarCuentaPage />, { route: '/registro/verificar' });

    expect(screen.getByText('Enlace incompleto')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Volver al registro' })).toHaveAttribute('href', '/registro');
    expect(screen.getByRole('link', { name: 'Iniciar sesión' })).toHaveAttribute('href', '/login');
  });
});
