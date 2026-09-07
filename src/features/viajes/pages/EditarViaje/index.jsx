import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useParams } from "wouter";
import { Badge, Box, Button, Card, Stack, Text } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconCheck, IconX } from "@tabler/icons-react";
import dayjs from "dayjs";

import PageContainer from "@components/PageContainer";
import PageBreadcrumbsHeader from "@components/PageBreadcrumbsHeader";
import ScreenContainer from "@components/ScreenContainer";

import { estadoBadge, normalizarEstado } from "@domain/estados";
import { applyApiError } from "@domain/apiError";

import { VIAJE_ESTADOS_EDITABLES } from "../../constants";
import { viajeApi } from "../../api/viajes.api";
import SeccionDetalles from "../CrearViaje/SeccionDetalles";
import {
  FormProvider,
  useForm,
} from "../CrearViaje/contexts/EnviosFormContext";

import SeccionRecursos from "./SeccionRecursos";
import Footer from "./Footer";
import { buildViajeReqDTO } from "./utils";

const INITIAL_VALUES = {
  vehiculoID: null,
  choferesID: [],
  fechaHoraInicioPlanificada: null,
  fechaHoraFinPlanificada: null,
};

const validate = {
  vehiculoID: (value) => (!value ? "Seleccioná un vehículo" : null),
  choferesID: (value) =>
    !value || value.length === 0 ? "Seleccioná al menos un chofer" : null,
  fechaHoraInicioPlanificada: (value) =>
    !value ? "Seleccioná la fecha de salida planificada" : null,
  fechaHoraFinPlanificada: (value, values) => {
    if (!value) return "Seleccioná la fecha de llegada planificada";
    if (
      values.fechaHoraInicioPlanificada &&
      dayjs(value).isBefore(dayjs(values.fechaHoraInicioPlanificada))
    ) {
      return "La llegada planificada no puede ser anterior a la salida";
    }
    return null;
  },
};

const EditarViaje = () => {
  const { id } = useParams();
  const [, navigate] = useLocation();

  const [loading, setLoading] = useState(false);
  const [loadingViaje, setLoadingViaje] = useState(true);
  const [errorViaje, setErrorViaje] = useState(false);
  const [viajeOriginal, setViajeOriginal] = useState(null);

  const form = useForm({ initialValues: INITIAL_VALUES, validate });

  const esEditable = useMemo(
    () =>
      Boolean(
        viajeOriginal &&
          VIAJE_ESTADOS_EDITABLES.includes(normalizarEstado(viajeOriginal.estado)),
      ),
    [viajeOriginal],
  );

  const loadViaje = useCallback(async () => {
    if (!id) return;

    try {
      setLoadingViaje(true);
      setErrorViaje(false);
      const viaje = await viajeApi.getById(id);

      setViajeOriginal(viaje);
      if (viaje) {
        form.setValues({
          vehiculoID: viaje.vehiculo?.id?.toString() || null,
          choferesID: (viaje.choferes || []).map((chofer) =>
            chofer.id?.toString(),
          ),
          fechaHoraInicioPlanificada: viaje.fechaHoraInicioPlanificada
            ? new Date(viaje.fechaHoraInicioPlanificada)
            : null,
          fechaHoraFinPlanificada: viaje.fechaHoraFinPlanificada
            ? new Date(viaje.fechaHoraFinPlanificada)
            : null,
        });
      }
    } catch (err) {
      console.error("Error cargando viaje:", err);
      setErrorViaje(true);
    } finally {
      setLoadingViaje(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    loadViaje();
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

        // Body anidado (`ViajeReqDTO.viaje`): los `field` vienen prefijados
        // "viaje." — el helper los alinea a los nombres planos del form.
        const message = applyApiError(form, error, {
          stripPrefix: "viaje",
          fallbackMessage: "No se pudo actualizar el viaje",
        });

        notifications.show({
          title: "Error",
          message,
          color: "red",
          icon: <IconX />,
        });
      } finally {
        setLoading(false);
      }
    },
    [id, navigate, viajeOriginal, esEditable, form],
  );

  return (
    <PageContainer>
      <PageBreadcrumbsHeader
        entidad="Viajes"
        accion="Editar viaje"
        descripcion="Modificá el vehículo, los choferes y las fechas planificadas del viaje"
      />

      <ScreenContainer
        onLoading={{ show: loadingViaje, description: 'Cargando viaje...' }}
        onError={{
          show: errorViaje && !loadingViaje,
          title: 'No se pudo cargar el viaje',
          description: 'Ocurrió un error al obtener la información del viaje.',
          onClick: loadViaje,
        }}
        onEmptyData={{
          show: !loadingViaje && !errorViaje && !viajeOriginal,
          title: 'Viaje no encontrado',
          description: 'No encontramos información para este viaje.',
        }}
      >
        {viajeOriginal && (
          <>
            {!esEditable ? (
              <Card>
                <Stack align="center" py="xl" gap="sm">
                  <Badge
                    color={estadoBadge("viaje", viajeOriginal.estado).color}
                    variant="light"
                    size="lg"
                  >
                    {estadoBadge("viaje", viajeOriginal.estado).label}
                  </Badge>
                  <Box ta="center">
                    <Text fw={600}>
                      Este viaje no se puede editar en su estado actual
                    </Text>
                    <Text c="dimmed" size="sm">
                      Sólo se pueden editar viajes en estado &quot;Creado&quot; o
                      &quot;Planificado&quot;.
                    </Text>
                  </Box>
                  <Button variant="light" onClick={() => navigate(`~/viajes/${id}`)}>
                    Volver al detalle
                  </Button>
                </Stack>
              </Card>
            ) : (
              <FormProvider form={form}>
                <SeccionDetalles />
                <SeccionRecursos
                  viajeIdExcluido={id ? Number(id) : undefined}
                  vehiculoActual={viajeOriginal?.vehiculo}
                  choferesActuales={viajeOriginal?.choferes}
                />
                <Footer
                  loading={loading}
                  onSubmit={handleSubmit}
                  onCancel={() => navigate(`~/viajes/${id}`)}
                />
              </FormProvider>
            )}
          </>
        )}
      </ScreenContainer>
    </PageContainer>
  );
};

export default EditarViaje;
