import {
  Badge,
  Card,
  Divider,
  Group,
  SimpleGrid,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import {
  IconCar,
  IconGasStation,
  IconCalendar,
  IconRuler,
  IconGauge,
  IconWeight,
  IconId,
} from "@tabler/icons-react";

import { toLocalDate } from "@utils/dates";

const InfoItem = ({ icon: Icon, label, value, color = "blue" }) => (
  <Group gap="sm" wrap="nowrap">
    <Icon
      size={20}
      stroke={1.5}
      style={{ color: `var(--mantine-color-${color}-6)` }}
    />
    <Stack gap={0} style={{ flex: 1 }}>
      <Text size="xs" c="dimmed" fw={500}>
        {label}
      </Text>
      <Text size="sm" fw={500}>
        {value || "No especificado"}
      </Text>
    </Stack>
  </Group>
);

const getStatusColor = (status) => {
  const normalizedStatus = status?.toLowerCase();
  const colores = {
    activo: "green",
    disponible: "green",
    inactivo: "red",
    mantenimiento: "orange",
    "en uso": "blue",
    "en_uso": "blue",
  };
  return colores[normalizedStatus] || "gray";
};

const getStatusLabel = (status) => {
  if (!status) return "Sin estado";
  return status.replace(/_/g, " ");
};

/**
 * Componente reutilizable para mostrar el perfil/detalle de un vehículo
 * @param {Object} props
 * @param {Object} props.vehiculo - Datos del vehículo a mostrar
 * @param {boolean} props.showAllInfo - Si debe mostrar toda la información o solo la básica
 */
const VehiculoPerfil = ({ vehiculo, showAllInfo = true }) => {
  if (!vehiculo) {
    return (
      <Card shadow="sm" p="xl" radius="md" withBorder>
        <Text c="dimmed">No se encontró información del vehículo</Text>
      </Card>
    );
  }

  const marcaModelo = vehiculo.modelo?.marca?.nombre && vehiculo.modelo?.nombre
    ? `${vehiculo.modelo.marca.nombre} ${vehiculo.modelo.nombre}`
    : vehiculo.marca?.nombre || "Sin modelo";

  const tipoVehiculo = vehiculo.tipoVehiculo?.nombre || vehiculo.tipo_vehiculo?.nombre || "Sin tipo";
  const status = vehiculo.estado || vehiculo.status;

  return (
    <Stack gap="lg">
      {/* Información Principal */}
      <Card shadow="sm" p="xl" radius="md" withBorder>
        <Stack gap="md">
          <Group justify="space-between" wrap="wrap">
            <div>
              <Title order={2}>{vehiculo.patente}</Title>
              <Text size="lg" c="dimmed" fw={500}>
                {marcaModelo}
              </Text>
            </div>

            {status && (
              <Badge
                color={getStatusColor(status)}
                variant="light"
                size="lg"
              >
                {getStatusLabel(status)}
              </Badge>
            )}
          </Group>

          <Divider />

          <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md">
            <InfoItem
              icon={IconCar}
              label="Tipo de Vehículo"
              value={tipoVehiculo}
              color="blue"
            />
            <InfoItem
              icon={IconCalendar}
              label="Año de Compra"
              value={vehiculo.anioCompra}
              color="cyan"
            />
            <InfoItem
              icon={IconGauge}
              label="Kilometraje"
              value={
                vehiculo.kilometraje !== null &&
                vehiculo.kilometraje !== undefined
                  ? `${vehiculo.kilometraje.toLocaleString("es-AR")} km`
                  : null
              }
              color="orange"
            />
          </SimpleGrid>
        </Stack>
      </Card>

      {showAllInfo && (
        <>
          {/* Especificaciones Técnicas */}
          <Card shadow="sm" p="xl" radius="md" withBorder>
            <Group gap="sm" mb="md">
              <IconGasStation size={24} stroke={1.5} />
              <Text fw={600} size="lg">
                Especificaciones Técnicas
              </Text>
            </Group>
            <Divider mb="lg" />
            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg">
              <InfoItem
                icon={IconGasStation}
                label="Combustible"
                value={vehiculo.combustible?.nombre}
                color="red"
              />
              <InfoItem
                icon={IconGauge}
                label="Consumo Promedio"
                value={
                  vehiculo.consumoPromedio
                    ? `${vehiculo.consumoPromedio} L/100km`
                    : null
                }
                color="orange"
              />
            </SimpleGrid>
          </Card>

          {/* Información de Ruedas y Capacidad */}
          <Card shadow="sm" p="xl" radius="md" withBorder>
            <Group gap="sm" mb="md">
              <IconRuler size={24} stroke={1.5} />
              <Text fw={600} size="lg">
                Ruedas y Capacidad
              </Text>
            </Group>
            <Divider mb="lg" />
            <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="lg">
              <InfoItem
                icon={IconRuler}
                label="Tipo de Rueda"
                value={vehiculo.tipoRueda?.nombre || vehiculo.tipo_rueda?.nombre}
                color="violet"
              />
              <InfoItem
                icon={IconId}
                label="Cantidad de Ruedas"
                value={vehiculo.cantidadRuedas}
                color="violet"
              />
              <InfoItem
                icon={IconWeight}
                label="Peso Máximo"
                value={
                  vehiculo.pesoMaximo
                    ? `${vehiculo.pesoMaximo.toLocaleString("es-AR")} kg`
                    : null
                }
                color="violet"
              />
            </SimpleGrid>
          </Card>

          {/* Información Adicional */}
          {(vehiculo.sucursal || vehiculo.fechaCreacion || vehiculo.createdAt) && (
            <Card shadow="sm" p="xl" radius="md" withBorder>
              <Group gap="sm" mb="md">
                <IconCalendar size={24} stroke={1.5} />
                <Text fw={600} size="lg">
                  Información Adicional
                </Text>
              </Group>
              <Divider mb="lg" />
              <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg">
                {vehiculo.sucursal && (
                  <InfoItem
                    icon={IconCar}
                    label="Sucursal"
                    value={vehiculo.sucursal.nombre}
                    color="green"
                  />
                )}
                {(vehiculo.fechaCreacion || vehiculo.createdAt) && (
                  <InfoItem
                    icon={IconCalendar}
                    label="Fecha de Registro"
                    value={toLocalDate(vehiculo.fechaCreacion || vehiculo.createdAt)}
                    color="green"
                  />
                )}
              </SimpleGrid>
            </Card>
          )}
        </>
      )}
    </Stack>
  );
};

export default VehiculoPerfil;

