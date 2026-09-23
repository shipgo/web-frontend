import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MantineProvider } from '@mantine/core';

import { renderWithProviders } from '../../test/renderWithProviders';

const mockUseAuth = vi.fn();
vi.mock('@contexts/auth', () => ({
  useAuth: () => mockUseAuth(),
}));

import HomePage from './index';

const renderHome = () =>
  renderWithProviders(<HomePage />);

// Clave interna que usa el `localStorageColorSchemeManager` de Mantine para
// persistir la preferencia entre sesiones (misma que lee `routes/index.jsx`).
const MANTINE_COLOR_SCHEME_STORAGE_KEY = 'mantine-color-scheme-value';

// Reproduce el mismo `MantineProvider` raíz que `App.jsx`
// (`defaultColorScheme="auto"`) — el bug de SHG-FE-081 sólo aparece con
// "auto" como default, `renderWithProviders` no lo configura así.
const renderHomeWithAutoScheme = () =>
  render(
    <MantineProvider defaultColorScheme="auto">
      <HomePage />
    </MantineProvider>
  );

const mockMatchMediaPrefersDark = (prefersDark) => {
  window.matchMedia = vi.fn().mockImplementation((query) => ({
    matches: prefersDark && query === '(prefers-color-scheme: dark)',
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
};

describe('HomePage', () => {
  beforeEach(() => {
    mockUseAuth.mockReset();
    mockUseAuth.mockReturnValue({ user: { authorities: [{ name: 'ROLE_ADMIN' }] } });
  });

  it('muestra "Alternar tema" en la sección Opciones', () => {
    renderHome();
    expect(screen.getByText('Alternar tema')).toBeInTheDocument();
  });

  it('muestra las secciones Gestionar, Administrar y Opciones para un ADMIN', () => {
    renderHome();
    expect(screen.getByText('Gestionar')).toBeInTheDocument();
    expect(screen.getByText('Administrar')).toBeInTheDocument();
    expect(screen.getByText('Opciones')).toBeInTheDocument();
  });
});

describe('HomePage — toggle de tema (SHG-FE-081)', () => {
  const originalMatchMedia = window.matchMedia;

  beforeEach(() => {
    mockUseAuth.mockReset();
    mockUseAuth.mockReturnValue({ user: { authorities: [{ name: 'ROLE_ADMIN' }] } });
    window.localStorage.removeItem(MANTINE_COLOR_SCHEME_STORAGE_KEY);
  });

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
    window.localStorage.removeItem(MANTINE_COLOR_SCHEME_STORAGE_KEY);
  });

  it('un solo click en "Alternar tema" alterna el tema y actualiza el tema visual en el mismo click (arrancando en "auto"/oscuro)', async () => {
    const user = userEvent.setup();
    mockMatchMediaPrefersDark(true);
    renderHomeWithAutoScheme();

    // Verificar que arranca en modo oscuro (por preferencia del SO)
    const theme = document.documentElement.getAttribute('data-mantine-color-scheme');
    expect(theme).toBe('dark');

    // Click en "Alternar tema"
    await user.click(screen.getByText('Alternar tema'));

    // Verificar que ahora está en modo claro
    const newTheme = document.documentElement.getAttribute('data-mantine-color-scheme');
    expect(newTheme).toBe('light');
  });

  it('respeta una preferencia explícita guardada de una sesión previa y alterna en un solo click', async () => {
    const user = userEvent.setup();
    // El SO dice "claro" pero el usuario ya había elegido "oscuro" antes.
    mockMatchMediaPrefersDark(false);
    window.localStorage.setItem(MANTINE_COLOR_SCHEME_STORAGE_KEY, 'dark');
    renderHomeWithAutoScheme();

    // Verificar que arranca en modo oscuro (por preferencia guardada)
    const theme = document.documentElement.getAttribute('data-mantine-color-scheme');
    expect(theme).toBe('dark');

    // Click en "Alternar tema"
    await user.click(screen.getByText('Alternar tema'));

    // Verificar que ahora está en modo claro
    const newTheme = document.documentElement.getAttribute('data-mantine-color-scheme');
    expect(newTheme).toBe('light');
  });
});
