/**
 * Notificaciones in-app — helpers de dominio (SHG-FE-027).
 *
 * El backend (`NotificacionesController` + `UnifiedNotificationService`) devuelve
 * la entidad `Notificacion` cruda:
 *   { id, title, body, data, visto, fecha, usuario }
 * `data` es un **string JSON** (o `null`) armado por `UnifiedNotificationService`
 * a partir del `NotificationMessage`:
 *   { action_url: "shipgo://viaje/123", resource_type: "viaje", resource_id: 123, ...extra }
 * Ver `planning/NOTIFICATIONS.md`.
 */

/** Query key única de la lista de notificaciones del usuario logueado. */
export const NOTIFICACIONES_QUERY_KEY = ['notificaciones'];

/** Refetch de respaldo (además del invalidate al recibir un push). */
export const NOTIFICACIONES_REFETCH_MS = 60_000;

/**
 * `resource_type` del backend → ruta del panel web. CHOFER/CARGA no operan la web
 * (`CONTRACTS.md §3`), así que sólo mapeamos los recursos que un SUPERUSER/ADMIN
 * puede abrir acá.
 */
const RESOURCE_TO_PATH = {
  viaje: (id) => `/viajes/${id}`,
  envio: (id) => `/envios/${id}`,
  usuario: (id) => `/usuarios/${id}`,
};

/** Parsea el campo `data` (string JSON o ya objeto) a un objeto plano. */
export const parseNotificacionData = (notificacion) => {
  const raw = notificacion?.data;
  if (!raw) return {};
  if (typeof raw === 'object') return raw;
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    /* `data` no es JSON válido: la notificación igual se muestra, sin link */
    return {};
  }
};

/**
 * Ruta del panel a la que navegar al hacer click en una notificación, o `null`
 * si no hay recurso asociado / el tipo no se abre desde la web.
 */
export const notificacionHref = (notificacion) => {
  const data = parseNotificacionData(notificacion);

  let resourceType = data.resource_type;
  let resourceId = data.resource_id;

  // Fallback: derivar de `action_url` ("shipgo://viaje/123" o "/viaje/123").
  if ((!resourceType || resourceId == null) && typeof data.action_url === 'string') {
    const match = data.action_url.match(/([a-zA-Z]+)\/(\d+)\/?$/);
    if (match) {
      resourceType = resourceType || match[1];
      resourceId = resourceId == null ? match[2] : resourceId;
    }
  }

  if (resourceType == null || resourceId == null || resourceId === '') return null;

  const build = RESOURCE_TO_PATH[String(resourceType).toLowerCase()];
  return build ? build(resourceId) : null;
};
