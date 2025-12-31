import {
  IconBook,
  IconChartBar,
  IconPackages,
  IconTruckDelivery,
  IconUsers,
  IconSun,
  IconRoute,
  IconMap,
} from "@tabler/icons-react";

const ITEMS = [
  {
    title: "Gestionar",
    options: [
      {
        title: "Mapa",
        description: "Visualizá los viajes activos en el mapa",
        icon: <IconMap />,
        to: "/mapa",
      },
      {
        title: "Viajes",
        description: "Visualizá todos los viajes registrados",
        icon: <IconRoute />,
        to: "/viajes",
      },
      {
        title: "Envíos",
        description: "Visualizá todos los envíos registrados",
        icon: <IconPackages />,
        to: "/envios",
      },
      {
        title: "Dashboard",
        description: "Visualizá el dashboard de la aplicación",
        icon: <IconChartBar />,
        to: "/dashboard",
      },
    ],
  },
  {
    title: "Administrar",
    options: [
      {
        title: "Usuarios",
        description: "Visualizá los usuarios de la aplicación",
        icon: <IconUsers />,
        to: "/usuarios",
      },
      {
        title: "Vehículos",
        description: "Visualizá todos los vehículos registrados",
        icon: <IconTruckDelivery />,
        to: "/vehiculos",
      },
    ],
  },
  {
    title: "Opciones",
    options: [
      {
        title: "Manual",
        description: "Visualizá el manual de la aplicación",
        icon: <IconBook />,
        href: "https://www.google.com",
      },
      {
        title: "Alternar tema",
        description: "Alterná el tema de la aplicación",
        icon: <IconSun />,
      },
    ],
  },
];

export default ITEMS;
