import { useLocation } from "wouter";
import { AppShellFooter, Badge, Button, Flex, Text } from "@mantine/core";
import { modals } from "@mantine/modals";
import { notifications } from "@mantine/notifications";
import { IconCheck, IconX } from "@tabler/icons-react";

import { useFormContext } from "./contexts/EnviosFormContext";
import useEnviosStats from "./hooks/useEnviosStats";
import { useCrearViaje } from "./hooks/useCrearViaje";
import { buildViajeReqDTO } from "./utils";

const Footer = () => {
  const [, navigate] = useLocation();
  const form = useFormContext();
  const {
    values: { vehiculo },
  } = form;

  const { totalPackages, totalStops } = useEnviosStats();
  const { mutate, isPending } = useCrearViaje();

  const handleCancel = () => {
    if (!form.isDirty()) {
      navigate("~/viajes");
      return;
    }

    modals.openConfirmModal({
      title: "Cancelar creación de viaje",
      children: (
        <Text size="sm">
          Vas a perder todo lo cargado en este viaje. ¿Seguro que querés
          salir?
        </Text>
      ),
      labels: { confirm: "Sí, cancelar", cancel: "Seguir editando" },
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
        notifications.show({
          color: "red",
          title: "Error al crear el viaje",
          message:
            error.response?.data?.message ||
            "No se pudo crear el viaje. Intentá nuevamente.",
          icon: <IconX />,
        });
      },
    });
  };

  return (
    <AppShellFooter component={Flex} justify="center">
      <Flex
        flex={1}
        maw={1440}
        px="xl"
        py="xs"
        justify="flex-end"
        align="center"
        gap="xs"
      >
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
          {totalStops > 0 && `${totalStops} Paradas en total`}
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
      </Flex>
    </AppShellFooter>
  );
};

export default Footer;
