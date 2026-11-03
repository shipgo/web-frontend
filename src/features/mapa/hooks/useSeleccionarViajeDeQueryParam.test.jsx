import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

import SelectedViajeProvider from '../providers/selectedViaje';
import { useSelectedViaje } from '../contexts/selectedViaje';
import { useSeleccionarViajeDeQueryParam } from './useSeleccionarViajeDeQueryParam';

const Harness = () => {
  useSeleccionarViajeDeQueryParam();
  const { selectedViajeId } = useSelectedViaje();
  return <div data-testid="selected-viaje-id">{String(selectedViajeId)}</div>;
};

const renderConQuery = (search) => {
  window.history.pushState({}, '', `/mapa${search}`);
  return render(
    <SelectedViajeProvider>
      <Harness />
    </SelectedViajeProvider>,
  );
};

describe('useSeleccionarViajeDeQueryParam (SHG-FE-096)', () => {
  it('preselecciona el viaje pasado por ?viaje= al montar', () => {
    renderConQuery('?viaje=42');

    expect(screen.getByTestId('selected-viaje-id')).toHaveTextContent('42');
  });

  it('sin ?viaje= no toca la selección (queda sin viaje seleccionado)', () => {
    renderConQuery('');

    expect(screen.getByTestId('selected-viaje-id')).toHaveTextContent('null');
  });

  it('ignora un ?viaje= no numérico', () => {
    renderConQuery('?viaje=no-es-un-id');

    expect(screen.getByTestId('selected-viaje-id')).toHaveTextContent('null');
  });
});
