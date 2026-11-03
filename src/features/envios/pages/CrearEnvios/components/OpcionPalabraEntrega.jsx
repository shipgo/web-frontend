import { Box, Card, Group, Switch, Text, ThemeIcon, Title } from "@mantine/core";
import { IconKey } from "@tabler/icons-react";

import { useEnvioFormContext } from "../contexts/CrearEnvioContext";

/**
 * Interruptor "Generar palabra de entrega" (`SHG-CONTRACT-025`, `SHG-FE-144`).
 * Activado por defecto: el backend genera la palabra (dos palabras en español,
 * ej. `LUNA-PERRO`), se la manda por email al destinatario y la muestra en el
 * seguimiento público. Sólo se ofrece en el alta (no se puede editar después).
 */
const OpcionPalabraEntrega = () => {
  const form = useEnvioFormContext();

  return (
    <Card>
      <Group gap="0.75rem" align="flex-start" wrap="nowrap">
        <ThemeIcon size="xl" variant="light">
          <IconKey />
        </ThemeIcon>
        <Box>
          <Title order={4}>Palabra de entrega</Title>
          <Text c="dimmed" size="sm" mb="sm">
            Se envía por email con el código de seguimiento y se ve en el seguimiento. El
            destinatario se la dicta al chofer al recibir el envío.
          </Text>
          <Switch
            label="Generar palabra de entrega"
            description="Si lo desactivás, el envío se entrega sin palabra."
            {...form.getInputProps("generarPalabraEntrega", { type: "checkbox" })}
          />
        </Box>
      </Group>
    </Card>
  );
};

export default OpcionPalabraEntrega;
