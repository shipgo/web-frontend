import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useParams } from "wouter";
import { Badge, Box, Button, Card, Stack, Text } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconCheck, IconX } from "@tabler/icons-react";

import PageContainer from "@components/PageContainer";
import PageBreadcrumbsHeader from "@components/PageBreadcrumbsHeader";
import ScreenContainer from "@components/ScreenContainer";

import { estadoBadge, normalizarEstado } from "@domain/estados";
import { applyApiError } from "@domain/apiError";

import { VIAJE_ESTADOS_EDITABLES } from "../../constants";
import { viajeApi } from "../../api/viajes.api";
import SeccionDetalles from "../CrearViaje/SeccionDetalles";
import SeccionEnvios from "../CrearViaje/SeccionEnvios";
import SeccionResumen from "../CrearViaje/SeccionResumen";
import {
  FormProvider,
  useForm,
} from "../CrearViaje/contexts/EnviosFormContext";
import { INITIAL_VALUES, validate } from "../CrearViaje/contexts/enviosFormConfig";
import { buildViajeReqDTO } from "../CrearViaje/utils";

import SeccionRecursos from "./SeccionRecursos";
import Footer from "./Footer";
import {
  buildEnviosIncluidosFromRecorridos,
  extraerEnviosDeRecorridos,
} from "./utils";

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

  const viajeEstadoInfo = viajeOriginal ? estadoBadge("viaje", viajeOriginal.estado) : null;

  const loadViaje = useCallback(async () => {
    if (!id) return;

    try {
      setLoadingViaje(true);
      setErrorViaje(false);
      const viaje = await viajeApi.getById(id);

      setViajeOriginal(viaje);
      if (viaje) {
        form.setValues({
          vehiculo: viaje.vehiculo ?? null,
          choferes: viaje.choferes || [],
          fechaHoraInicioPlanificada: viaje.fechaHoraInicioPlanificada
            ? new Date(viaje.fechaHoraInicioPlanificada)
            : null,
          fechaHoraFinPlanificada: viaje.fechaHoraFinPlanificada
            ? new Date(viaje.fechaHoraFinPlanificada)
            : null,
          enviosIncluidos: buildEnviosIncluidosFromRecorridos(viaje.recorridos),
        });
        form.resetDirty();
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

        const payload = buildViajeReqDTO(values);

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

  // Envíos ya asignados al viaje, aplanados — ver `extraerEnviosDeRecorridos`
  // (`./utils`) sobre por qué hace falta reinyectarlos en "Envíos pendientes".
  const enviosDelViajeOriginal = useMemo(
    () => extraerEnviosDeRecorridos(viajeOriginal?.recorridos),
    [viajeOriginal],
  );

  return (
    <PageContainer>
      <PageBreadcrumbsHeader
        entidad="Viajes"
        accion="Editar viaje"
        descripcion="Modificá los envíos, los recorridos, el vehículo, los choferes y las fechas planificadas del viaje"
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
                  {/* `c={viajeEstadoInfo.textColor}`: ver
                      `BADGE_TEXT_CONTRAST_OVERRIDE` en `@domain/estados` —
                      sin esto, "En camino"/"Finalizado" no llegan a 4.5:1
                      (axe-core `color-contrast`, SHG-FE-041). `undefined`
                      para el resto de los estados, sin efecto. */}
                  <Badge
                    color={viajeEstadoInfo.color}
                    variant="light"
                    size="lg"
                    c={viajeEstadoInfo.textColor}
                  >
                    {viajeEstadoInfo.label}
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
                <SeccionEnvios extraEnviosPendientes={enviosDelViajeOriginal} />
                <SeccionRecursos
                  viajeIdExcluido={id ? Number(id) : undefined}
                  vehiculoActual={viajeOriginal?.vehiculo}
                  choferesActuales={viajeOriginal?.choferes}
                />
                <SeccionResumen />
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
