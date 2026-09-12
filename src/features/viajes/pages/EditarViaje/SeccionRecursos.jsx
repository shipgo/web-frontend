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
 * (`SeccionRecursos` + `SeccionDetalles`), y desde `SHG-FE-049` también el
 * shape del form (`values.vehiculo`/`values.choferes` son objetos completos,
 * igual que en `CrearViaje` — no ids sueltos), lo que permite reusar
 * `SeccionEnvios`/`SeccionResumen` sin cambios. Mantiene, sin embargo, una
 * composición propia para el selector de vehículo/choferes en vez de reusar
 * los `ListadoVehiculos`/`ListadoChoferes` del wizard:
 *
 * 1. Los listados del wizard están cableados a `useDisponibilidadParams()` sin
 *    `viajeIdExcluido`; acá se necesita reinyectar el viaje propio
 *    (`SHG-BE-006`, trabajo de `SHG-FE-010`) para que su vehículo/chofer
 *    actuales no cuenten como "ocupados por sí mismos".
 * 2. El vehículo/chofer actualmente asignado puede no figurar en
 *    "disponibles" (si la ventana de fechas cambió respecto de la original);
 *    se lo agrega igual a las opciones para no perder la selección y que el
 *    usuario pueda guardar sin verse forzado a cambiar de recurso. Los
 *    `ListaVehiculosDisponibles`/`ListadoChoferes` del wizard, en cambio,
 *    limpian la selección apenas deja de figurar en la lista "disponible"
 *    cruda — comportamiento correcto en creación (no hay recurso previo que
 *    preservar) pero no en edición.
 * 3. El alcance de edición es más chico (sin wizard de envíos), así que un
 *    selector compacto es suficiente.
 */
const SeccionRecursos = ({ viajeIdExcluido, vehiculoActual, choferesActuales }) => {
  const { getInputProps, values, setFieldValue } = useFormContext();
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

  const vehiculosDisponibles = vehiculosQuery.data || [];
  const choferesDisponibles = choferesQuery.data || [];

  const vehiculos = [
    ...vehiculosDisponibles,
    ...(vehiculoActual && !vehiculosDisponibles.some((v) => v.id === vehiculoActual.id)
      ? [vehiculoActual]
      : []),
  ];

  const choferes = [
    ...choferesDisponibles,
    ...(choferesActuales || []).filter(
      (chofer) => !choferesDisponibles.some((c) => c.id === chofer.id),
    ),
  ];

  const vehiculoOptions = vehiculos.map((vehiculo) => ({
    value: vehiculo.id.toString(),
    label: vehiculoLabel(vehiculo),
  }));

  const choferOptions = choferes.map((chofer) => ({
    value: chofer.id.toString(),
    label: choferLabel(chofer),
  }));

  const handleVehiculoChange = (value) => {
    setFieldValue(
      "vehiculo",
      vehiculos.find((vehiculo) => vehiculo.id.toString() === value) ?? null,
    );
  };

  const handleChoferesChange = (values_) => {
    setFieldValue(
      "choferes",
      values_
        .map((value) => choferes.find((chofer) => chofer.id.toString() === value))
        .filter(Boolean),
    );
  };

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
          {...getInputProps("vehiculo")}
          label="Vehículo"
          placeholder="Seleccioná un vehículo"
          data={vehiculoOptions}
          value={values.vehiculo?.id?.toString() ?? null}
          onChange={handleVehiculoChange}
          searchable
          nothingFoundMessage="No hay vehículos disponibles"
          disabled={vehiculosQuery.isFetching}
        />

        <MultiSelect
          {...getInputProps("choferes")}
          label="Choferes"
          placeholder="Seleccioná uno o más choferes"
          data={choferOptions}
          value={values.choferes.map((chofer) => chofer.id.toString())}
          onChange={handleChoferesChange}
          searchable
          nothingFoundMessage="No hay choferes disponibles"
          disabled={choferesQuery.isFetching}
        />
      </SimpleGrid>
    </Card>
  );
};

export default SeccionRecursos;
