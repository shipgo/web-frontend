import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import OneSignal from 'react-onesignal';

import { useAuthStore } from '@stores/auth.store';

import { NOTIFICACIONES_QUERY_KEY } from '../constants';

const APP_ID = import.meta.env.VITE_ONESIGNAL_APP_ID;

// `OneSignal.init` sólo puede correr una vez por vida de la página. Guardamos la
// promesa para que remounts / StrictMode no re-inicialicen.
let initPromise = null;

const ensureInit = () => {
  if (!initPromise) {
    initPromise = OneSignal.init({
      appId: APP_ID,
      allowLocalhostAsSecureOrigin: true,
    });
  }
  return initPromise;
};

const registrarToken = async (id) => {
  if (!id) return;
  try {
    await useAuthStore.getState().updateToken(id);
  } catch (error) {
    console.error('[notificaciones] no se pudo registrar el token push', error);
  }
};

/**
 * Inicializa OneSignal web tras el login y registra el player id del navegador
 * con `PUT /api/user/updateToken` (el backend usa ese valor como
 * `include_player_ids` al pushear — ver `OneSignalPushChannel`).
 *
 * Degradación: si falta `VITE_ONESIGNAL_APP_ID`, el navegador no soporta push, o
 * el usuario **bloquea** las notificaciones, no se rompe nada — la campana in-app
 * sigue andando por polling (`useNotificaciones`).
 *
 * Al recibir un push (foreground o click) se invalida la query de la campana
 * para que el contador y el listado se actualicen al instante.
 *
 * @param {{ enabled: boolean }} opts - `enabled` sólo para roles web (SU/AD).
 */
export const usePushNotifications = ({ enabled }) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!enabled) return undefined;

    if (!APP_ID) {
      console.info(
        '[notificaciones] VITE_ONESIGNAL_APP_ID sin configurar — push web ' +
          'deshabilitado, la campana funciona sólo in-app.',
      );
      return undefined;
    }

    let cancelado = false;

    const invalidar = () =>
      queryClient.invalidateQueries({ queryKey: NOTIFICACIONES_QUERY_KEY });

    const onSubscriptionChange = (change) => {
      registrarToken(change?.current?.id);
    };

    const setup = async () => {
      try {
        if (!OneSignal.Notifications.isPushSupported()) return;

        await ensureInit();
        if (cancelado) return;

        OneSignal.Notifications.addEventListener('foregroundWillDisplay', invalidar);
        OneSignal.Notifications.addEventListener('click', invalidar);
        OneSignal.User.PushSubscription.addEventListener('change', onSubscriptionChange);

        // Permiso bloqueado por el usuario → sólo in-app, sin pedir de nuevo.
        if (OneSignal.Notifications.permissionNative === 'denied') return;

        if (!OneSignal.Notifications.permission) {
          await OneSignal.Notifications.requestPermission();
          if (cancelado) return;
        }

        if (!OneSignal.Notifications.permission) return;

        if (OneSignal.User.PushSubscription.optedIn === false) {
          await OneSignal.User.PushSubscription.optIn();
          if (cancelado) return;
        }

        await registrarToken(OneSignal.User.PushSubscription.id);
      } catch (error) {
        console.error(
          '[notificaciones] init de OneSignal falló — degradando a sólo in-app',
          error,
        );
      }
    };

    setup();

    return () => {
      cancelado = true;
      try {
        OneSignal.Notifications.removeEventListener('foregroundWillDisplay', invalidar);
        OneSignal.Notifications.removeEventListener('click', invalidar);
        OneSignal.User.PushSubscription.removeEventListener('change', onSubscriptionChange);
      } catch {
        /* OneSignal puede no estar inicializado si el init falló; nada que limpiar */
      }
    };
  }, [enabled, queryClient]);
};
