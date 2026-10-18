import { useEffect, useState } from "react";

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
import { useGetVehiculosEnMantenimiento } from "../CrearViaje/hooks/useGetVehiculosEnMantenimiento";
import { motivoNoDisponible } from "@features/vehiculos/utils/mantenimiento";
import { useChoferesDisponibles } from "../CrearViaje/hooks/useChoferesDisponibles";
import { toLocalDateTimeString } from "../CrearViaje/utils";
import { choferLabel, vehiculoLabel } from "./utils";

/**
 * Une listas de recursos sin repetir ids (gana la primera aparición).
 */
const sinRepetidos = (...listas) => {
  const vistos = new Set();
  return listas.flat().filter((recurso) => {
    if (vistos.has(recurso.id)) return false;
    vistos.add(recurso.id);
    return true;
  });
};

const ventanaDe = (inicio, fin) => ({
  desde: inicio ? toLocalDateTimeString(inicio) : undefined,
  hasta: fin ? toLocalDateTimeString(fin) : undefined,
});

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
 *    `viajeIdExcluido`; acá se reinyecta el viaje propio (`SHG-BE-006`, trabajo
 *    de `SHG-FE-010`) para que su vehículo/chofer actuales no cuenten como
 *    "ocupados por sí mismos".
 * 2. Regla de disponibilidad (`SHG-FE-128`): un vehículo o chofer sólo se puede
 *    elegir si figura en "disponibles" para la ventana planificada. Excepción:
 *    con la ventana ORIGINAL del viaje, lo ya asignado se conserva y sigue
 *    siendo elegible aunque no figure (datos viejos, p. ej. un mantenimiento
 *    solapado con el viaje, que el backend ya no deja crear). Con una ventana
 *    distinta, lo asignado se evalúa como cualquier otro recurso: cuando las
 *    consultas terminan y no figura como disponible, se lo saca de la
 *    selección y se avisa en el campo (igual que en `CrearViaje`, más el
 *    aviso). No se revisa nada mientras las consultas cargan ni si fallaron.
 * 3. El alcance de edición es más chico (sin wizard de envíos), así que un
 *    selector compacto es suficiente.
 */
const SeccionRecursos = ({
  viajeIdExcluido,
  vehiculoActual,
  choferesActuales,
  inicioOriginal,
  finOriginal,
  sucursalId,
  onValidandoChange,
}) => {
  const { getInputProps, values, setFieldValue } = useFormContext();
  const { desde, hasta } = useDisponibilidadParams();
  const [avisoVehiculo, setAvisoVehiculo] = useState(null);
  const [avisoChoferes, setAvisoChoferes] = useState(null);

  const ventanaOriginal = ventanaDe(inicioOriginal, finOriginal);
  const tieneVentanaOriginal = Boolean(
    ventanaOriginal.desde && ventanaOriginal.hasta,
  );
  const esVentanaOriginal = Boolean(
    desde &&
      hasta &&
      desde === ventanaOriginal.desde &&
      hasta === ventanaOriginal.hasta,
  );
  // Sin ventana original no hay contra qué comparar: se conserva lo asignado y
  // no se revisa nada (igual que con la ventana original).
  const conservarAsignados = esVentanaOriginal || !tieneVentanaOriginal;

  const vehiculosQuery = useGetVehiculosDisponibles({
    desde,
    hasta,
    viajeIdExcluido,
  });
  // Vehículos excluidos de "disponibles" por un mantenimiento solapado con la
  // ventana (SHG-BE-108): se listan deshabilitados y con el motivo.
  const enMantenimientoQuery = useGetVehiculosEnMantenimiento({ desde, hasta });
  const choferesQuery = useChoferesDisponibles({
    desde,
    hasta,
    sucursalId,
    viajeIdExcluido,
  });

  const vehiculosDisponibles = vehiculosQuery.data || [];
  const vehiculosEnMantenimiento = enMantenimientoQuery.data || [];
  const choferesDisponibles = choferesQuery.data || [];

  const vehiculoSeleccionado = values.vehiculo;
  const choferesSeleccionados = values.choferes;

  // Sólo se revisa la selección con la consulta de la ventana vigente ya
  // resuelta: ni cargando ni con error (no vaciar el campo por un fallo de red).
  const vehiculosListos = vehiculosQuery.isSuccess && !vehiculosQuery.isFetching;
  const choferesListos = choferesQuery.isSuccess && !choferesQuery.isFetching;

  // El aviso corresponde a la ventana vigente: se limpia cuando cambia. Va
  // antes de las revisiones para que, si éstas corren en el mismo commit
  // (consulta ya en caché), el aviso nuevo quede puesto.
  useEffect(() => {
    setAvisoVehiculo(null);
    setAvisoChoferes(null);
  }, [desde, hasta]);

  // Con una ventana distinta de la original, mientras cargan las consultas de
  // disponibles, el padre deshabilita Guardar (si fallaron, no bloquea).
  const validando =
    !conservarAsignados &&
    Boolean(desde && hasta) &&
    (vehiculosQuery.isFetching || choferesQuery.isFetching);
  useEffect(() => {
    onValidandoChange?.(validando);
  }, [validando, onValidandoChange]);
  useEffect(() => () => onValidandoChange?.(false), [onValidandoChange]);

  useEffect(() => {
    if (conservarAsignados || !vehiculosListos || !vehiculoSeleccionado) return;
    if (!vehiculosDisponibles.some((v) => v.id === vehiculoSeleccionado.id)) {
      setFieldValue("vehiculo", null);
      setAvisoVehiculo(
        `${vehiculoSeleccionado.patente ?? vehiculoLabel(vehiculoSeleccionado)} no está disponible en esas fechas`,
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conservarAsignados, vehiculosListos, vehiculosQuery.data, vehiculoSeleccionado]);

  useEffect(() => {
    if (conservarAsignados || !choferesListos || choferesSeleccionados.length === 0) {
      return;
    }
    const disponiblesIds = new Set(choferesDisponibles.map((c) => c.id));
    const quitados = choferesSeleccionados.filter((c) => !disponiblesIds.has(c.id));
    if (quitados.length === 0) return;
    setFieldValue(
      "choferes",
      choferesSeleccionados.filter((c) => disponiblesIds.has(c.id)),
    );
    const nombres = quitados.map(choferLabel).join(", ");
    setAvisoChoferes(
      quitados.length === 1
        ? `${nombres} no está disponible en esas fechas`
        : `${nombres} no están disponibles en esas fechas`,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conservarAsignados, choferesListos, choferesQuery.data, choferesSeleccionados]);

  // Con la ventana original lo asignado sigue siendo elegible aunque no figure
  // en "disponibles" (ver punto 2 del comentario del componente). Si figura en
  // mantenimiento, queda la entrada deshabilitada con su motivo. La selección
  // actual se mantiene siempre en las opciones para que el campo muestre su
  // etiqueta mientras cargan las consultas.
  const vehiculos = sinRepetidos(
    vehiculosDisponibles,
    vehiculosEnMantenimiento,
    conservarAsignados && vehiculoActual ? [vehiculoActual] : [],
    vehiculoSeleccionado ? [vehiculoSeleccionado] : [],
  );

  const choferes = sinRepetidos(
    choferesDisponibles,
    conservarAsignados ? choferesActuales || [] : [],
    choferesSeleccionados,
  );

  const vehiculoOptions = vehiculos.map((vehiculo) => {
    const enMantenimiento = vehiculosEnMantenimiento.some((v) => v.id === vehiculo.id);
    return {
      value: vehiculo.id.toString(),
      label: enMantenimiento
        ? `${vehiculoLabel(vehiculo)} - ${motivoNoDisponible(vehiculo)}`
        : vehiculoLabel(vehiculo),
      disabled: enMantenimiento,
    };
  });

  const choferOptions = choferes.map((chofer) => ({
    value: chofer.id.toString(),
    label: choferLabel(chofer),
  }));

  const handleVehiculoChange = (value) => {
    setAvisoVehiculo(null);
    setFieldValue(
      "vehiculo",
      vehiculos.find((vehiculo) => vehiculo.id.toString() === value) ?? null,
    );
  };

  const handleChoferesChange = (values_) => {
    setAvisoChoferes(null);
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
          error={getInputProps("vehiculo").error || avisoVehiculo}
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
          error={getInputProps("choferes").error || avisoChoferes}
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
