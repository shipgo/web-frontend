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
 * Intenta extraer resourceType + resourceId de action_url ("shipgo://viaje/123" o "/viaje/123").
 * Retorna { resourceType, resourceId } o null si no hay match o el ID no es numérico.
 * Nunca retorna URLs crudas: sólo devuelve valores validados que van a RESOURCE_TO_PATH.
 * Solo acepta esquemas seguros: shipgo://, http://, https://, o rutas relativas (/).
 */
export const parseActionUrl = (actionUrl) => {
  if (typeof actionUrl !== 'string') return null;
  // Solo aceptar: shipgo://..., http://..., https://..., o /... (ruta relativa)
  if (!/(^shipgo:\/\/|^https?:\/\/|^\/)/i.test(actionUrl)) {
    return null;
  }
  const match = actionUrl.match(/([a-zA-Z]+)\/(\d+)\/?$/);
  if (!match) return null;
  return { resourceType: match[1], resourceId: match[2] };
};

/**
 * Ruta del panel a la que navegar al hacer click en una notificación, o `null`
 * si no hay recurso asociado / el tipo no se abre desde la web.
 */
export const notificacionHref = (notificacion) => {
  const data = parseNotificacionData(notificacion);

  let resourceType = data.resource_type;
  let resourceId = data.resource_id;

  // Fallback 1: derivar de `action_url` ("shipgo://viaje/123" o "/viaje/123")
  // cuando resourceType o resourceId faltan.
  if ((!resourceType || resourceId == null) && data.action_url) {
    const parsed = parseActionUrl(data.action_url);
    if (parsed) {
      resourceType = resourceType || parsed.resourceType;
      resourceId = resourceId == null ? parsed.resourceId : resourceId;
    }
  }

  if (resourceType == null || resourceId == null || resourceId === '') return null;

  const build = RESOURCE_TO_PATH[String(resourceType).toLowerCase()];

  // Fallback 2: si resourceType no está mapeado pero action_url existe,
  // intentar parsear action_url para extraer el destino navegable.
  // Ej: resourceType="recorrido" (no mapeado) + actionUrl="shipgo://viaje/123"
  // → parseamos viaje/123 y lo resolvemos.
  if (!build && data.action_url) {
    const parsed = parseActionUrl(data.action_url);
    if (parsed) {
      const altBuild = RESOURCE_TO_PATH[String(parsed.resourceType).toLowerCase()];
      if (altBuild) {
        return altBuild(parsed.resourceId);
      }
    }
  }

  return build ? build(resourceId) : null;
};
