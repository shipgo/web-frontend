import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useParams } from "wouter";
import {
  Badge,
  Box,
  Button,
  Card,
  Group,
  MultiSelect,
  Select,
  SimpleGrid,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { DateTimePicker } from "@mantine/dates";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { IconCalendar, IconCheck, IconX } from "@tabler/icons-react";
import dayjs from "dayjs";

import { estadoBadge, normalizarEstado } from "@domain/estados";
import { viajeApi } from "../../api/viajes.api";
import { useGetVehiculosDisponibles } from "../CrearViaje/hooks/useGetVehiculosDisponibles";
import { useChoferesDisponibles } from "../CrearViaje/hooks/useChoferesDisponibles";
import { useDisponibilidadParams } from "./hooks/useDisponibilidadParams";
import {
  buildViajeReqDTO,
  choferLabel,
  vehiculoLabel,
} from "./utils";

/**
 * Estados de viaje en los que esta pantalla permite editar. Más restrictivo
 * a propósito que `DetalleViaje/acciones.js` (`puedeEditar`, que sólo
 * bloquea los terminales `finalizado`/`cancelado` para decidir si se
 * muestra el botón "Editar"): acá el criterio de aceptación de `SHG-FE-010`
 * pide limitarlo a `creado`/`planificado`. Motivo: `CONTRACTS.md §8`/
 * `SHG-BE-021` establecen que el cliente en creación y edición manda sólo
 * las 2 fechas planificadas, nunca `fechaHoraInicio`/`fechaHoraFin` reales
 * (esas las completa el backend server-side al iniciar/finalizar). Editar
 * un viaje ya iniciado no tiene sentido para el MVP de todos modos, así que
 * se restringe la pantalla a los estados donde esas fechas reales siempre
 * son `null`. (El `ModelMapper` global tiene `setSkipNullEnabled(true)`, o
 * sea que de todos modos no pisaría un valor ya seteado con `null` si se
 * reenviara — no es un riesgo de overwrite, es simplemente lo que pide el
 * contrato.) Si `DetalleViaje` termina mostrando "Editar" para un viaje que
 * esta pantalla bloquea, es una inconsistencia a reconciliar aparte
 * (`SHG-FE-029`, ver `planning/coordination/frontend.md`).
 */
const ESTADOS_EDITABLES = ["creado", "planificado"];

const EditarViaje = () => {
  const { id } = useParams();
  const [, navigate] = useLocation();

  const [loading, setLoading] = useState(false);
  const [loadingViaje, setLoadingViaje] = useState(true);
  const [viajeOriginal, setViajeOriginal] = useState(null);

  const form = useForm({
    initialValues: {
      vehiculoID: null,
      choferesID: [],
      fechaHoraInicioPlanificada: null,
      fechaHoraFinPlanificada: null,
    },
    validate: {
      vehiculoID: (value) => (!value ? "Debés seleccionar un vehículo" : null),
      choferesID: (value) =>
        !value || value.length === 0
          ? "Debés seleccionar al menos un chofer"
          : null,
      fechaHoraInicioPlanificada: (value) =>
        !value ? "Debés seleccionar la fecha de salida planificada" : null,
      fechaHoraFinPlanificada: (value, values) => {
        if (!value) return "Debés seleccionar la fecha de llegada planificada";
        if (
          values.fechaHoraInicioPlanificada &&
          dayjs(value).isBefore(dayjs(values.fechaHoraInicioPlanificada))
        ) {
          return "La fecha de llegada no puede ser anterior a la de salida";
        }
        return null;
      },
    },
  });

  const esEditable = useMemo(
    () =>
      Boolean(
        viajeOriginal &&
          ESTADOS_EDITABLES.includes(normalizarEstado(viajeOriginal.estado)),
      ),
    [viajeOriginal],
  );

  const { desde, hasta } = useDisponibilidadParams(
    form.values.fechaHoraInicioPlanificada,
    form.values.fechaHoraFinPlanificada,
  );
  const viajeIdExcluido = id ? Number(id) : undefined;

  // Si el viaje no es editable no tiene sentido pedir disponibilidad (la
  // pantalla ya bloquea el form entero más abajo).
  const vehiculosQuery = useGetVehiculosDisponibles({
    desde: esEditable ? desde : undefined,
    hasta: esEditable ? hasta : undefined,
    viajeIdExcluido,
  });

  const choferesQuery = useChoferesDisponibles({
    desde: esEditable ? desde : undefined,
    hasta: esEditable ? hasta : undefined,
    viajeIdExcluido,
  });

  useEffect(() => {
    const loadViaje = async () => {
      try {
        setLoadingViaje(true);
        const viaje = await viajeApi.getById(id);

        setViajeOriginal(viaje);
        form.setValues({
          vehiculoID: viaje.vehiculo?.id?.toString() || null,
          choferesID: (viaje.choferes || []).map((chofer) =>
            chofer.id?.toString()
          ),
          fechaHoraInicioPlanificada: viaje.fechaHoraInicioPlanificada
            ? new Date(viaje.fechaHoraInicioPlanificada)
            : null,
          fechaHoraFinPlanificada: viaje.fechaHoraFinPlanificada
            ? new Date(viaje.fechaHoraFinPlanificada)
            : null,
        });
      } catch (error) {
        console.error("Error cargando viaje:", error);
        notifications.show({
          title: "Error",
          message: "No se pudo cargar el viaje",
          color: "red",
          icon: <IconX />,
        });
        navigate("~/viajes");
      } finally {
        setLoadingViaje(false);
      }
    };

    if (id) {
      loadViaje();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleSubmit = useCallback(
    async (values) => {
      if (!viajeOriginal || !esEditable) return;

      try {
        setLoading(true);

        const payload = buildViajeReqDTO(values, viajeOriginal);

        await viajeApi.update(id, payload);

        notifications.show({
          title: "Viaje actualizado",
          message: "Los cambios se guardaron correctamente",
          color: "green",
          icon: <IconCheck />,
        });

        navigate(`~/viajes/${id}`);
      } catch (error) {
        console.error("Error actualizando viaje:", error);

        // 400 de validación de campos (`ApiFieldError`, CONTRACTS.md §5): manejo
        // básico por campo hasta que exista el helper global de SHG-FE-021.
        // El backend valida sobre `ViajeReqDTO.viaje` anidado, así que los
        // `field` vienen prefijados "viaje." (ej. "viaje.vehiculoID"); se
        // saca ese prefijo para que matcheen los nombres planos del form.
        const responseData = error?.response?.data;
        if (Array.isArray(responseData?.fields) && responseData.fields.length > 0) {
          form.setErrors(
            Object.fromEntries(
              responseData.fields.map(({ field, error: fieldError }) => [
                field.replace(/^viaje\./, ""),
                fieldError,
              ])
            )
          );
        }

        notifications.show({
          title: "Error",
          message: responseData?.message || "No se pudo actualizar el viaje",
          color: "red",
          icon: <IconX />,
        });
      } finally {
        setLoading(false);
      }
    },
    [id, navigate, viajeOriginal, esEditable, form]
  );

  const handleVolver = useCallback(() => {
    navigate(`~/viajes/${id}`);
  }, [navigate, id]);

  const vehiculos = vehiculosQuery.data || [];
  const choferes = choferesQuery.data || [];

  // El vehículo/chofer actualmente asignado puede no figurar en "disponibles"
  // (por ejemplo si la ventana de fechas cambió respecto de la original); lo
  // agregamos igual para no perder la selección vigente y que el usuario
  // pueda guardar sin verse forzado a cambiar de recurso.
  const vehiculoOptions = [
    ...vehiculos,
    ...(viajeOriginal?.vehiculo &&
    !vehiculos.some((v) => v.id === viajeOriginal.vehiculo.id)
      ? [viajeOriginal.vehiculo]
      : []),
  ].map((vehiculo) => ({
    value: vehiculo.id.toString(),
    label: vehiculoLabel(vehiculo),
  }));

  const choferOptions = [
    ...choferes,
    ...(viajeOriginal?.choferes || []).filter(
      (chofer) => !choferes.some((c) => c.id === chofer.id)
    ),
  ].map((chofer) => ({
    value: chofer.id.toString(),
    label: choferLabel(chofer),
  }));

  if (loadingViaje) {
    return (
      <Stack m="auto" maw="1400" gap="xl" p={{ base: "md", sm: "lg" }}>
        <Card shadow="sm" p="lg" radius="md" withBorder>
          <Text>Cargando...</Text>
        </Card>
      </Stack>
    );
  }

  if (viajeOriginal && !esEditable) {
    const { label, color } = estadoBadge("viaje", viajeOriginal.estado);

    return (
      <Stack m="auto" maw="1400" gap="xl" p={{ base: "md", sm: "lg" }}>
        <Card shadow="sm" p="lg" radius="md" withBorder>
          <Group justify="space-between" align="center">
            <Box>
              <Title order={2} mb={4}>
                Editar viaje #{id}
              </Title>
              <Text size="sm" c="dimmed">
                Este viaje no se puede editar en su estado actual
              </Text>
            </Box>

            <Button variant="subtle" onClick={handleVolver}>
              Volver
            </Button>
          </Group>
        </Card>

        <Card shadow="sm" p="lg" radius="md" withBorder>
          <Stack align="center" py="xl" gap="sm">
            <Badge color={color} size="lg">
              {label}
            </Badge>
            <Text c="dimmed" ta="center">
              Sólo se pueden editar viajes en estado &quot;Creado&quot; o
              &quot;Planificado&quot;.
            </Text>
            <Button onClick={handleVolver}>Volver al detalle</Button>
          </Stack>
        </Card>
      </Stack>
    );
  }

  return (
    <Stack m="auto" maw="1400" gap="xl" p={{ base: "md", sm: "lg" }}>
      <Card shadow="sm" p="lg" radius="md" withBorder>
        <Group justify="space-between" align="center">
          <Box>
            <Title order={2} mb={4}>
              Editar viaje #{id}
            </Title>
            <Text size="sm" c="dimmed">
              Modificá el vehículo, los choferes y las fechas planificadas del
              viaje
            </Text>
          </Box>

          <Button variant="subtle" onClick={handleVolver}>
            Volver
          </Button>
        </Group>
      </Card>

      <Card shadow="sm" p="lg" radius="md" withBorder component="form" onSubmit={form.onSubmit(handleSubmit)}>
        <Stack>
          <SimpleGrid cols={{ base: 1, sm: 2 }}>
            <Select
              label="Vehículo"
              placeholder="Seleccioná un vehículo"
              data={vehiculoOptions}
              searchable
              nothingFoundMessage="No hay vehículos disponibles"
              disabled={vehiculosQuery.isFetching}
              {...form.getInputProps("vehiculoID")}
            />

            <MultiSelect
              label="Choferes"
              placeholder="Seleccioná uno o más choferes"
              data={choferOptions}
              searchable
              nothingFoundMessage="No hay choferes disponibles"
              disabled={choferesQuery.isFetching}
              {...form.getInputProps("choferesID")}
            />

            <DateTimePicker
              label="Fecha y hora de salida planificada"
              placeholder="Seleccioná una fecha"
              leftSection={<IconCalendar size={18} />}
              valueFormat="DD/MM/YYYY HH:mm"
              {...form.getInputProps("fechaHoraInicioPlanificada")}
            />

            <DateTimePicker
              label="Fecha y hora de llegada planificada"
              placeholder="Seleccioná una fecha"
              leftSection={<IconCalendar size={18} />}
              valueFormat="DD/MM/YYYY HH:mm"
              {...form.getInputProps("fechaHoraFinPlanificada")}
            />
          </SimpleGrid>

          <Group justify="flex-end">
            <Button variant="light" color="red" onClick={handleVolver}>
              Cancelar
            </Button>
            <Button type="submit" loading={loading}>
              Guardar cambios
            </Button>
          </Group>
        </Stack>
      </Card>
    </Stack>
  );
};

export default EditarViaje;
