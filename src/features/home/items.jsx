import {
  IconBook,
  IconChartBar,
  IconPackages,
  IconTruckDelivery,
  IconUsers,
  IconSun,
  IconRoute,
  IconMap,
} from '@tabler/icons-react';

const ITEMS = [
  {
    title: 'Gestionar',
    color: 'blue',
    options: [
      {
        title: 'Mapa',
        description: 'Visualizá los viajes activos en tiempo real',
        icon: <IconMap size={28} />,
        color: 'blue',
        to: '/mapa',
      },
      {
        title: 'Viajes',
        description: 'Consultá y administrá todos los viajes',
        icon: <IconRoute size={28} />,
        color: 'indigo',
        to: '/viajes',
      },
      {
        title: 'Envíos',
        description: 'Gestioná los envíos registrados',
        icon: <IconPackages size={28} />,
        color: 'teal',
        to: '/envios',
      },
      {
        title: 'Dashboard',
        description: 'Métricas y resumen operativo del día',
        icon: <IconChartBar size={28} />,
        color: 'violet',
        to: '/dashboard',
      },
    ],
  },
  {
    title: 'Administrar',
    options: [
      {
        title: 'Usuarios',
        description: 'Gestioná los usuarios de la plataforma',
        icon: <IconUsers size={28} />,
        color: 'orange',
        to: '/usuarios',
      },
      {
        title: 'Vehículos',
        description: 'Controlá el estado de la flota',
        icon: <IconTruckDelivery size={28} />,
        color: 'red',
        to: '/vehiculos',
      },
    ],
  },
  {
    title: 'Opciones',
    options: [
      {
        title: 'Manual',
        description: 'Consultá la documentación de la plataforma',
        icon: <IconBook size={28} />,
        color: 'gray',
        href: 'https://shipgo.gitbook.io/manual',
      },
      {
        title: 'Alternar tema',
        description: 'Cambiá entre modo claro y oscuro',
        icon: <IconSun size={28} />,
        color: 'yellow',
        action: 'toggleTheme',
      },
    ],
  },
];

export default ITEMS;
