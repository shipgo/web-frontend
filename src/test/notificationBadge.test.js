import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

/**
 * `public/notification-badge.png` es el ícono chico (barra de estado de Android) de las notificaciones
 * push. El backend lo manda como `chrome_web_badge` (`OneSignalPushChannel`); sin él OneSignal pone su
 * campanita. Android sólo usa el canal alfa: tiene que ser una silueta con transparencia, no un
 * cuadrado de color (que se vería como un cuadrado blanco).
 */
describe('notification-badge.png (ícono chico de las notificaciones push)', () => {
  const png = readFileSync(join(import.meta.dirname, '../../public/notification-badge.png'));

  it('es un PNG de 96×96', () => {
    expect(png.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a');
    expect(png.readUInt32BE(16)).toBe(96);
    expect(png.readUInt32BE(20)).toBe(96);
  });

  it('tiene canal alfa (RGBA) para que sea una silueta sobre transparente', () => {
    // IHDR: byte 25 = tipo de color (6 = RGBA).
    expect(png[25]).toBe(6);
  });
});
