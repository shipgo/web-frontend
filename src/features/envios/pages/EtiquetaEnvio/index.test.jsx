import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Route } from 'wouter';

import { renderWithProviders } from '../../../../test/renderWithProviders';

vi.mock('@api', () => ({
  envioApi: {
    getById: vi.fn(),
  },
}));

import { envioApi } from '@api';
import EtiquetaEnvio from './index';

const ENVIO = {
  id: 9,
  nombre: 'Juan',
  apellido: 'García',
  codigoSeguimiento: 'SHG-ABC123',
  tipoEntrega: 'domicilio',
  sucursalOrigen: { id: 2, nombre: 'Sucursal Norte' },
  destino: {
    nombreCalle: 'Av. Colón',
    numeroCalle: '1234',
    localidad: { nombre: 'Córdoba', provincia: { nombre: 'Córdoba' } },
  },
};

const renderPage = () =>
  renderWithProviders(<Route path="/envios/:id/etiqueta" component={EtiquetaEnvio} />, {
    route: '/envios/9/etiqueta',
  });

describe('EtiquetaEnvio', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    envioApi.getById.mockResolvedValue(ENVIO);
    window.print = vi.fn();
  });

  it('muestra QR, código y datos de apoyo, e imprime con window.print', async () => {
    const user = userEvent.setup();
    renderPage();

    const etiqueta = await screen.findByTestId('etiqueta-envio');
    expect(envioApi.getById).toHaveBeenCalledWith('9');
    expect(within(etiqueta).getByText('SHG-ABC123')).toBeInTheDocument();
    expect(etiqueta.querySelector('svg')).toBeInTheDocument();
    expect(within(etiqueta).getByText('Juan García')).toBeInTheDocument();
    expect(within(etiqueta).getByText(/Av\. Colón 1234/)).toBeInTheDocument();
    expect(within(etiqueta).getByText('Sucursal Norte')).toBeInTheDocument();
    expect(etiqueta.textContent).not.toMatch(/undefined/);

    await user.click(screen.getByRole('button', { name: /Imprimir/ }));
    expect(window.print).toHaveBeenCalledTimes(1);
  });

  it('retiro en sucursal: muestra la sucursal de retiro', async () => {
    envioApi.getById.mockResolvedValue({
      ...ENVIO,
      tipoEntrega: 'sucursal',
      sucursalEntrega: { nombre: 'Sucursal Sur' },
    });
    renderPage();

    const etiqueta = await screen.findByTestId('etiqueta-envio');
    expect(within(etiqueta).getByText('Retiro en sucursal')).toBeInTheDocument();
    expect(within(etiqueta).getByText('Sucursal Sur')).toBeInTheDocument();
  });

  it('sin codigoSeguimiento: mensaje claro y sin botón Imprimir', async () => {
    envioApi.getById.mockResolvedValue({ ...ENVIO, codigoSeguimiento: null });
    renderPage();

    expect(await screen.findByText('Sin código de seguimiento')).toBeInTheDocument();
    expect(screen.queryByTestId('etiqueta-envio')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Imprimir/ })).not.toBeInTheDocument();
  });
});
