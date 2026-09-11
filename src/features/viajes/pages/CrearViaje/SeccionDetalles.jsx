import { IconAlertTriangle, IconInfoCircle } from "@tabler/icons-react";

import { DateTimePicker } from "@mantine/dates";
import {
  Alert,
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
import { useOperatingContext } from "@contexts/operatingContext";

import { useFormContext } from "./contexts/EnviosFormContext";

const SeccionDetalles = () => {
  const { user } = useAuth();
  const { getInputProps } = useFormContext();
  const { isSuperUser, activeSucursal } = useOperatingContext();

  const sucursalPropia = user?.sucursal ?? null;

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
            value={sucursalPropia?.nombre ?? "—"}
            readOnly
          />
        </SimpleGrid>

        {/*
          SHG-FE-052: `POST /api/viaje` resuelve la sucursal del viaje
          SIEMPRE server-side desde el usuario logueado
          (`authService.getSucursalCurrentUser()`, `ViajeService.save` —
          `viaje.setSucursal(...)`), sin aceptar ningún id explícito del
          cliente. Para un SUPERUSER esto significa que la "sucursal
          operativa" elegida en el selector del header (`activeSucursal`)
          NO se aplica acá — se documenta para abrir la tarea de backend
          (agregar un `sucursalID` opcional a `ViajeReqDTO`, SUPERUSER-only,
          análogo a `EnvioFilter.sucursal`), no se resuelve en este front.
          Si además el SUPERUSER no tiene sucursal propia (caso real del
          seed dev, usuario `super`), el viaje se crea con `sucursal: null`
          (verificado leyendo `ViajeService.java` — no explota como el caso
          de `POST /api/envio`, pero rompe la visibilidad para ADMIN y las
          notificaciones por sucursal).
        */}
        {isSuperUser && (
          <Alert
            variant="light"
            color={sucursalPropia ? "blue" : "yellow"}
            icon={<IconAlertTriangle size={16} />}
            title="Sucursal de origen del viaje"
          >
            {sucursalPropia ? (
              <>
                El viaje se crea con la sucursal de tu propio usuario (
                <strong>{sucursalPropia.nombre}</strong>). La sucursal
                operativa que elegiste en el selector del header
                {activeSucursal ? ` (${activeSucursal.nombre})` : ""} todavía
                no se puede usar acá — el backend no acepta elegir la
                sucursal de origen al crear un viaje (pendiente).
              </>
            ) : (
              <>
                Tu usuario de SUPERUSER no tiene una sucursal propia
                asignada. Hoy el backend no permite elegir una sucursal de
                origen alternativa para el viaje: se va a crear sin sucursal
                asociada, lo que puede afectar su visibilidad para los ADMIN
                y las notificaciones automáticas. Pendiente de soporte de
                backend.
              </>
            )}
          </Alert>
        )}
      </Stack>
    </Card>
  );
};

export default SeccionDetalles;
