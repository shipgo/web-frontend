import { Card, Flex, Group, MultiSelect, TextInput } from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
import { IconSearch } from "@tabler/icons-react";

const ListaViajesFiltros = () => {
  return (
    <Card component={Flex} direction="row" gap="md">
      <TextInput
        flex={1}
        label="Buscar viaje"
        placeholder="Ingresá el nombre del viaje, patente o chofer..."
        rightSection={<IconSearch size={18} />}
      />

      <DatePickerInput
        flex={1}
        label="Rango de fechas"
        placeholder="Seleccioná un rango de fecha"
      />

      <MultiSelect
        flex={1}
        label="Estados"
        placeholder="Seleccioná los estados"
        data={["Estado 1", "Estado 2", "Estado 3"]}
      />
    </Card>
  );
};

export default ListaViajesFiltros;
