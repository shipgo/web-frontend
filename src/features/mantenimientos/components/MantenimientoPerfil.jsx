import {
  Badge,
  Box,
  Card,
  Divider,
  Group,
  SimpleGrid,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import {
  IconCalendar,
  IconCar,
  IconFileDescription,
  IconMapPin,
  IconTools,
  IconUser,
} from "@tabler/icons-react";

import { toLocalDate } from "@utils/dates";

const getEstadoColor = (estado) => {
  const normalizedEstado = estado?.toUpperCase();
  const colores = {
    PENDIENTE: "yellow",
    EN_PROCESO: "blue",
    "EN PROCESO": "blue",
    COMPLETADO: "green",
    CANCELADO: "red",
    VENCIDO: "red",
  };
  return colores[normalizedEstado] || "gray";
};

const formatCurrency = (value) => {
  if (!value) return "Sin costo";
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
  }).format(value);
};

const formatDateTime = (date) => {
  if (!date) return "Sin fecha";
  return new Date(date).toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const InfoItem = ({ icon, label, value, badge }) => (
  <Box>
    <Group gap="xs" mb={4}>
      {icon}
      <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
        {label}
      </Text>
    </Group>
    {badge ? (
      <Badge color={badge.color} variant="light" size="lg">
        {value}
      </Badge>
    ) : (
      <Text size="sm" fw={500}>
        {value || "-"}
      </Text>
    )}
  </Box>
);

/**
 * Componente reutilizable para mostrar el perfil/detalle de un mantenimiento
 */
const MantenimientoPerfil = ({ mantenimiento }) => {
  if (!mantenimiento) {
    return (
      <Card withBorder>
        <Text c="dimmed">No se encontró información del mantenimiento</Text>
      </Card>
    );
  }

  const vehiculo = mantenimiento.vehiculo;
  const patente = vehiculo?.patente || "Sin patente";
  const marcaModelo = vehiculo
    ? `${vehiculo.marca?.nombre || vehiculo.marca || ""} ${
        vehiculo.modelo?.nombre || vehiculo.modelo || ""
      }`.trim() || "Sin datos"
    : "Sin vehículo";

  const tipoMantenimiento =
    mantenimiento.tipoMantenimiento?.nombre ||
    mantenimiento.tipo?.nombre ||
    "Sin tipo";

  const fechaMantenimiento =
    mantenimiento.fechaHoraMantenimiento || mantenimiento.fechaProgramada || mantenimiento.fecha;
  const fechaRegistro = mantenimiento.fechaHoraRegistro || mantenimiento.fechaCreacion;
  const estado = mantenimiento.estado || "PENDIENTE";
  const sucursal =
    vehiculo?.sucursal?.nombre || mantenimiento.sucursal?.nombre || "Sin sucursal";
  const descripcion = mantenimiento.descripcion || "Sin descripción";
  
  const nombreMecanico = mantenimiento.nombreMecanico || "Sin nombre";
  const apellidoMecanico = mantenimiento.apellidoMecanico || "Sin apellido";
  const mecanicoCompleto = `${nombreMecanico} ${apellidoMecanico}`;

  return (
    <Stack gap="lg">
      {/* Información del Mecánico */}
      <Card withBorder shadow="sm" p="xl">
        <Stack gap="md">
          <Group gap="xs">
            <IconUser size={24} />
            <Box>
              <Text size="lg" fw={600}>
                Mecánico Responsable
              </Text>
              <Text size="sm" c="dimmed">
                Información del mecánico asignado
              </Text>
            </Box>
          </Group>

          <Divider />

          <SimpleGrid cols={{ base: 1, sm: 2 }}>
            <InfoItem
              icon={<IconUser size={16} />}
              label="Nombre"
              value={nombreMecanico}
            />
            <InfoItem
              icon={<IconUser size={16} />}
              label="Apellido"
              value={apellidoMecanico}
            />
          </SimpleGrid>
        </Stack>
      </Card>

      {/* Información del Vehículo */}
      <Card withBorder shadow="sm" p="xl">
        <Stack gap="md">
          <Group gap="xs">
            <IconCar size={24} />
            <Box>
              <Text size="lg" fw={600}>
                Vehículo
              </Text>
              <Text size="sm" c="dimmed">
                Información del vehículo en mantenimiento
              </Text>
            </Box>
          </Group>

          <Divider />

          <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }}>
            <InfoItem
              icon={<IconCar size={16} />}
              label="Patente"
              value={patente}
            />
            <InfoItem
              icon={<IconCar size={16} />}
              label="Marca y Modelo"
              value={marcaModelo}
            />
            <InfoItem
              icon={<IconMapPin size={16} />}
              label="Sucursal"
              value={sucursal}
            />
          </SimpleGrid>
        </Stack>
      </Card>

      {/* Información del Mantenimiento */}
      <Card withBorder shadow="sm" p="xl">
        <Stack gap="md">
          <Group gap="xs">
            <IconTools size={24} />
            <Box>
              <Text size="lg" fw={600}>
                Datos del Mantenimiento
              </Text>
              <Text size="sm" c="dimmed">
                Detalles del mantenimiento programado
              </Text>
            </Box>
          </Group>

          <Divider />

          <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }}>
            <InfoItem
              icon={<IconTools size={16} />}
              label="Tipo"
              value={tipoMantenimiento}
            />
            <InfoItem
              icon={<IconCalendar size={16} />}
              label="Fecha del Mantenimiento"
              value={fechaMantenimiento ? formatDateTime(fechaMantenimiento) : "Sin fecha"}
            />
            {fechaRegistro && (
              <InfoItem
                icon={<IconCalendar size={16} />}
                label="Fecha de Registro"
                value={formatDateTime(fechaRegistro)}
              />
            )}
            <InfoItem
              icon={<IconFileDescription size={16} />}
              label="Estado"
              value={estado}
              badge={{ color: getEstadoColor(estado) }}
            />
          </SimpleGrid>

          {descripcion && descripcion !== "Sin descripción" && (
            <>
              <Divider />
              <Box>
                <Group gap="xs" mb={8}>
                  <IconFileDescription size={16} />
                  <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                    Descripción
                  </Text>
                </Group>
                <Text size="sm">{descripcion}</Text>
              </Box>
            </>
          )}
        </Stack>
      </Card>
    </Stack>
  );
};

export default MantenimientoPerfil;

