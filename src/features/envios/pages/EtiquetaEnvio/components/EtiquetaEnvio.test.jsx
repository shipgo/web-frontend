import { render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('react-qr-code', () => ({
  default: ({ value, title }) => <svg data-testid="qr" data-value={value} aria-label={title} />,
}));

import EtiquetaEnvio from './EtiquetaEnvio';

const FECHA = new Date(2026, 10, 17, 14, 32);

const ENVIO = {
  id: 9,
  nombre: 'Lucía',
  apellido: 'Fernández',
  dni: '30111222',
  email: 'lucia@example.com',
  prefijo: '351',
  telefono: '5550142',
  codigoSeguimiento: 'SHG-ABC123',
  tipoEntrega: 'domicilio',
  peso: 4.2,
  sucursalOrigen: {
    id: 2,
    nombre: 'Sucursal Córdoba Centro',
    puntoEntrega: { nombreCalle: 'Av. Colón', numeroCalle: '480', localidad: { nombre: 'Córdoba' } },
  },
  destino: {
    nombreCalle: 'Av. Colón',
    numeroCalle: '1250',
    piso: '4',
    departamento: 'B',
    localidad: { nombre: 'Córdoba', provincia: { nombre: 'Córdoba' } },
  },
  detalleEnvios: [{ cantidad: 2, nombre: 'Taladro percutor' }],
};

const SUCURSAL_ENTREGA = {
  nombre: 'Rosario Norte',
  puntoEntrega: {
    nombreCalle: 'Bv. Oroño',
    numeroCalle: '2480',
    localidad: { nombre: 'Rosario', provincia: { nombre: 'Santa Fe' } },
  },
};

const renderEtiqueta = (envio = {}) =>
  render(<EtiquetaEnvio envio={{ ...ENVIO, ...envio }} fechaImpresion={FECHA} />);

const items = (n) =>
  Array.from({ length: n }, (_, i) => ({ cantidad: i + 1, nombre: `Item ${i + 1}` }));

describe('EtiquetaEnvio (componente)', () => {
  it('domicilio: tipo de entrega y bloque HASTA con calle, piso/depto, localidad, provincia y teléfono', () => {
    const { container } = renderEtiqueta();
    const etiqueta = screen.getByTestId('etiqueta-envio');

    expect(within(etiqueta).getByText('A DOMICILIO')).toBeInTheDocument();
    const hasta = container.querySelector('.etiqueta-envio__hasta');
    expect(within(hasta).getByText('Hasta')).toBeInTheDocument();
    expect(within(hasta).getByText('Lucía Fernández')).toBeInTheDocument();
    expect(within(hasta).getByText('Av. Colón 1250, 4° B')).toBeInTheDocument();
    expect(container.querySelector('.etiqueta-envio__ciu').textContent).toBe('CórdobaCórdoba');
    expect(within(hasta).getByText('Tel. 351 5550142')).toBeInTheDocument();
  });

  it('muestra DESDE con nombre y dirección de la sucursal de origen', () => {
    const { container } = renderEtiqueta();
    const desde = container.querySelector('.etiqueta-envio__desde');
    expect(within(desde).getByText('Sucursal Córdoba Centro')).toBeInTheDocument();
    expect(within(desde).getByText('Av. Colón 480')).toBeInTheDocument();
  });

  it('DESDE sin puntoEntrega muestra solo el nombre', () => {
    const { container } = renderEtiqueta({ sucursalOrigen: { nombre: 'Sucursal Norte' } });
    const desde = container.querySelector('.etiqueta-envio__desde');
    expect(desde.querySelector('em')).toBeNull();
    expect(within(desde).getByText('Sucursal Norte')).toBeInTheDocument();
  });

  it('retiro en sucursal: prefijo "Sucursal ", dirección, "Retira: ..." y localidad de la sucursal', () => {
    const { container } = renderEtiqueta({ tipoEntrega: 'sucursal', sucursalEntrega: SUCURSAL_ENTREGA });
    const etiqueta = screen.getByTestId('etiqueta-envio');
    const hasta = container.querySelector('.etiqueta-envio__hasta');

    expect(within(etiqueta).getByText('RETIRO EN SUCURSAL')).toBeInTheDocument();
    expect(within(hasta).getByText('Hasta · retiro en sucursal')).toBeInTheDocument();
    expect(within(hasta).getByText('Sucursal Rosario Norte')).toBeInTheDocument();
    expect(within(hasta).getByText('Bv. Oroño 2480')).toBeInTheDocument();
    expect(within(hasta).getByText('Retira: Lucía Fernández')).toBeInTheDocument();
    expect(container.querySelector('.etiqueta-envio__ciu').textContent).toBe('RosarioSanta Fe');
  });

  it('retiro en sucursal: no duplica el prefijo si el nombre ya empieza con "Sucursal"', () => {
    const { container } = renderEtiqueta({
      tipoEntrega: 'sucursal',
      sucursalEntrega: { ...SUCURSAL_ENTREGA, nombre: 'SUCURSAL Rosario Norte' },
    });
    const hasta = container.querySelector('.etiqueta-envio__hasta');
    expect(within(hasta).getByText('SUCURSAL Rosario Norte')).toBeInTheDocument();
    expect(hasta.textContent).not.toMatch(/Sucursal SUCURSAL/i);
  });

  it('QR con payload solo el código de seguimiento', () => {
    renderEtiqueta();
    expect(screen.getByTestId('qr')).toHaveAttribute('data-value', 'SHG-ABC123');
  });

  it('no imprime el código en texto, ni palabra de entrega, DNI o email', () => {
    renderEtiqueta({ palabraEntrega: 'LUNA-PERRO', tienePalabraEntrega: true });
    const texto = screen.getByTestId('etiqueta-envio').textContent;
    expect(texto).not.toContain('SHG-ABC123');
    expect(texto).not.toMatch(/palabra|LUNA-PERRO/i);
    expect(texto).not.toContain('30111222');
    expect(texto).not.toContain('lucia@example.com');
    expect(texto).not.toMatch(/undefined|null/);
  });

  it('peso con coma decimal, y se oculta si no hay', () => {
    const { unmount } = renderEtiqueta();
    expect(screen.getByText('4,2 kg')).toBeInTheDocument();
    unmount();

    renderEtiqueta({ peso: null });
    expect(screen.queryByText('Peso')).not.toBeInTheDocument();
  });

  it('contenido con 1 ítem', () => {
    renderEtiqueta();
    expect(screen.getByText('2 × Taladro percutor')).toBeInTheDocument();
    expect(screen.queryByText(/más$/)).not.toBeInTheDocument();
  });

  it('contenido con 3 ítems: sin línea "+N más"', () => {
    renderEtiqueta({ detalleEnvios: items(3) });
    expect(screen.getAllByRole('listitem')).toHaveLength(3);
    expect(screen.queryByText(/más$/)).not.toBeInTheDocument();
  });

  it('contenido con 5 ítems: 3 líneas y "+2 más"', () => {
    renderEtiqueta({ detalleEnvios: items(5) });
    expect(screen.getAllByRole('listitem')).toHaveLength(4);
    expect(screen.getByText('3 × Item 3')).toBeInTheDocument();
    expect(screen.queryByText('4 × Item 4')).not.toBeInTheDocument();
    expect(screen.getByText('+2 más')).toBeInTheDocument();
  });

  it('usa descripcion si el nombre viene vacío, y sin ítems no muestra el bloque', () => {
    const { unmount } = renderEtiqueta({ detalleEnvios: [{ cantidad: 3, nombre: '', descripcion: 'Guantes' }] });
    expect(screen.getByText('3 × Guantes')).toBeInTheDocument();
    unmount();

    renderEtiqueta({ detalleEnvios: [] });
    expect(screen.queryByText('Contenido')).not.toBeInTheDocument();
  });

  it('pie con leyenda y fecha de impresión es-AR', () => {
    renderEtiqueta();
    expect(screen.getByText('Seguí tu envío en ShipGO!')).toBeInTheDocument();
    expect(screen.getByText('Impresa 17/11/2026 14:32')).toBeInTheDocument();
  });

  it('respeta el testId por prop', () => {
    render(<EtiquetaEnvio envio={ENVIO} testId="otra" fechaImpresion={FECHA} />);
    expect(screen.getByTestId('otra')).toBeInTheDocument();
  });
});
