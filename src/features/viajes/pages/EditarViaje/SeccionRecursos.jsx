import {
  Box,
  Card,
  Group,
  MultiSelect,
  Select,
  SimpleGrid,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from "@mantine/core";
import { IconTruckDelivery } from "@tabler/icons-react";

import { useFormContext } from "../CrearViaje/contexts/EnviosFormContext";
import { useDisponibilidadParams } from "../CrearViaje/hooks/useDisponibilidadParams";
import { useGetVehiculosDisponibles } from "../CrearViaje/hooks/useGetVehiculosDisponibles";
import { useChoferesDisponibles } from "../CrearViaje/hooks/useChoferesDisponibles";
import { choferLabel, vehiculoLabel } from "./utils";

/**
 * Asignación de recursos en modo edición. Comparte el encabezado de sección
 * (icono + título + bajada) y las fechas planificadas con `CrearViaje`
 * (`SeccionRecursos` + `SeccionDetalles`), pero mantiene una composición
 * propia para el selector de vehículo/choferes en vez de reusar los
 * `ListadoVehiculos`/`ListadoChoferes` del wizard:
 *
 * 1. Los listados del wizard están cableados a `useDisponibilidadParams()` sin
 *    `viajeIdExcluido` y al modelo de selección por objetos del
 *    `EnviosFormContext` del wizard; acá se necesita reinyectar el viaje
 *    propio (`SHG-BE-006`, trabajo de `SHG-FE-010`) y precargar la selección
 *    vigente.
 * 2. El vehículo/chofer actualmente asignado puede no figurar en
 *    "disponibles" (si la ventana de fechas cambió respecto de la original);
 *    se lo agrega igual a las opciones para no perder la selección y que el
 *    usuario pueda guardar sin verse forzado a cambiar de recurso.
 * 3. El alcance de edición es más chico (sin wizard de envíos), así que un
 *    selector compacto es suficiente.
 */
const SeccionRecursos = ({ viajeIdExcluido, vehiculoActual, choferesActuales }) => {
  const { getInputProps } = useFormContext();
  const { desde, hasta } = useDisponibilidadParams();

  const vehiculosQuery = useGetVehiculosDisponibles({
    desde,
    hasta,
    viajeIdExcluido,
  });
  const choferesQuery = useChoferesDisponibles({
    desde,
    hasta,
    viajeIdExcluido,
  });

  const vehiculos = vehiculosQuery.data || [];
  const choferes = choferesQuery.data || [];

  const vehiculoOptions = [
    ...vehiculos,
    ...(vehiculoActual && !vehiculos.some((v) => v.id === vehiculoActual.id)
      ? [vehiculoActual]
      : []),
  ].map((vehiculo) => ({
    value: vehiculo.id.toString(),
    label: vehiculoLabel(vehiculo),
  }));

  const choferOptions = [
    ...choferes,
    ...(choferesActuales || []).filter(
      (chofer) => !choferes.some((c) => c.id === chofer.id),
    ),
  ].map((chofer) => ({
    value: chofer.id.toString(),
    label: choferLabel(chofer),
  }));

  return (
    <Card padding="lg" component={Stack}>
      <Group gap="0.75rem">
        <ThemeIcon size="xl" variant="light">
          <IconTruckDelivery />
        </ThemeIcon>

        <Box>
          <Title order={4}>Asignación de recursos</Title>
          <Text c="dimmed" size="sm">
            Asigná el vehículo y los choferes disponibles para la ventana de
            fechas planificada
          </Text>
        </Box>
      </Group>

      <SimpleGrid cols={{ base: 1, sm: 2 }}>
        <Select
          label="Vehículo"
          placeholder="Seleccioná un vehículo"
          data={vehiculoOptions}
          searchable
          nothingFoundMessage="No hay vehículos disponibles"
          disabled={vehiculosQuery.isFetching}
          {...getInputProps("vehiculoID")}
        />

        <MultiSelect
          label="Choferes"
          placeholder="Seleccioná uno o más choferes"
          data={choferOptions}
          searchable
          nothingFoundMessage="No hay choferes disponibles"
          disabled={choferesQuery.isFetching}
          {...getInputProps("choferesID")}
        />
      </SimpleGrid>
    </Card>
  );
};

export default SeccionRecursos;
