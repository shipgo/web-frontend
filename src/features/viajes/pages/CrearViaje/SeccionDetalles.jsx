import dayjs from "dayjs";
import { IconInfoCircle } from "@tabler/icons-react";

import { DateTimePicker } from "@mantine/dates";
import { Alert, SimpleGrid, TextInput } from "@mantine/core";

import { useFieldSize } from "@components/useFieldSize";

import { useAuth } from "@contexts/auth";
import { useOperatingContext } from "@contexts/operatingContext";

import { useFormContext } from "./contexts/EnviosFormContext";
import SeccionPlegable from "./SeccionPlegable";

const SeccionDetalles = () => {
  const { user } = useAuth();
  const fieldSize = useFieldSize();
  const { getInputProps, values } = useFormContext();

  // Validación inline (SHG-FE-106): la llegada tiene que ser posterior a la
  // salida apenas se cargan las dos, sin esperar al submit.
  const inicio = values.fechaHoraInicioPlanificada;
  const fin = values.fechaHoraFinPlanificada;
  const fechasInvertidas = Boolean(inicio && fin && !dayjs(fin).isAfter(dayjs(inicio)));
  const llegadaProps = getInputProps("fechaHoraFinPlanificada");
  const { isSuperUser, activeSucursal } = useOperatingContext();

  const sucursalPropia = user?.sucursal ?? null;

  return (
    <SeccionPlegable
      value="detalles"
      icon={<IconInfoCircle />}
      title="Detalles del viaje"
      description="Seleccioná la fecha y hora planificadas de salida y llegada del viaje"
    >
        <SimpleGrid cols={{ base: 1, sm: 3 }}>
          <DateTimePicker
            size={fieldSize}
            label="Salida planificada"
            placeholder="Seleccioná una fecha"
            valueFormat="DD/MM/YYYY HH:mm"
            /*
              SHG-FE-090: con `dropdownType="popover"` (el default),
              @mantine/dates posiciona el calendario con `Popover`
              (floating-ui), que calcula sus coordenadas de forma asíncrona
              relativas al input que lo abrió (un ciclo de render extra
              después de montarlo). Confirmado con `document.elementFromPoint`
              en Chrome real: un clic disparado apenas se abre un popover
              (por ejemplo el de "Llegada", inmediatamente después de
              confirmar "Salida" con el botón ✓) puede caer sobre ese hueco
              de posicionamiento y terminar golpeando el contenido de abajo
              ("Selección de envíos") en lugar del calendario — no pasa nada
              visible, y hace falta un clic extra una vez que el popover ya
              tiene posición. `dropdownType="modal"` evita todo esto: el
              calendario se muestra centrado en un `Modal` fijo, sin
              posicionamiento relativo al input, así que no hay ventana de
              carrera entre los dos selectores.
            */
            dropdownType="modal"
            {...getInputProps("fechaHoraInicioPlanificada")}
          />

          <DateTimePicker
            size={fieldSize}
            label="Llegada planificada"
            placeholder="Seleccioná una fecha"
            valueFormat="DD/MM/YYYY HH:mm"
            dropdownType="modal"
            {...llegadaProps}
            error={
              fechasInvertidas
                ? "La llegada planificada debe ser posterior a la salida planificada."
                : llegadaProps.error
            }
          />

          <TextInput
            size={fieldSize}
            disabled
            label="Sucursal de origen"
            description="Es la sucursal de tu usuario."
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
          SHG-FE-116: un SUPERUSER sin sucursal propia ya no llega acá (queda en
          el onboarding de empresa hasta crearla), así que el aviso de "se crea
          sin sucursal asociada / pendiente de soporte de backend" se quitó.
        */}
        {isSuperUser && sucursalPropia && (
          <Alert
            variant="light"
            color="blue"
            icon={<IconInfoCircle size={16} />}
            title="Sucursal de origen del viaje"
          >
            El viaje se crea con la sucursal de tu usuario (
            <strong>{sucursalPropia.nombre}</strong>)
            {activeSucursal
              ? `, aunque hayas elegido otra sucursal (${activeSucursal.nombre}) en el encabezado`
              : ", aunque elijas otra sucursal en el encabezado"}
            .
          </Alert>
        )}
    </SeccionPlegable>
  );
};

export default SeccionDetalles;
