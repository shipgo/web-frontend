import { useLocation } from "wouter";
import { Badge, Button, Text } from "@mantine/core";
import { modals } from "@mantine/modals";
import { notifications } from "@mantine/notifications";
import { IconCheck, IconX } from "@tabler/icons-react";

import PageFooter from "@components/PageFooter";
import { applyApiError } from "@domain/apiError";

import { useFormContext } from "./contexts/EnviosFormContext";
import useEnviosStats from "./hooks/useEnviosStats";
import { useCrearViaje } from "./hooks/useCrearViaje";
import { useRefrescarRecursosTras409 } from "./hooks/useRefrescarRecursosTras409";
import { buildViajeReqDTO } from "./utils";
import { SALIR_SIN_GUARDAR } from '@copy/common';

const Footer = () => {
  const [, navigate] = useLocation();
  const form = useFormContext();
  const {
    values: { vehiculo, choferes, enviosIncluidos, fechaHoraInicioPlanificada, fechaHoraFinPlanificada },
  } = form;

  const { totalPackages, totalStops } = useEnviosStats();
  const { mutate, isPending } = useCrearViaje();
  const refrescarRecursosTras409 = useRefrescarRecursosTras409();

  const handleCancel = () => {
    // `isDirty()` no detecta bien el `Map` de envíos: se chequea el contenido
    // del form además (SHG-FE-106).
    const tieneCambios =
      form.isDirty() ||
      (enviosIncluidos?.size ?? 0) > 0 ||
      Boolean(vehiculo) ||
      (choferes?.length ?? 0) > 0 ||
      Boolean(fechaHoraInicioPlanificada) ||
      Boolean(fechaHoraFinPlanificada);

    if (!tieneCambios) {
      navigate("~/viajes");
      return;
    }

    modals.openConfirmModal({
      title: SALIR_SIN_GUARDAR.titulo,
      children: (
        <Text size="sm">{SALIR_SIN_GUARDAR.mensaje}</Text>
      ),
      labels: { confirm: SALIR_SIN_GUARDAR.salir, cancel: SALIR_SIN_GUARDAR.seguir },
      confirmProps: { color: "red" },
      cancelProps: { variant: "subtle" },
      groupProps: { gap: "xs" },
      onConfirm: () => navigate("~/viajes"),
    });
  };

  const handleInvalid = (errors) => {
    const firstError = Object.values(errors)[0];
    notifications.show({
      color: "red",
      title: "Revisá el formulario",
      message:
        firstError || "Completá los datos requeridos antes de crear el viaje",
      icon: <IconX />,
    });
  };

  const handleSubmit = (values) => {
    mutate(buildViajeReqDTO(values), {
      onSuccess: () => {
        notifications.show({
          color: "green",
          title: "Viaje creado",
          message: "El viaje se creó correctamente y quedó planificado",
          icon: <IconCheck />,
        });
        navigate("~/viajes");
      },
      onError: (error) => {
        console.error("Error creando viaje:", error);
        refrescarRecursosTras409(error);
        // Body anidado (`ViajeReqDTO.viaje`): los `field` vienen prefijados
        // "viaje." — el helper los alinea a los nombres planos del form.
        const message = applyApiError(form, error, {
          stripPrefix: "viaje",
          fallbackMessage: "Probá de nuevo en unos minutos.",
        });
        notifications.show({
          color: "red",
          title: "No se pudo crear el viaje",
          message,
          icon: <IconX />,
        });
      },
    });
  };

  return (
    <PageFooter>
      {totalPackages > 0 && (
        <Badge variant="dot" color="blue">
          {totalPackages} Envíos
        </Badge>
      )}
      {vehiculo && (
        <Badge variant="dot" color="green">
          {vehiculo.modelo?.nombre ?? "Vehículo"} ({vehiculo.patente})
        </Badge>
      )}
      <Text size="sm" c="dimmed" fw={500} mr="auto">
        {totalStops > 0 && `${totalStops} ${totalStops === 1 ? 'parada' : 'paradas'} en total`}
      </Text>
      <Button
        color="red"
        variant="light"
        disabled={isPending}
        onClick={handleCancel}
      >
        Cancelar
      </Button>
      <Button
        loading={isPending}
        onClick={() => form.onSubmit(handleSubmit, handleInvalid)()}
      >
        Crear viaje
      </Button>
    </PageFooter>
  );
};

export default Footer;
