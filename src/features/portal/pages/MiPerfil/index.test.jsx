import { describe, expect, it, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { renderWithProviders } from '../../../../test/renderWithProviders';

const mockUseMiPerfil = vi.fn();
vi.mock('./hooks/useMiPerfil', () => ({
  MI_PERFIL_QUERY_KEY: ['portal-mi-perfil'],
  useMiPerfil: () => mockUseMiPerfil(),
}));

const mockUpdateMe = vi.fn();
vi.mock('../../api/portal.api', () => ({
  portalApi: { updateMe: (...args) => mockUpdateMe(...args) },
}));

const mockGetUserInfo = vi.fn();
vi.mock('@stores/auth.store', () => ({
  useAuthStore: (selector) => selector({ getUserInfo: mockGetUserInfo }),
}));

// Stub: `CambiarPasswordCard` (reusada de `usuarios`) ya tiene sus propios
// tests — acá sólo nos importa que la pantalla la renderiza.
vi.mock('../../../usuarios/components/CambiarPasswordCard', () => ({
  default: () => <div>stub-cambiar-password</div>,
}));

import MiPerfilPage from './index';

const CUSTOMER_ME = {
  email: 'carla@mail.com',
  nombre: 'Carla',
  apellido: 'Cliente',
  telefono: '3511234567',
  emailVerificado: true,
};

const base = { data: undefined, isLoading: false, isError: false, refetch: vi.fn() };

// Los labels editables usan `withAsterisk` (Mantine agrega un " *" al texto
// accesible), mismo patrón que `Registro/index.test.jsx`.
const exactLabel = (text) => new RegExp(`^${text}\\s*\\*?$`, 'i');

describe('MiPerfilPage', () => {
  beforeEach(() => {
    mockUseMiPerfil.mockReset();
    mockUpdateMe.mockReset();
    mockGetUserInfo.mockReset();
    mockGetUserInfo.mockResolvedValue(undefined);
  });

  it('muestra el estado de carga', () => {
    mockUseMiPerfil.mockReturnValue({ ...base, isLoading: true });
    renderWithProviders(<MiPerfilPage />);
    expect(screen.getByText('Cargando tus datos...')).toBeInTheDocument();
  });

  it('muestra el estado de error', () => {
    mockUseMiPerfil.mockReturnValue({ ...base, isError: true });
    renderWithProviders(<MiPerfilPage />);
    expect(screen.getByText('No pudimos cargar tu perfil')).toBeInTheDocument();
  });

  it('ve sus datos: email de sólo lectura + nombre/apellido/teléfono editables', () => {
    mockUseMiPerfil.mockReturnValue({ ...base, data: CUSTOMER_ME });
    renderWithProviders(<MiPerfilPage />);

    expect(screen.getByDisplayValue('carla@mail.com')).toBeDisabled();
    expect(screen.getByText('Email verificado')).toBeInTheDocument();
    expect(screen.getByLabelText(exactLabel('Nombre'))).toHaveValue('Carla');
    expect(screen.getByLabelText(exactLabel('Apellido'))).toHaveValue('Cliente');
    expect(screen.getByLabelText(exactLabel('Tel[eé]fono'))).toHaveValue('3511234567');
    expect(screen.getByText('stub-cambiar-password')).toBeInTheDocument();
  });

  it('un email sin verificar se muestra con el badge correspondiente', () => {
    mockUseMiPerfil.mockReturnValue({
      ...base,
      data: { ...CUSTOMER_ME, emailVerificado: false },
    });
    renderWithProviders(<MiPerfilPage />);
    expect(screen.getByText('Email sin verificar')).toBeInTheDocument();
  });

  it('edita los campos permitidos: guarda, recorta espacios y refresca auth.store', async () => {
    const user = userEvent.setup();
    mockUseMiPerfil.mockReturnValue({ ...base, data: CUSTOMER_ME });
    mockUpdateMe.mockResolvedValue({ ...CUSTOMER_ME, nombre: 'Carla Nueva' });
    renderWithProviders(<MiPerfilPage />);

    const nombreInput = screen.getByLabelText(exactLabel('Nombre'));
    await user.clear(nombreInput);
    await user.type(nombreInput, '  Carla Nueva  ');
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    await waitFor(() =>
      expect(mockUpdateMe).toHaveBeenCalledWith({
        nombre: 'Carla Nueva',
        apellido: 'Cliente',
        telefono: '3511234567',
      }),
    );
    await waitFor(() => expect(mockGetUserInfo).toHaveBeenCalled());
    expect(await screen.findByText('Perfil actualizado')).toBeInTheDocument();
  });

  it('ve errores por campo (ApiFieldError) si el backend rechaza el PUT', async () => {
    const user = userEvent.setup();
    mockUseMiPerfil.mockReturnValue({ ...base, data: CUSTOMER_ME });
    mockUpdateMe.mockRejectedValue({
      response: {
        status: 400,
        data: {
          statusCode: 400,
          message: 'Validación fallida',
          fields: [{ field: 'telefono', error: 'El teléfono es requerido' }],
        },
      },
    });
    renderWithProviders(<MiPerfilPage />);

    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    expect(await screen.findByText('El teléfono es requerido')).toBeInTheDocument();
    expect(mockGetUserInfo).not.toHaveBeenCalled();
  });
});
