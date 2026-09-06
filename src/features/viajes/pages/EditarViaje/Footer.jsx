import { AppShellFooter, Button, Flex } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconX } from "@tabler/icons-react";

import { useFormContext } from "../CrearViaje/contexts/EnviosFormContext";

/**
 * Barra de acciones fija, mismo patrón que `CrearViaje/Footer.jsx`
 * (`AppShellFooter`). La lógica de guardado (PUT + manejo de errores +
 * navegación) vive en `index.jsx` y llega por `onSubmit`.
 */
const Footer = ({ loading, onSubmit, onCancel }) => {
  const form = useFormContext();

  const handleInvalid = (errors) => {
    const firstError = Object.values(errors)[0];
    notifications.show({
      color: "red",
      title: "Revisá el formulario",
      message:
        firstError || "Completá los datos requeridos antes de guardar el viaje",
      icon: <IconX />,
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
        <Button
          color="red"
          variant="light"
          disabled={loading}
          onClick={onCancel}
        >
          Cancelar
        </Button>
        <Button
          loading={loading}
          onClick={() => form.onSubmit(onSubmit, handleInvalid)()}
        >
          Guardar cambios
        </Button>
      </Flex>
    </AppShellFooter>
  );
};

export default Footer;
