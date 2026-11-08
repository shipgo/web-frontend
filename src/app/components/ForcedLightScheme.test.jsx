import { render } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { beforeEach, describe, expect, it } from 'vitest';

import ForcedLightScheme from './ForcedLightScheme';

const getAttr = () => document.documentElement.getAttribute('data-mantine-color-scheme');

describe('ForcedLightScheme', () => {
  beforeEach(() => {
    window.localStorage.setItem('mantine-color-scheme-value', 'dark');
  });

  it('fuerza claro mientras está montado y restaura el esquema elegido al desmontarse', () => {
    const app = (children) => (
      <MantineProvider defaultColorScheme="dark">{children}</MantineProvider>
    );
    // Como en la app: el provider raíz ya está montado cuando se abre el login.
    const { rerender, unmount } = render(app(<span>inicio</span>));
    expect(getAttr()).toBe('dark');

    rerender(
      app(
        <ForcedLightScheme>
          <span>login</span>
        </ForcedLightScheme>,
      ),
    );
    expect(getAttr()).toBe('light');

    // Al iniciar sesión se desmonta el login: debe volver el modo oscuro elegido.
    rerender(app(<span>inicio</span>));
    expect(getAttr()).toBe('dark');
    unmount();
  });
});
