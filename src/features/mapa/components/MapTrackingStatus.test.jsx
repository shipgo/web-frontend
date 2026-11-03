import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';

import MapTrackingStatus from './MapTrackingStatus';

const mockUseTracking = vi.fn();

vi.mock('../contexts/tracking', () => ({
  useTracking: (...args) => mockUseTracking(...args),
}));

const renderWithProviders = (ui) => render(<MantineProvider>{ui}</MantineProvider>);

describe('MapTrackingStatus', () => {
  beforeEach(() => {
    mockUseTracking.mockReset();
  });

  it('muestra "En vivo" cuando el stream está open', () => {
    mockUseTracking.mockReturnValue({ status: 'open' });
    renderWithProviders(<MapTrackingStatus />);
    expect(screen.getByText('En vivo')).toBeInTheDocument();
  });

  it('muestra "Reconectando…" cuando el stream está connecting', () => {
    mockUseTracking.mockReturnValue({ status: 'connecting' });
    renderWithProviders(<MapTrackingStatus />);
    expect(screen.getByText('Reconectando…')).toBeInTheDocument();
  });

  it('muestra "Sin señal" cuando el stream está en error', () => {
    mockUseTracking.mockReturnValue({ status: 'error' });
    renderWithProviders(<MapTrackingStatus />);
    expect(screen.getByText('Sin señal')).toBeInTheDocument();
  });
});
