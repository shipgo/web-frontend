import { Fragment } from "react";
import {
  ActionIcon,
  Badge,
  Group,
  Menu,
  Progress,
  Stack,
  Table,
  Text,
  Tooltip,
} from "@mantine/core";

import { timeFromNow, toLocalDate } from "@utils/dates";

import dayjs from "dayjs";

import {
  IconMapSearch,
  IconFileDescription,
  IconMessageReport,
  IconEdit,
  IconTrash,
  IconDotsVertical,
  IconAlertTriangle,
} from "@tabler/icons-react";

const ACTIONS = [
  {
    name: "Detalles",
    items: [
      { icon: <IconMapSearch size={18} />, label: "Localizar" },
      { icon: <IconFileDescription size={18} />, label: "Ver detalles" },
    ],
  },
  {
    name: "Opciones",
    items: [
      {
        icon: <IconMessageReport size={18} />,
        label: "Reportar",
        color: "orange",
      },
      { icon: <IconEdit size={18} />, label: "Editar", color: "blue" },
      { icon: <IconTrash size={18} />, label: "Eliminar", color: "red" },
    ],
  },
];

const showWarning = (item) => {
  return (
    ["planificado", "asignado"].includes(item.estado.toLowerCase()) &&
    dayjs(item.fecha).isBefore(dayjs())
  );
};

const COLUMNS = [
  "ID Viaje",
  "Fecha programada",
  "Estado",
  "Recursos",
  "Carga",
  "Progreso",
  "Acciones",
];

const ITEMS = [
  {
    id: "1SDG56FHY4D",
    fecha: "2026-03-15T10:00:00Z",
    estado: "Planificado",
    chofer: { nombre: "Juan Perez" },
    vehiculo: { patente: "ABC123", capacidad: 3000 },
    carga: { envios: 15, bultos: 30, peso: 4500 },
    paquetes_entregados: 0,
  },
  {
    id: "2ASD89GHJ12",
    fecha: "2026-03-12T03:00:00Z",
    estado: "ASIGNADO",
    chofer: { nombre: "Daniel Gomez" },
    vehiculo: { patente: "DEF456", capacidad: 2000 },
    carga: { envios: 10, bultos: 20, peso: 3000 },
    paquetes_entregados: 0,
  },
  {
    id: "3GHJ12KLM34",
    fecha: new Date(),
    estado: "EN CURSO",
    chofer: { nombre: "Martin Garcia" },
    vehiculo: { patente: "GHI789", capacidad: 2500 },
    carga: { envios: 5, bultos: 10, peso: 2500 },
    paquetes_entregados: 4,
  },
  {
    id: "4JKL34MNO56",
    fecha: "2026-03-10T08:00:00Z",
    estado: "FINALIZADO",
    chofer: { nombre: "Lucas Garcia" },
    vehiculo: { patente: "JKL012", capacidad: 4000 },
    carga: { envios: 20, bultos: 40, peso: 4000 },
    paquetes_entregados: 20,
  },
  {
    id: "5MNO56PQR78",
    fecha: "2026-03-11T12:00:00Z",
    estado: "INTERRUMPIDO",
    chofer: { nombre: "Andres Martinez" },
    vehiculo: { patente: "MNO345", capacidad: 3500 },
    carga: { envios: 5, bultos: 16, peso: 2800 },
    paquetes_entregados: 1,
  },
].sort((a, b) => dayjs(b.fecha).diff(dayjs(a.fecha)));

const getStatusColor = (estado) => {
  const COLORS = {
    "en curso": "blue",
    finalizado: "green",
    planificado: "orange",
    interrumpido: "red",
    asignado: "yellow",
  };

  return COLORS[estado.toLowerCase()] ?? "gray";
};

const getProgressProps = (item) => {
  const progress = (item.paquetes_entregados / item.carga.envios) * 100;

  const props = { value: progress };

  if (progress === 100) {
    props.color = "green";
    return props;
  }

  if (progress >= 75 && progress < 100) {
    props.color = "lime";
    return props;
  }

  if (progress >= 50 && progress < 75) {
    props.color = "yellow";
    return props;
  }

  if (progress >= 25 && progress < 50) {
    props.color = "orange";
    return props;
  }

  props.color = "red";
  return props;
};

const shouldDisableAction = (estado, label) => {
  const disableActions = {
    completado: ["Reportar", "Editar", "Eliminar", "Localizar"],
    "en camino": ["Editar", "Eliminar"],
    pendiente: ["Localizar", "Reportar"],
    cancelado: ["Reportar", "Editar", "Eliminar", "Localizar"],
  };
  return disableActions[estado]?.includes(label) ?? true;
};

const ListaViajesTabla = () => {
  return (
    <Table
      stickyHeader
      highlightOnHover
      verticalSpacing="xs"
      horizontalSpacing="xs"
    >
      <Table.Thead>
        <Table.Tr>
          {COLUMNS.map((column) => (
            <Table.Th key={column}>{column}</Table.Th>
          ))}
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {ITEMS.map((item) => (
          <Table.Tr key={item.id}>
            <Table.Td>{item.id}</Table.Td>

            <Table.Td>
              <Group>
                <Stack gap="0">
                  <Text size="sm">{toLocalDate(item.fecha)}</Text>
                  <Text size="xs" fw="bold">
                    {timeFromNow(item.fecha)}
                  </Text>
                </Stack>
                {showWarning(item) && (
                  <Tooltip withArrow label="Viaje retrasado">
                    <IconAlertTriangle size={20} color="orange" />
                  </Tooltip>
                )}
              </Group>
            </Table.Td>

            <Table.Td>
              <Badge
                color={getStatusColor(item.estado)}
                variant="light"
                radius="md"
              >
                {item.estado}
              </Badge>
            </Table.Td>

            <Table.Td>
              <Stack gap={0}>
                <Text size="sm">{item.vehiculo.patente}</Text>
                <Text size="xs" fw={600}>
                  {item.chofer.nombre}
                </Text>
              </Stack>
            </Table.Td>

            <Table.Td>
              <Stack gap={0}>
                <Text size="sm">{item.carga.peso} kg</Text>
                <Text size="xs" fw={600}>
                  {item.carga.envios} envíos ({item.carga.bultos} bultos)
                </Text>
              </Stack>
            </Table.Td>

            <Table.Td>
              <Stack gap="0.25rem">
                <Text size="sm">
                  {item.paquetes_entregados} / {item.carga.envios} entregas
                </Text>
                <Progress {...getProgressProps(item)} />
              </Stack>
            </Table.Td>

            <Table.Td>
              <Menu shadow="md" width={150}>
                <Menu.Target>
                  <ActionIcon variant="subtle" size="input-sm">
                    <IconDotsVertical size={18} />
                  </ActionIcon>
                </Menu.Target>

                <Menu.Dropdown>
                  {ACTIONS.map(({ name, items }, index) => (
                    <Fragment key={name}>
                      <Menu.Label> {name} </Menu.Label>
                      {items.map(({ icon, label, color }) => (
                        <Menu.Item
                          key={label}
                          color={color}
                          leftSection={icon}
                          disabled={shouldDisableAction(item.estado, label)}
                        >
                          {label}
                        </Menu.Item>
                      ))}
                      {index === 0 && <Menu.Divider />}
                    </Fragment>
                  ))}
                </Menu.Dropdown>
              </Menu>
            </Table.Td>
          </Table.Tr>
        ))}
      </Table.Tbody>
    </Table>
  );
};

export default ListaViajesTabla;
