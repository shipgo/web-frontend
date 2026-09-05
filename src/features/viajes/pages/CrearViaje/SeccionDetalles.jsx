import { IconInfoCircle } from "@tabler/icons-react";

import { DateTimePicker } from "@mantine/dates";
import {
  Box,
  Card,
  Group,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  ThemeIcon,
  Title,
} from "@mantine/core";

import { useAuth } from "@contexts/auth";

import { useFormContext } from "./contexts/EnviosFormContext";

const SeccionDetalles = () => {
  const { user } = useAuth();
  const { getInputProps } = useFormContext();

  return (
    <Card>
      <Stack>
        <Group gap="0.75rem">
          <ThemeIcon size="xl" variant="light">
            <IconInfoCircle />
          </ThemeIcon>

          <Box>
            <Title order={4}>Detalles del viaje</Title>
            <Text c="dimmed" size="sm">
              Seleccioná la fecha y hora planificadas de salida y llegada del
              viaje
            </Text>
          </Box>
        </Group>

        <SimpleGrid cols={{ base: 1, sm: 3 }}>
          <DateTimePicker
            label="Salida planificada"
            placeholder="Seleccioná una fecha"
            valueFormat="DD/MM/YYYY HH:mm"
            {...getInputProps("fechaHoraInicioPlanificada")}
          />

          <DateTimePicker
            label="Llegada planificada"
            placeholder="Seleccioná una fecha"
            valueFormat="DD/MM/YYYY HH:mm"
            {...getInputProps("fechaHoraFinPlanificada")}
          />

          <TextInput
            disabled
            label="Sucursal de origen"
            description="La define tu usuario — no se puede cambiar acá"
            value={user?.sucursal?.nombre ?? "—"}
            readOnly
          />
        </SimpleGrid>
      </Stack>
    </Card>
  );
};

export default SeccionDetalles;
