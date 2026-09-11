import { Select } from "@mantine/core";
import { IconBuildingWarehouse } from "@tabler/icons-react";

import { useOperatingContext } from "@contexts/operatingContext";

const ALL_VALUE = "";

/**
 * Selector de "sucursal operativa activa" (SHG-FE-052). Sólo visible para
 * SUPERUSER (`ROLE_SUPERUSER`) — un ADMIN ya opera exclusivamente su propia
 * sucursal server-side, no tiene nada para elegir acá.
 *
 * "Todas las sucursales" (`value: ''` → `activeSucursalId: null`) es el
 * default y equivale al alcance normal de un SUPERUSER (toda la empresa).
 */
const OperatingSucursalSelector = () => {
  const { isSuperUser, activeSucursalId, setActiveSucursalId, sucursales, isLoadingSucursales } =
    useOperatingContext();

  if (!isSuperUser) return null;

  const data = [
    { value: ALL_VALUE, label: "Todas las sucursales" },
    ...sucursales.map((sucursal) => ({
      value: String(sucursal.id),
      label: sucursal.nombre,
    })),
  ];

  return (
    <Select
      aria-label="Sucursal operativa activa"
      placeholder="Todas las sucursales"
      leftSection={<IconBuildingWarehouse size={16} />}
      w={220}
      data={data}
      value={activeSucursalId != null ? String(activeSucursalId) : ALL_VALUE}
      onChange={(value) => setActiveSucursalId(value || null)}
      disabled={isLoadingSucursales}
      allowDeselect={false}
      searchable
    />
  );
};

export default OperatingSucursalSelector;
