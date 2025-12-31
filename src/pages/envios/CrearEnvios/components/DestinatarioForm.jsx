import { Group, Select, Stack, TextInput } from "@mantine/core";
import { useEnvioFormContext } from "../contexts/CrearEnvioContext";

const DestinatarioForm = () => {
  const form = useEnvioFormContext();

  return (
    <Stack padding="lg">
      <Group>
        <TextInput
          autoFocus
          flex="1"
          label="Nombre"
          placeholder="Ej: Juan"
          key={form.key("nombre")}
          {...form.getInputProps("nombre")}
        />

        <TextInput
          autoFocus
          flex="1"
          label="Apellido"
          placeholder="Ej: Perez"
          key={form.key("apellido")}
          {...form.getInputProps("apellido")}
        />
      </Group>

      <Group>
        <Select
          miw="15rem"
          allowDeselect={false}
          label="Tipo de documento"
          placeholder="Seleccioná una opción"
          data={["DNI", "Pasaporte", "Cédula"]}
          key={form.key("tipo_documento")}
          {...form.getInputProps("tipo_documento")}
        />

        <TextInput
          flex="1"
          label="Nº de documento"
          placeholder="Ej: 12345678"
          key={form.key("numero_documento")}
          {...form.getInputProps("numero_documento")}
        />
      </Group>

      <Group>
        <TextInput
          flex="1"
          label="Prefijo"
          placeholder="Ej: +54"
          key={form.key("prefijo_telefono")}
          {...form.getInputProps("prefijo_telefono")}
        />

        <TextInput
          flex="1"
          type="tel"
          label="Teléfono"
          placeholder="Ej: 12345678"
          key={form.key("telefono")}
          {...form.getInputProps("telefono")}
        />
      </Group>

      <TextInput
        label="Email"
        placeholder="Ej: correo@ejemplo.com"
        key={form.key("email")}
        {...form.getInputProps("email")}
      />
    </Stack>
  );
};

export default DestinatarioForm;
