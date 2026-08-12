import { useCallback, useEffect, useState } from "react";
import { useLocation, useParams } from "wouter";
import {
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
import { useQuery } from "@tanstack/react-query";
import { IconCalendar, IconCheck, IconX } from "@tabler/icons-react";
import dayjs from "dayjs";

import { usuarioApi, vehiculoApi } from "@api";
import { viajeApi } from "../../api/viajes.api";

/**
 * Reconstruye el arreglo `enviosPuntoEntrega` a partir de los recorridos
 * existentes del viaje, agrupando los envíos ya asignados a cada recorrido.
 * Esta pantalla no permite modificar qué envíos viajan ni su punto de
 * entrega/sucursal destino: solo reenvía lo que ya existía para que el PUT
 * (que exige el contrato completo) no pierda esa información.
 */
const buildEnviosPuntoEntrega = (recorridos = []) =>
  recorridos.map((recorrido) => ({
    enviosID: (recorrido.detalleRecorridos || []).map(
      (detalle) => detalle.envio?.id
    ),
    puntoEntregaID: recorrido.puntoEntrega?.id ?? null,
    sucursalDestinoID: recorrido.sucursalDestino?.id ?? null,
  }));

const vehiculoLabel = (vehiculo) =>
  [vehiculo.patente, vehiculo.modelo?.nombre].filter(Boolean).join(" - ");

const choferLabel = (chofer) =>
  [chofer.nombre, chofer.apellido].filter(Boolean).join(" ") ||
  chofer.username ||
  `Chofer ${chofer.id}`;

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

  const vehiculosQuery = useQuery({
    queryKey: ["viajes", "editar", "vehiculos"],
    queryFn: () => vehiculoApi.getAll(),
  });

  const choferesQuery = useQuery({
    queryKey: ["viajes", "editar", "choferes"],
    queryFn: () => usuarioApi.getChoferes(),
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
      if (!viajeOriginal) return;

      try {
        setLoading(true);

        const payload = {
          viaje: {
            fechaHoraInicio: viajeOriginal.fechaHoraInicio,
            fechaHoraFin: viajeOriginal.fechaHoraFin,
            fechaHoraInicioPlanificada: dayjs(
              values.fechaHoraInicioPlanificada
            ).toISOString(),
            fechaHoraFinPlanificada: dayjs(
              values.fechaHoraFinPlanificada
            ).toISOString(),
            vehiculoID: Number(values.vehiculoID),
            choferesID: values.choferesID.map(Number),
          },
          enviosPuntoEntrega: buildEnviosPuntoEntrega(
            viajeOriginal.recorridos
          ),
        };

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
        notifications.show({
          title: "Error",
          message:
            error.response?.data?.message || "No se pudo actualizar el viaje",
          color: "red",
          icon: <IconX />,
        });
      } finally {
        setLoading(false);
      }
    },
    [id, navigate, viajeOriginal]
  );

  const handleVolver = useCallback(() => {
    navigate(`~/viajes/${id}`);
  }, [navigate, id]);

  const vehiculos = vehiculosQuery.data || [];
  const choferes = choferesQuery.data || [];

  // El vehículo/chofer actualmente asignado puede no figurar en los listados
  // de "disponibles"; lo agregamos igual para no perder la selección vigente.
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
