import { describe, expect, it } from 'vitest';

import { notificacionHref, parseNotificacionData, parseActionUrl } from './constants';

describe('parseNotificacionData', () => {
  it('parsea el string JSON de `data`', () => {
    const notif = { data: '{"resource_type":"viaje","resource_id":12}' };
    expect(parseNotificacionData(notif)).toEqual({
      resource_type: 'viaje',
      resource_id: 12,
    });
  });

  it('devuelve {} si `data` es null, vacío o JSON inválido', () => {
    expect(parseNotificacionData({ data: null })).toEqual({});
    expect(parseNotificacionData({ data: '' })).toEqual({});
    expect(parseNotificacionData({ data: 'no-json' })).toEqual({});
    expect(parseNotificacionData(null)).toEqual({});
  });

  it('acepta `data` ya como objeto', () => {
    expect(parseNotificacionData({ data: { resource_id: 1 } })).toEqual({
      resource_id: 1,
    });
  });
});

describe('notificacionHref', () => {
  it('mapea resource_type + resource_id a la ruta del panel', () => {
    expect(
      notificacionHref({ data: '{"resource_type":"viaje","resource_id":7}' }),
    ).toBe('/viajes/7');
    expect(
      notificacionHref({ data: '{"resource_type":"envio","resource_id":3}' }),
    ).toBe('/envios/3');
    expect(
      notificacionHref({ data: '{"resource_type":"usuario","resource_id":9}' }),
    ).toBe('/usuarios/9');
  });

  it('deriva el recurso de action_url tipo deep link', () => {
    expect(
      notificacionHref({ data: '{"action_url":"shipgo://viaje/42"}' }),
    ).toBe('/viajes/42');
  });

  it('devuelve null si no hay recurso o el tipo no se abre en la web', () => {
    expect(notificacionHref({ data: null })).toBeNull();
    expect(
      notificacionHref({ data: '{"resource_type":"chofer","resource_id":1}' }),
    ).toBeNull();
    expect(notificacionHref({ data: '{"resource_type":"viaje"}' })).toBeNull();
  });

  it('usa action_url como fallback cuando resourceType no está mapeado', () => {
    // Caso real: RECORRIDO_FINALIZADO_PROBLEMAS (SHG-BE-049)
    // resourceType="recorrido" no está en RESOURCE_TO_PATH,
    // pero actionUrl="shipgo://viaje/<id>" apunta a un recurso navegable.
    expect(
      notificacionHref({
        data: '{"resource_type":"recorrido","resource_id":2,"action_url":"shipgo://viaje/123"}',
      }),
    ).toBe('/viajes/123');
  });

  it('los tipos mapeados siguen funcionando igual (no se regresan con action_url)', () => {
    // Verificar que cuando tenemos un tipo mapeado + action_url,
    // seguimos usando resource_type + resource_id (no action_url).
    expect(
      notificacionHref({
        data: '{"resource_type":"viaje","resource_id":7,"action_url":"shipgo://envio/999"}',
      }),
    ).toBe('/viajes/7');
  });

  it('action_url con ID no numérico → null', () => {
    expect(
      notificacionHref({ data: '{"action_url":"shipgo://viaje/abc"}' }),
    ).toBeNull();
    expect(
      notificacionHref({ data: '{"action_url":"shipgo://viaje/123abc"}' }),
    ).toBeNull();
  });

  it('recurso no mapeado ni vía action_url → null', () => {
    // resourceType="factura" no está en RESOURCE_TO_PATH
    // action_url apunta a shipgo://factura/123 (también unmapped)
    expect(
      notificacionHref({
        data: '{"resource_type":"factura","resource_id":1,"action_url":"shipgo://factura/123"}',
      }),
    ).toBeNull();
  });

  it('nunca devuelve URLs crudas: javascript:alert(1) es ignorado, /viajes/123 se resuelve', () => {
    // Validar que parseActionUrl no acepta URLs peligrosas
    // El regex solo extrae resourceType (letras) + ID (dígitos),
    // así que javascript:alert(1)//viaje/123 no matchea
    // (porque no comienza con letras seguidas de / y dígitos)
    expect(
      notificacionHref({
        data: '{"action_url":"javascript:alert(1)//viaje/123"}',
      }),
    ).toBeNull();
  });
});

describe('parseActionUrl', () => {
  it('extrae resourceType e ID numérico de action_url válida', () => {
    expect(parseActionUrl('shipgo://viaje/42')).toEqual({
      resourceType: 'viaje',
      resourceId: '42',
    });
    expect(parseActionUrl('/envio/999')).toEqual({
      resourceType: 'envio',
      resourceId: '999',
    });
    expect(parseActionUrl('https://shipgo.app/viaje/123')).toEqual({
      resourceType: 'viaje',
      resourceId: '123',
    });
  });

  it('devuelve null para action_url con ID no numérico', () => {
    expect(parseActionUrl('shipgo://viaje/abc')).toBeNull();
    expect(parseActionUrl('shipgo://viaje/123abc')).toBeNull();
  });

  it('devuelve null para action_url sin estructura esperada', () => {
    expect(parseActionUrl('shipgo://viaje')).toBeNull();
    expect(parseActionUrl('shipgo://123')).toBeNull();
    expect(parseActionUrl('javascript:alert(1)//viaje/123')).toBeNull();
    expect(parseActionUrl(null)).toBeNull();
    expect(parseActionUrl(undefined)).toBeNull();
    expect(parseActionUrl('')).toBeNull();
  });
});
