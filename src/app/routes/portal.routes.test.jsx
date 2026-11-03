import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Router } from 'wouter';
import { memoryLocation } from 'wouter/memory-location';

vi.mock('@features/portal', () => ({
  PortalEnviosPage: () => <div>Mis envíos</div>,
  PortalEnvioDetallePage: () => <div>Detalle</div>,
  MiPerfilPage: () => <div>Mi perfil</div>,
}));
vi.mock('@features/notificaciones/pages/Historial', () => ({
  default: ({ portal }) => <div>Historial{portal ? ' (portal)' : ''}</div>,
}));

import PortalRoutes from './portal.routes';

// El nest `/portal` de `routes/index.jsx` aporta el base; acá se simula con `base`.
const renderEn = (path) =>
  render(
    <Router hook={memoryLocation({ path }).hook} base="/portal">
      <PortalRoutes />
    </Router>,
  );

describe('PortalRoutes', () => {
  it('/portal/notificaciones muestra el historial en versión portal (SHG-FE-142)', () => {
    renderEn('/portal/notificaciones');
    expect(screen.getByText('Historial (portal)')).toBeInTheDocument();
  });

  it('/portal/envios sigue mostrando "mis envíos"', () => {
    renderEn('/portal/envios');
    expect(screen.getByText('Mis envíos')).toBeInTheDocument();
  });
});
