import { MantineProvider, Modal, PasswordInput } from '@mantine/core';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { THEME } from './theme';

const renderConTema = (ui) =>
  render(<MantineProvider theme={THEME}>{ui}</MantineProvider>);

describe('THEME — nombres accesibles en español (SHG-FE-114)', () => {
  it('el ojo del PasswordInput tiene aria-label en español', () => {
    renderConTema(<PasswordInput label="Contraseña" />);

    expect(
      screen.getByRole('button', { name: 'Mostrar contraseña' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /toggle password visibility/i }),
    ).not.toBeInTheDocument();
  });

  it('el botón de cierre del Modal tiene nombre accesible', () => {
    renderConTema(
      <Modal
        opened
        onClose={() => {}}
        title="Resetear contraseña"
        transitionProps={{ duration: 0 }}
      >
        contenido
      </Modal>,
    );

    expect(screen.getByRole('button', { name: 'Cerrar' })).toBeInTheDocument();
  });
});
