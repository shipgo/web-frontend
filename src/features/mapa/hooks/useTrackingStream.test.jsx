import { act, renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@api/tracking.api', () => ({
  trackingApi: { getStreamUrl: () => 'http://test/api/tracking/stream' },
}));

import { useTrackingStream } from './useTrackingStream';

class MockEventSource {
  constructor(url, opts) {
    this.url = url;
    this.opts = opts;
    this.listeners = {};
    this.closed = false;
    this.onopen = null;
    this.onerror = null;
    MockEventSource.instances.push(this);
  }

  addEventListener(type, cb) {
    (this.listeners[type] ??= []).push(cb);
  }

  close() {
    this.closed = true;
  }

  emit(type, data) {
    (this.listeners[type] ?? []).forEach((cb) => cb({ data: JSON.stringify(data) }));
  }
}
MockEventSource.instances = [];

let queryClient;
const wrapper = ({ children }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

beforeEach(() => {
  queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  MockEventSource.instances = [];
  globalThis.EventSource = MockEventSource;
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('useTrackingStream', () => {
  it('arranca en "connecting" y pasa a "open" cuando el EventSource abre', () => {
    const { result } = renderHook(() => useTrackingStream(), { wrapper });

    expect(result.current.status).toBe('connecting');

    act(() => {
      MockEventSource.instances[0].onopen();
    });

    expect(result.current.status).toBe('open');
  });

  it('procesa location-update / viaje-iniciado / viaje-finalizado', () => {
    const { result } = renderHook(() => useTrackingStream(), { wrapper });
    const emitter = MockEventSource.instances[0];

    act(() => {
      emitter.emit('location-update', { viajeId: 1, latitud: -34, longitud: -58 });
    });
    expect(result.current.locationsByViajeId[1]).toEqual({
      viajeId: 1,
      latitud: -34,
      longitud: -58,
    });

    act(() => {
      emitter.emit('viaje-iniciado', {});
    });
    expect(result.current.viajesNuevosTick).toBe(1);

    act(() => {
      emitter.emit('viaje-finalizado', { viajeId: 1 });
    });
    expect(result.current.viajesFinalizados.has(1)).toBe(true);
    expect(result.current.locationsByViajeId[1]).toBeUndefined();
  });

  it('reconecta con backoff cuando el EventSource corta, y refetchea al reabrir', () => {
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
    const { result } = renderHook(() => useTrackingStream(), { wrapper });

    act(() => {
      MockEventSource.instances[0].onopen();
    });
    expect(result.current.status).toBe('open');

    act(() => {
      MockEventSource.instances[0].onerror();
    });
    expect(result.current.status).toBe('error');
    expect(MockEventSource.instances[0].closed).toBe(true);
    // No reconecta todavía: espera el primer backoff (1s).
    expect(MockEventSource.instances).toHaveLength(1);

    act(() => {
      vi.advanceTimersByTime(999);
    });
    expect(MockEventSource.instances).toHaveLength(1);

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(result.current.status).toBe('connecting');
    expect(MockEventSource.instances).toHaveLength(2);

    const tickAntes = result.current.viajesNuevosTick;
    act(() => {
      MockEventSource.instances[1].onopen();
    });

    expect(result.current.status).toBe('open');
    expect(result.current.viajesNuevosTick).toBe(tickAntes + 1);
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['ultima-ubicacion'] });
  });

  it('no dispara el refetch de reconexión en la conexión inicial', () => {
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
    const { result } = renderHook(() => useTrackingStream(), { wrapper });

    act(() => {
      MockEventSource.instances[0].onopen();
    });

    expect(result.current.viajesNuevosTick).toBe(0);
    expect(invalidateSpy).not.toHaveBeenCalled();
  });

  it('dobla el delay de backoff en errores consecutivos, con un tope', () => {
    renderHook(() => useTrackingStream(), { wrapper });

    // 1er corte -> reintenta a los 1000ms.
    act(() => {
      MockEventSource.instances[0].onerror();
    });
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(MockEventSource.instances).toHaveLength(2);

    // 2do corte -> reintenta a los 2000ms (no antes).
    act(() => {
      MockEventSource.instances[1].onerror();
    });
    act(() => {
      vi.advanceTimersByTime(1999);
    });
    expect(MockEventSource.instances).toHaveLength(2);
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(MockEventSource.instances).toHaveLength(3);
  });

  it('cierra el EventSource y cancela el reintento pendiente al desmontar', () => {
    const { unmount } = renderHook(() => useTrackingStream(), { wrapper });

    act(() => {
      MockEventSource.instances[0].onerror();
    });

    unmount();

    // Si el timeout de reconexión no se hubiese cancelado, esto crearía una
    // nueva instancia después de desmontado.
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(MockEventSource.instances).toHaveLength(1);
    expect(MockEventSource.instances[0].closed).toBe(true);
  });
});
