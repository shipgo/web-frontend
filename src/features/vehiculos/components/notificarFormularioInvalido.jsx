import { IconX } from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";

/** `onSubmit(handler, handleInvalid)` de `@mantine/form`: avisa el primer error. */
export const notificarFormularioInvalido = (errors) => {
  const firstError = Object.values(errors).find(Boolean);
  notifications.show({
    color: "red",
    title: "Revisá el formulario",
    message: firstError || "Completá los datos requeridos",
    icon: <IconX />,
  });
};
