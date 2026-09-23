import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('@stores/auth.store', () => ({
  useAuthStore: { getState: () => ({ updateToken: vi.fn() }) },
}));

const { listeners, addEventListener, removeEventListener } = vi.hoisted(() => {
  const listeners = new Map();
  return {
    listeners,
    addEventListener: vi.fn((event, cb) => listeners.set(event, cb)),
    removeEventListener: vi.fn((event) => listeners.delete(event)),
  };
});

vi.mock('react-onesignal', () => ({
  default: {
    init: vi.fn(() => Promise.resolve()),
    Notifications: {
      isPushSupported: vi.fn(() => true),
      addEventListener,
      removeEventListener,
      permissionNative: 'granted',
      permission: true,
      requestPermission: vi.fn(() => Promise.resolve()),
    },
    User: {
      PushSubscription: {
        id: 'player-id',
        optedIn: true,
        optIn: vi.fn(() => Promise.resolve()),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      },
    },
  },
}));

/**
 * SHG-FE-073: se reportó que un push real nunca dispara la notificación
 * nativa del navegador/SO — sólo actualiza la campana in-app. Leyendo el
 * bundle real del SDK (`OneSignalSDK.sw.js` v16.06.10, el que sirve
 * `public/OneSignalSDKWorker.js`) se confirmó que el default — cuando
 * ningún listener de `foregroundWillDisplay` llama `event.preventDefault()`
 * — YA es mostrar la notificación nativa. Este test es un guardrail: si en
 * el futuro alguien "arregla" el handler llamando `preventDefault()` (por
 * ejemplo copiando mal un ejemplo de la doc de OneSignal para customizar el
 * payload), rompe silenciosamente el push a nivel de SO para todos.
 *
 * `APP_ID` se lee una sola vez al importar el módulo (`import.meta.env`), así
 * que cada test hace `vi.resetModules()` + import dinámico después de
 * `vi.stubEnv` para que el hook vea la env var ya seteada.
 */
describe('usePushNotifications', () => {
  beforeEach(() => {
    vi.resetModules();
    listeners.clear();
    addEventListener.mockClear();
    removeEventListener.mockClear();
  });

  const wrapper = ({ children }) => {
    const queryClient = new QueryClient();
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };

  it('registra el listener de foregroundWillDisplay sin llamar preventDefault() ni display()', async () => {
    vi.stubEnv('VITE_ONESIGNAL_APP_ID', 'test-app-id');
    const { usePushNotifications } = await import('./usePushNotifications');

    renderHook(() => usePushNotifications({ enabled: true }), { wrapper });

    await waitFor(() => expect(listeners.has('foregroundWillDisplay')).toBe(true));

    const event = {
      notification: { display: vi.fn() },
      preventDefault: vi.fn(),
    };

    listeners.get('foregroundWillDisplay')(event);

    expect(event.preventDefault).not.toHaveBeenCalled();
    expect(event.notification.display).not.toHaveBeenCalled();
  });

  it('enabled=false: no registra ningún listener de OneSignal', async () => {
    vi.stubEnv('VITE_ONESIGNAL_APP_ID', 'test-app-id');
    const { usePushNotifications } = await import('./usePushNotifications');

    renderHook(() => usePushNotifications({ enabled: false }), { wrapper });

    expect(addEventListener).not.toHaveBeenCalled();
  });
});
