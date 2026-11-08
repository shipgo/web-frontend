import {
  Badge,
  Card,
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

import { EMPTY, formatPeso } from "@domain/format";
import { toLocalDate } from "@utils/dates";
import FormSections from "./FormSections";
import { useFormSections } from "./useFormSections";
import { mantenimientoEtiqueta } from "../utils/mantenimiento";

const InfoItem = ({ icon, label, value, color = "blue" }) => {
  const Icon = icon;

  return (
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
          {value || EMPTY}
        </Text>
      </Stack>
    </Group>
  );
};

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
 * @param {{ fechaHoraMantenimiento: string, fechaHoraFin: string, vigente: boolean }} [props.mantenimiento] -
 *   Mantenimiento vigente o próximo (`VehiculoDTO.mantenimiento`, SHG-BE-108), si lo hay.
 */
const VehiculoPerfilContenido = ({ vehiculo, showAllInfo, mantenimiento }) => {

  const sections = [
    {
      value: "specs",
      title: "Especificaciones técnicas",
      icon: <IconGasStation size={20} stroke={1.5} />,
      fields: [],
      children: (
        <>
              <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg">
                <InfoItem
                  icon={IconGasStation}
                  label="Combustible"
                  value={vehiculo.combustible?.nombre}
                  color="red"
                />
                <InfoItem
                  icon={IconGauge}
                  label="Consumo promedio"
                  value={
                    vehiculo.consumoPromedio
                      ? `${vehiculo.consumoPromedio} L/100km`
                      : null
                  }
                  color="orange"
                />
              </SimpleGrid>
        </>
      ),
    },
    {
      value: "ruedas",
      title: "Ruedas y capacidad",
      icon: <IconRuler size={20} stroke={1.5} />,
      fields: [],
      children: (
        <>
              <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="lg">
                <InfoItem
                  icon={IconRuler}
                  label="Tipo de rueda"
                  value={vehiculo.tipoRueda?.nombre || vehiculo.tipo_rueda?.nombre}
                  color="violet"
                />
                <InfoItem
                  icon={IconId}
                  label="Cantidad de ruedas"
                  value={vehiculo.cantidadRuedas}
                  color="violet"
                />
                <InfoItem
                  icon={IconWeight}
                  label="Peso máximo"
                  value={
                    vehiculo.pesoMaximo
                      ? formatPeso(vehiculo.pesoMaximo)
                      : null
                  }
                  color="violet"
                />
              </SimpleGrid>
        </>
      ),
    },
    {
      value: "adicional",
      title: "Información adicional",
      icon: <IconCalendar size={20} stroke={1.5} />,
      fields: [],
      children: (
        <>
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
                      label="Fecha de registro"
                      value={toLocalDate(vehiculo.fechaCreacion || vehiculo.createdAt)}
                      color="green"
                    />
                  )}
                </SimpleGrid>
        </>
      ),
    },
  ].filter((s) => s.value !== "adicional" || vehiculo.sucursal || vehiculo.fechaCreacion || vehiculo.createdAt);
  const { opened, setOpened } = useFormSections(sections);

  const marcaModelo = vehiculo.modelo?.marca?.nombre && vehiculo.modelo?.nombre
    ? `${vehiculo.modelo.marca.nombre} ${vehiculo.modelo.nombre}`
    : vehiculo.marca?.nombre || "Sin modelo";

  const tipoVehiculo = vehiculo.tipoVehiculo?.nombre || vehiculo.tipo_vehiculo?.nombre || "Sin tipo";
  const status = vehiculo.estado || vehiculo.status;

  return (
    <Stack>
      {/* Información Principal */}
      <Card>
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

          {mantenimiento && (
            <Badge color="orange" variant="light" size="lg" w="fit-content">
              {mantenimientoEtiqueta(mantenimiento)}
            </Badge>
          )}

          <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md">
            <InfoItem
              icon={IconCar}
              label="Tipo de vehículo"
              value={tipoVehiculo}
              color="blue"
            />
            <InfoItem
              icon={IconCalendar}
              label="Año de compra"
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
        <FormSections sections={sections} opened={opened} onChange={setOpened} />
      )}
    </Stack>
  );
};

const VehiculoPerfil = ({ vehiculo, showAllInfo = true, mantenimiento = null }) =>
  vehiculo ? (
    <VehiculoPerfilContenido vehiculo={vehiculo} showAllInfo={showAllInfo} mantenimiento={mantenimiento} />
  ) : (
    <Card>
      <Text c="dimmed">No se encontró información del vehículo</Text>
    </Card>
  );

export default VehiculoPerfil;

