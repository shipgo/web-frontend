import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import TrackingTimeline from '@features/tracking/components/TrackingTimeline';
import { renderWithProviders } from '../../../../../test/renderWithProviders';
import HistorialTimeline from './HistorialTimeline';

// SHG-FE-111: el historial muestra la hora local de Argentina tal cual llega,
// ordenada cronológicamente también al cruzar la medianoche.
describe('HistorialTimeline (viaje)', () => {
  it('muestra 23:30 y el cruce de día sin correr horas, en orden cronológico', () => {
    renderWithProviders(
      <HistorialTimeline
        historial={[
          { id: 2, estado: 'en_curso', fechaHoraInicio: '2026-10-08T00:10:00.000' },
          { id: 1, estado: 'planificado', fechaHoraInicio: '2026-10-07T23:30:00.000' },
        ]}
      />,
    );
    const fechas = screen.getAllByText(/\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}/).map((n) => n.textContent);
    expect(fechas).toEqual(['07/10/2026 23:30', '08/10/2026 00:10']);
  });
});

describe('TrackingTimeline (envío)', () => {
  it('muestra la fecha del tracking tal cual llega', () => {
    renderWithProviders(
      <TrackingTimeline historial={[{ estado: 'creado', fecha: '2026-10-07T23:30:15.123' }]} />,
    );
    expect(screen.getByText('07/10/2026 23:30')).toBeInTheDocument();
  });
});
