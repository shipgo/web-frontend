import { describe, expect, it } from 'vitest';

import { notificacionHref, parseNotificacionData } from './constants';

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
});
