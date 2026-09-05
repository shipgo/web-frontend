import { IconBuildingWarehouse, IconChartBar, IconPackage, IconRoute, IconTool, IconTruckDelivery, IconUsersGroup } from '@tabler/icons-react';

import { ROLE_SUPERUSER, ROLES_WEB } from '@domain/roles';


const PAGES = [
  {
    label: 'Dashboard',
    to: '/dashboard',
    icon: <IconChartBar size={18} />,
    roles: ROLES_WEB,
  },
  {
    label: 'Viajes',
    to: '/viajes',
    icon: <IconRoute size={18} />,
    roles: ROLES_WEB,
  },
  {
    label: 'Envios',
    to: '/envios',
    icon: <IconPackage size={18} />,
    roles: ROLES_WEB,
  },
];

const ADMIN = [
  {
    label: 'Usuarios',
    to: '/usuarios',
    icon: <IconUsersGroup size={18} />,
    roles: ROLES_WEB,
  },
  {
    label: 'Vehículos',
    to: '/vehiculos',
    icon: <IconTruckDelivery size={18} />,
    roles: ROLES_WEB,
  },
  {
    // Sucursales/Empresa: endpoints SUPERUSER-only (CONTRACTS.md §3).
    label: 'Sucursales',
    to: '/sucursales',
    icon: <IconBuildingWarehouse size={18} />,
    roles: [ROLE_SUPERUSER],
  },
  {
    label: 'Mantenimientos',
    to: '/mantenimientos',
    icon: <IconTool size={18} />,
    roles: ROLES_WEB,
  },
];

export {
  PAGES,
  ADMIN,
};
