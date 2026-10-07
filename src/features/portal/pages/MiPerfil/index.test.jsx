import { describe, expect, it, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { notifications } from '@mantine/notifications';

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

// Stub: `CambiarPasswordCard` (compartido, `src/app/components`) ya tiene sus
// propios tests — acá sólo nos importa que la pantalla la renderiza.
vi.mock('@components/CambiarPasswordCard', () => ({
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
    // Los toasts de Mantine viven en un store global fuera del árbol de React
    // (no se resetean con el unmount/cleanup entre tests): sin esto, dos
    // tests que muestran el mismo título ("Perfil actualizado") chocan y
    // `findByText` falla por match ambiguo.
    notifications.clean();
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

  it('si el PUT sale bien pero falla el refresh de auth.store, igual muestra éxito (no error)', async () => {
    const user = userEvent.setup();
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockUseMiPerfil.mockReturnValue({ ...base, data: CUSTOMER_ME });
    mockUpdateMe.mockResolvedValue({ ...CUSTOMER_ME, nombre: 'Carla Nueva' });
    mockGetUserInfo.mockRejectedValue(new Error('whoami/customer-me caídos'));
    renderWithProviders(<MiPerfilPage />);

    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    expect(await screen.findByText('Perfil actualizado')).toBeInTheDocument();
    expect(screen.queryByText('Error')).not.toBeInTheDocument();
    await waitFor(() => expect(mockGetUserInfo).toHaveBeenCalled());

    consoleErrorSpy.mockRestore();
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

  it('teléfono no numérico y nombre de 300 caracteres → errores inline, sin llamar al PUT (SHG-FE-107)', async () => {
    const user = userEvent.setup();
    mockUseMiPerfil.mockReturnValue({ ...base, data: CUSTOMER_ME });
    const { container } = renderWithProviders(<MiPerfilPage />);

    const tel = screen.getByLabelText(exactLabel('Tel[eé]fono'));
    await user.clear(tel);
    await user.type(tel, 'abc');
    const nombre = screen.getByLabelText(exactLabel('Nombre'));
    await user.clear(nombre);
    await user.click(nombre);
    await user.paste('a'.repeat(300));
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    expect(await screen.findByText('El teléfono sólo puede tener números')).toBeInTheDocument();
    expect(screen.getByText('No puede superar los 100 caracteres')).toBeInTheDocument();
    expect(container.querySelector('form')).toHaveAttribute('novalidate');
    expect(mockUpdateMe).not.toHaveBeenCalled();
  });
});
