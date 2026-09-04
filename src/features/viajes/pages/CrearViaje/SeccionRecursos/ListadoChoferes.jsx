import { useEffect, useState } from "react";

import {
  Button,
  Card,
  Group,
  ScrollArea,
  TextInput,
  Title,
} from "@mantine/core";
import { IconSearch } from "@tabler/icons-react";

import ScreenContainer from "@components/ScreenContainer";
import SelectableItemList from "@components/SelectableItemList";

import ItemChofer from "./ItemChofer";
import { useFormContext } from "../contexts/EnviosFormContext";
import { useChoferesDisponibles } from "../hooks/useChoferesDisponibles";
import { useDisponibilidadParams } from "../hooks/useDisponibilidadParams";

const filterChoferes = (choferes, search) => {
  if (!search) return choferes;
  const term = search.trim().toLowerCase();
  if (!term) return choferes;

  return choferes.filter((chofer) =>
    [chofer.nombre, chofer.apellido, chofer.email, chofer.telefono]
      .filter(Boolean)
      .some((field) => String(field).toLowerCase().includes(term)),
  );
};

const ListadoChoferes = () => {
  const [searchValue, setSearchValue] = useState("");

  const {
    setFieldValue,
    values: { choferes: choferesSeleccionados },
  } = useFormContext();

  const { desde, hasta } = useDisponibilidadParams();
  const fechasSeleccionadas = Boolean(desde && hasta);

  const choferesQuery = useChoferesDisponibles({ desde, hasta });
  const { data = [], isFetching, isError, refetch } = choferesQuery;

  // Igual que con el vehículo: si cambian las fechas y alguno de los
  // choferes ya seleccionados deja de estar disponible, se lo saca.
  useEffect(() => {
    if (choferesSeleccionados.length === 0 || isFetching) return;
    const disponiblesIds = new Set(data.map((chofer) => chofer.id));
    const vigentes = choferesSeleccionados.filter((chofer) =>
      disponiblesIds.has(chofer.id),
    );
    if (vigentes.length !== choferesSeleccionados.length) {
      setFieldValue("choferes", vigentes);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  const choferes = filterChoferes(data, searchValue);

  const toggleChofer = (chofer) => {
    const yaSeleccionado = choferesSeleccionados.some(
      (c) => c.id === chofer.id,
    );

    if (yaSeleccionado) {
      setFieldValue(
        "choferes",
        choferesSeleccionados.filter((c) => c.id !== chofer.id),
      );
      return;
    }

    setFieldValue("choferes", [...choferesSeleccionados, chofer]);
  };

  return (
    <Card flex={1} h="500" padding="none" shadow="none" withBorder>
      <Card.Section withBorder p="md">
        <Group justify="space-between">
          <Title order={5}>Choferes disponibles</Title>
          <Button variant="subtle" onClick={refetch} disabled={isFetching}>
            Actualizar listado
          </Button>
        </Group>

        <Group mt="xs" gap="sm">
          <TextInput
            flex={1}
            rightSection={<IconSearch size={16} />}
            placeholder="Buscá por nombre, mail o teléfono..."
            onChange={(event) => setSearchValue(event.target.value)}
          />
        </Group>
      </Card.Section>

      <ScreenContainer
        styleProps={{
          h: "100%",
        }}
        onError={{
          show: isError,
          title: "Error al cargar los choferes",
          description: "Error al cargar los choferes disponibles",
          onClick: refetch,
        }}
        onLoading={{
          show: isFetching,
          description: "Cargando choferes disponibles...",
        }}
        onEmptyData={{
          show: !isFetching && !isError && choferes.length === 0,
          title: fechasSeleccionadas
            ? "No hay choferes disponibles"
            : "Seleccioná las fechas del viaje",
          description: fechasSeleccionadas
            ? "No hay choferes disponibles para la ventana de fechas seleccionada"
            : "Completá la fecha de salida y llegada planificadas en \"Detalles del viaje\" para ver los choferes disponibles",
        }}
      >
        <ScrollArea p="0" m="0" flex={1} component="ul">
          {choferes.map((chofer) => (
            <SelectableItemList
              key={chofer.id}
              selected={choferesSeleccionados.some((c) => c.id === chofer.id)}
              onClick={() => toggleChofer(chofer)}
            >
              <ItemChofer chofer={chofer} />
            </SelectableItemList>
          ))}
        </ScrollArea>
      </ScreenContainer>
    </Card>
  );
};

export default ListadoChoferes;
