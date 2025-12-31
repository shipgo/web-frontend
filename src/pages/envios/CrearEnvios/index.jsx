import { z } from "zod";

import { notifications } from "@mantine/notifications";
import { Card, Divider, Stack, Stepper, Text, Title } from "@mantine/core";

import {
  IconCheck,
  IconUser,
  IconMapPin,
  IconPackage,
  IconFileDescription,
} from "@tabler/icons-react";

import DireccionForm from "./components/DireccionForm";
import ListadoPaquetes from "./components/ListadoPaquetes";
import DestinatarioForm from "./components/DestinatarioForm";
import EnvioFormActions from "./components/EnvioFormActions";
import CrearEnvioResumen from "./components/CrearEnvioResumen";

import { EnvioFormProvider, useEnvioForm } from "./contexts/CrearEnvioContext";

import useHandleForm from "./hooks/useHandleForm";
import { CREAR_ENVIO_INITIAL_VALUES } from "./constants/formInitialValues";
import {
  DESTINATARIO_SCHEMA,
  DIRECCION_SCHEMA,
  PAQUETE_SCHEMA,
} from "./constants/formSchemas";
import { zodResolver } from "@mantine/form";

const STEPS = [
  {
    label: "Destinatario",
    description: "Datos de contacto",
    icon: <IconUser />,
    form: <DestinatarioForm />,
    schema: DESTINATARIO_SCHEMA,
  },
  {
    label: "Dirección",
    description: "Lugar de entrega",
    icon: <IconMapPin />,
    form: <DireccionForm />,
    schema: DIRECCION_SCHEMA,
  },
  {
    label: "Paquetes",
    description: "Listado a enviar",
    icon: <IconPackage />,
    form: <ListadoPaquetes />,
    schema: PAQUETE_SCHEMA,
  },
  {
    label: "Resumen",
    description: "Datos de contacto",
    icon: <IconFileDescription />,
    form: <CrearEnvioResumen />,
    schema: z.object({}),
  },
];

const CrearEnvios = () => {
  const { currentStep, setNextStep, setPreviousStep, sendForm, isPending } =
    useHandleForm();

  const form = useEnvioForm({
    initialValues: CREAR_ENVIO_INITIAL_VALUES,
    // validate: zodResolver(STEPS[currentStep]?.schema),
  });

  const handleNextStep = () => {
    const formHasErrors = form.validate().hasErrors;

    if (!formHasErrors) {
      setNextStep();
      return;
    }

    if (currentStep === 2) {
      notifications.show({
        color: "red",
        title: "Atención",
        position: "bottom-center",
        message: "Debés cargar al menos un paquete para continuar",
      });
    }
  };

  const showActions = !isPending && currentStep !== STEPS.length;

  return (
    <Stack p="lg" m="auto" maw="1440px">
      <Stack gap="0">
        <Title order={3}>Crear un nuevo envío</Title>
        <Text c="gray">
          Completá todos los pasos para registrar un nuevo envío
        </Text>
      </Stack>

      <EnvioFormProvider form={form}>
        <Stepper
          p="xl"
          shadow="xs"
          component={Card}
          active={currentStep}
          completedIcon={<IconCheck />}
        >
          {STEPS.map(({ label, description, icon, form }) => (
            <Stepper.Step
              key={label}
              icon={icon}
              label={label}
              description={description}
            >
              <Divider mb="lg" />
              {form}
            </Stepper.Step>
          ))}

          <Stepper.Completed></Stepper.Completed>
        </Stepper>
      </EnvioFormProvider>

      {showActions && (
        <EnvioFormActions
          lastStep={STEPS.length - 1}
          currentStep={currentStep}
          handleNextStep={handleNextStep}
          handlePreviousStep={setPreviousStep}
          handleOnSubmit={form.onSubmit(sendForm)}
        />
      )}
    </Stack>
  );
};

export default CrearEnvios;
