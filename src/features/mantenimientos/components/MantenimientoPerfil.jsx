import {
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

import { EMPTY, formatFechaHora } from "@domain/format";

const InfoItem = ({ icon, label, value }) => (
  <Box>
    <Group gap="xs" mb={4}>
      {icon}
      <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
        {label}
      </Text>
    </Group>
    <Text size="sm" fw={500}>
      {value || EMPTY}
    </Text>
  </Box>
);

/**
 * Detalle de un `MantenimientoDTO` (backend, `dto/MantenimientoDTO.java`):
 * `nombreMecanico`, `apellidoMecanico`, `descripcion`, `fechaHoraMantenimiento`,
 * `fechaHoraRegistro`, `tipoMantenimiento`, `vehiculo`, `sucursal`.
 * NO hay estado ni costo — `Mantenimiento` es un registro histórico sin ciclo
 * de vida (ver bitácora de `SHG-FE-020`).
 */
const MantenimientoPerfil = ({ mantenimiento }) => {
  if (!mantenimiento) {
    return (
      <Card>
        <Text c="dimmed">No se encontró información del mantenimiento</Text>
      </Card>
    );
  }

  const vehiculo = mantenimiento.vehiculo;
  const patente = vehiculo?.patente;
  const marcaModelo = vehiculo
    ? `${vehiculo.modelo?.marca?.nombre ?? ""} ${vehiculo.modelo?.nombre ?? ""}`.trim()
    : null;
  const tipoMantenimiento = mantenimiento.tipoMantenimiento?.nombre;
  const sucursal = mantenimiento.sucursal?.nombre;
  const descripcion = mantenimiento.descripcion?.trim();

  return (
    <Stack>
      <Card>
        <Stack gap="md">
          <Group gap="0.75rem">
            <IconUser size={20} />
            <Title order={4}>Mecánico responsable</Title>
          </Group>

          <SimpleGrid cols={{ base: 1, sm: 2 }}>
            <InfoItem
              icon={<IconUser size={16} />}
              label="Nombre"
              value={mantenimiento.nombreMecanico}
            />
            <InfoItem
              icon={<IconUser size={16} />}
              label="Apellido"
              value={mantenimiento.apellidoMecanico}
            />
          </SimpleGrid>
        </Stack>
      </Card>

      <Card>
        <Stack gap="md">
          <Group gap="0.75rem">
            <IconCar size={20} />
            <Title order={4}>Vehículo</Title>
          </Group>

          <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }}>
            <InfoItem icon={<IconCar size={16} />} label="Patente" value={patente} />
            <InfoItem
              icon={<IconCar size={16} />}
              label="Marca y modelo"
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

      <Card>
        <Stack gap="md">
          <Group gap="0.75rem">
            <IconTools size={20} />
            <Title order={4}>Datos del mantenimiento</Title>
          </Group>

          <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }}>
            <InfoItem
              icon={<IconTools size={16} />}
              label="Tipo"
              value={tipoMantenimiento}
            />
            <InfoItem
              icon={<IconCalendar size={16} />}
              label="Fecha del mantenimiento"
              value={
                mantenimiento.fechaHoraMantenimiento
                  ? formatFechaHora(mantenimiento.fechaHoraMantenimiento)
                  : null
              }
            />
            <InfoItem
              icon={<IconCalendar size={16} />}
              label="Fecha de registro"
              value={
                mantenimiento.fechaHoraRegistro
                  ? formatFechaHora(mantenimiento.fechaHoraRegistro)
                  : null
              }
            />
          </SimpleGrid>

          {descripcion && (
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
