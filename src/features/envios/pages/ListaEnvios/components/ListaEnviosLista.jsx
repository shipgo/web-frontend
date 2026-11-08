import { useLocation } from 'wouter';

import ResponsiveList from '@components/ResponsiveList';
import ListCard from '@components/ListCard';
import RowActionsMenu from '@components/RowActionsMenu';
import { estadoBadge } from '@domain/estados';
import { toLocalDate } from '@utils/dates';

import { useDeleteEnvio } from '../hooks/useDeleteEnvio';
import ListaEnviosTabla from './ListaEnviosTabla';
import { getActionsForRow, getFechaAlta } from './envioRowHelpers';

/**
 * Lista de envíos responsive: la tabla de siempre en escritorio y una tarjeta
 * por envío en mobile (código + estado, remitente → destino, fecha de alta).
 * Las acciones por fila y la selección múltiple son las mismas en ambas vistas.
 */
const ListaEnviosLista = ({
  items = [],
  selectedIds,
  onToggle,
  onToggleAll,
  onRefresh,
  footer,
  ...screenProps
}) => {
  const [, navigate] = useLocation();
  const { confirmDelete } = useDeleteEnvio(onRefresh);

  const getActions = (envio) => (
    <RowActionsMenu
      actions={getActionsForRow(envio, {
        onVerDetalles: () => navigate(`~/envios/${envio.id}`),
        onImprimirEtiqueta: () => navigate(`~/envios/${envio.id}/etiqueta`),
        onEditar: () => navigate(`~/envios/editar/${envio.id}`),
        onEliminar: () => confirmDelete(envio),
        onLocalizar: (viajeId) => navigate(`~/mapa?viaje=${viajeId}`),
      })}
      width={160}
      ariaLabel={`Acciones de ${envio.codigoSeguimiento}`}
    />
  );

  const renderCard = (envio, { selected, onToggle: toggle, actions }) => {
    const destino = envio.destino ?? {};
    const localidad = destino.localidad ?? {};
    const direccion = [destino.nombreCalle, destino.numeroCalle].filter(Boolean).join(' ');
    const destinoTexto = [direccion, localidad.nombre].filter(Boolean).join(', ') || '-';
    const remitente = `${envio.nombre ?? ''} ${envio.apellido ?? ''}`.trim() || '-';
    const fechaAlta = getFechaAlta(envio);

    return (
      <ListCard
        title={envio.codigoSeguimiento}
        mono
        badge={estadoBadge('envio', envio.estado)}
        lines={[`${remitente} → ${destinoTexto}`]}
        footer={fechaAlta ? toLocalDate(fechaAlta) : undefined}
        actions={actions}
        selected={selected}
        onToggle={toggle}
        selectLabel={`Seleccionar envío ${envio.codigoSeguimiento}`}
        onClick={() => navigate(`~/envios/${envio.id}`)}
      />
    );
  };

  return (
    <ResponsiveList
      items={items}
      selectedIds={selectedIds}
      onToggle={onToggle}
      getActions={getActions}
      renderCard={renderCard}
      footer={footer}
      {...screenProps}
    >
      <ListaEnviosTabla
        items={items}
        selectedIds={selectedIds}
        onToggle={onToggle}
        onToggleAll={onToggleAll}
        onRefresh={onRefresh}
      />
    </ResponsiveList>
  );
};

export default ListaEnviosLista;
