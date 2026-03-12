import {
  Box,
  Breadcrumbs,
  Button,
  Card,
  Flex,
  Group,
  Select,
  Stack,
  Text,
  TextInput,
  ThemeIcon,
  Title,
} from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
import { IconInfoCircle } from "@tabler/icons-react";

import PageContainer from "@components/PageContainer";

import SeccionEnvios from "./components/SeccionEnvios";
import SeccionRecursos from "./components/SeccionRecursos";
import SeccionResumen from "./components/SeccionResumen";
import { Link } from "wouter";

const CrearViaje = () => {
  return (
    <PageContainer>
      <Flex align="flex-end" gap="xs">
        <Box>
          <Breadcrumbs
            separatorMargin="sm"
            separator={<Title order={3}>/</Title>}
          >
            <Title component={Link} href="/" order={2}>
              Viajes
            </Title>
            <Title order={2}>Crear nuevo viaje</Title>
          </Breadcrumbs>
          <Text c="dimmed">Completa las secciones para crear un viaje</Text>
        </Box>

        <Button variant="subtle" ml="auto">
          Necesito ayuda
        </Button>

        <Button color="red" variant="light">
          Cancelar
        </Button>
      </Flex>

      <Card>
        <Stack>
          <Group gap="0.75rem">
            <ThemeIcon size="xl" variant="light">
              <IconInfoCircle />
            </ThemeIcon>

            <Box>
              <Title order={4}>Detalles del viaje</Title>
              <Text c="gray.6" size="sm">
                Seleccioná la posible fecha de salida del viaje y la sucursal de
                origen del mismo
              </Text>
            </Box>
          </Group>

          <Group justify="space-between">
            <DatePickerInput
              flex={1}
              label="Fecha tentativa de salida"
              placeholder="Seleccioná una fecha"
              defaultValue={new Date()}
            />

            <Select
              flex={1}
              disabled
              label="Sucursal de origen"
              defaultValue="Sucursal 1"
              placeholder="Seleccioná una sucursal"
              data={["Sucursal 1", "Sucursal 2", "Sucursal 3"]}
            />

            <TextInput
              flex={1}
              label="Nombre/Identificador del Viaje (Opcional)"
              placeholder="Nombre/Identificador del Viaje"
              defaultValue="Viaje a Sucursal Sur - 30/07/2025"
            />
          </Group>
        </Stack>
      </Card>

      <SeccionEnvios />
      <SeccionRecursos />
      <SeccionResumen />
    </PageContainer>
  );
};

export default CrearViaje;
