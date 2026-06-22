import { IconInfoCircle } from "@tabler/icons-react";

import dayjs from "dayjs";
import { DateTimePicker } from "@mantine/dates";
import {
  Box,
  Card,
  Group,
  Select,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  ThemeIcon,
  Title,
} from "@mantine/core";

const SeccionDetalles = () => {
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
              Seleccioná la posible fecha de salida del viaje y la sucursal de
              origen del mismo
            </Text>
          </Box>
        </Group>

        <SimpleGrid cols={3}>
          <DateTimePicker
            label="Fecha tentativa de salida"
            placeholder="Seleccioná una fecha"
            defaultValue={new Date()}
            excludeDate={(date) => dayjs(date).isBefore(new Date())}
          />

          <Select
            disabled
            label="Sucursal de origen"
            defaultValue="Sucursal 1"
            placeholder="Seleccioná una sucursal"
            data={["Sucursal 1", "Sucursal 2", "Sucursal 3"]}
          />

          <TextInput
            label="Nombre/Identificador del Viaje (Opcional)"
            placeholder="Nombre/Identificador del Viaje"
            defaultValue="Viaje a Sucursal Sur - 30/07/2025"
          />
        </SimpleGrid>
      </Stack>
    </Card>
  );
};

export default SeccionDetalles;
