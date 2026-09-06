import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Router } from 'wouter';
import { memoryLocation } from 'wouter/memory-location';

const mockUseAuth = vi.fn();
const mockGetMias = vi.fn();

vi.mock('@contexts/auth', () => ({
  useAuth: () => mockUseAuth(),
}));

// `usePushNotifications` importa el SDK — lo mockeamos para no cargarlo en jsdom.
vi.mock('react-onesignal', () => ({
  default: {
    init: vi.fn().mockResolvedValue(undefined),
    Notifications: {
      isPushSupported: () => false,
      permission: false,
      permissionNative: 'default',
      requestPermission: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    },
    User: {
      PushSubscription: {
        id: undefined,
        optedIn: undefined,
        optIn: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      },
    },
  },
}));

vi.mock('@api/catalogs.api', () => ({
  notificacionesApi: {
    getMias: (...args) => mockGetMias(...args),
    save: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

import NotificacionesBell from './NotificacionesBell';

const renderBell = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const { hook } = memoryLocation({ path: '/' });

  return render(
    <QueryClientProvider client={queryClient}>
      <MantineProvider>
        <Router hook={hook}>
          <NotificacionesBell />
        </Router>
      </MantineProvider>
    </QueryClientProvider>,
  );
};

describe('NotificacionesBell — gate de rol', () => {
  beforeEach(() => {
    mockUseAuth.mockReset();
    mockGetMias.mockReset();
    mockGetMias.mockResolvedValue([]);
  });

  it('renderiza la campana para un ADMIN', async () => {
    mockUseAuth.mockReturnValue({
      user: { authorities: [{ name: 'ROLE_ADMIN' }] },
    });
    renderBell();

    expect(await screen.findByLabelText('Notificaciones')).toBeInTheDocument();
  });

  it('renderiza la campana para un SUPERUSER', async () => {
    mockUseAuth.mockReturnValue({
      user: { authorities: [{ name: 'ROLE_SUPERUSER' }] },
    });
    renderBell();

    expect(await screen.findByLabelText('Notificaciones')).toBeInTheDocument();
  });

  it('no renderiza nada para un CHOFER (no opera la web)', () => {
    mockUseAuth.mockReturnValue({
      user: { authorities: [{ name: 'ROLE_CHOFER' }] },
    });
    renderBell();

    expect(screen.queryByLabelText('Notificaciones')).not.toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('no consulta la API si el rol no está habilitado', async () => {
    mockUseAuth.mockReturnValue({
      user: { authorities: [{ name: 'ROLE_CUSTOMER' }] },
    });
    renderBell();

    await waitFor(() => expect(mockGetMias).not.toHaveBeenCalled());
  });
});
