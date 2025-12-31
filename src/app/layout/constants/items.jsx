import { IconBuildingWarehouse, IconChartBar, IconPackage, IconRoute, IconTool, IconTruckDelivery, IconUsersGroup } from '@tabler/icons-react';


const PAGES = [
  {
    label: 'Dashboard',
    to: '/dashboard',
    icon: <IconChartBar size={18} />,
  },
  {
    label: 'Viajes',
    to: '/viajes',
    icon: <IconRoute size={18} />,
  },
  {
    label: 'Envios',
    to: '/envios',
    icon: <IconPackage size={18} />,
  },
];

const ADMIN = [
  {
    label: 'Usuarios',
    to: '/usuarios',
    icon: <IconUsersGroup size={18} />,
  },
  {
    label: 'Vehículos',
    to: '/vehiculos',
    icon: <IconTruckDelivery size={18} />,
  },
  {
    label: 'Sucursales',
    to: '/sucursales',
    icon: <IconBuildingWarehouse size={18} />,
  },
  {
    label: 'Mantenimientos',
    to: '/mantenimientos',
    icon: <IconTool size={18} />,
  },
];

export {
  PAGES,
  ADMIN,
};