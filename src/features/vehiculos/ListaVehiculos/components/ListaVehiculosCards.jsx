import { useLocation } from 'wouter';
import { Badge } from '@mantine/core';
import { IconEdit, IconFileDescription, IconTool, IconTrash } from '@tabler/icons-react';

import { ListCard, ResponsiveList, RowActionsMenu } from '@components';
import { estadoBadge } from '@domain/estados';
import { mantenimientoEtiqueta } from '@features/vehiculos/utils/mantenimiento';
import { useDeleteVehiculo } from '../hooks/useDeleteVehiculo';

/**
 * Lista responsive de vehículos: tarjetas en mobile, la tabla (children) en escritorio.
 */
const ListaVehiculosCards = ({ items = [], selectedIds, onToggle, onRefresh, children, ...screenProps }) => {
  const [, navigate] = useLocation();
  const { confirmDelete } = useDeleteVehiculo(onRefresh);

  const getActions = (vehiculo) => [
    {
      name: 'Detalles',
      items: [
        {
          icon: <IconFileDescription size={18} />,
          label: 'Ver detalles',
          onClick: () => navigate(`~/vehiculos/${vehiculo.id}`),
        },
        {
          icon: <IconTool size={18} />,
          label: 'Historial de mantenimiento',
          onClick: () => navigate(`~/mantenimientos?patente=${encodeURIComponent(vehiculo.patente)}`),
        },
      ],
    },
    {
      name: 'Opciones',
      items: [
        {
          icon: <IconEdit size={18} />,
          label: 'Editar',
          color: 'blue',
          onClick: () => navigate(`~/vehiculos/${vehiculo.id}/editar`),
        },
        { icon: <IconTrash size={18} />, label: 'Eliminar', color: 'red', onClick: () => confirmDelete(vehiculo) },
      ],
    },
  ];

  return (
    <ResponsiveList
      items={items}
      selectedIds={selectedIds}
      onToggle={onToggle}
      getActions={(vehiculo) => (
        <RowActionsMenu
          actions={getActions(vehiculo)}
          ariaLabel={`Acciones de ${vehiculo.patente || 'vehículo'}`}
          width={220}
        />
      )}
      renderCard={(vehiculo, { selected, onToggle: toggle, actions }) => {
        const patente = vehiculo.patente || 'Sin patente';
        const marca = vehiculo.modelo?.marca?.nombre || 'Sin marca';
        const modelo = vehiculo.modelo?.nombre || 'Sin modelo';
        const badge = vehiculo.estado
          ? estadoBadge('vehiculo', vehiculo.estado)
          : { label: 'Sin estado', color: 'gray' };
        return (
          <ListCard
            title={patente}
            mono
            badge={badge}
            lines={[
              `${marca} ${modelo}`,
              { label: 'Tipo', value: vehiculo.tipoVehiculo?.nombre || vehiculo.tipo || 'Sin tipo' },
              { label: 'Sucursal', value: vehiculo.sucursal?.nombre || 'Sin sucursal' },
              { label: 'Año de compra', value: vehiculo.anioCompra || 'Sin dato' },
              vehiculo.mantenimiento && (
                <Badge
                  color="orange"
                  variant="light"
                  radius="md"
                  leftSection={<IconTool size={12} />}
                  h="auto"
                  py={2}
                  styles={{ label: { whiteSpace: 'normal' } }}
                  style={{ textTransform: 'none' }}
                >
                  {mantenimientoEtiqueta(vehiculo.mantenimiento)}
                </Badge>
              ),
            ].filter(Boolean)}
            selected={selected}
            onToggle={toggle}
            selectLabel={`Seleccionar vehículo ${patente}`}
            actions={actions}
            onClick={() => navigate(`~/vehiculos/${vehiculo.id}`)}
          />
        );
      }}
      {...screenProps}
    >
      {children}
    </ResponsiveList>
  );
};

export default ListaVehiculosCards;
