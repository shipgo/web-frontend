import {
  Card,
  Title,
  Box,
  Table,
  NumberFormatter,
  Text,
  Paper,
} from "@mantine/core";

import ScreenContainer from "@components/ScreenContainer";

import ItemPaquete from "./ItemPaquete";
import { GroupedVirtuoso } from "react-virtuoso";
import SelectableItemList from "@components/SelectableItemList";

const LABELS = {
  entrega_local: "Entrega local",
  transferencia_sucursal: "Transferencia sucursal",
};

const getGroupProperties = (selectedPackages) => {
  const packagesByCategory = Array.from(selectedPackages.entries());

  const groupLabels = packagesByCategory.map(([label]) => label);
  const groupedPackages = packagesByCategory.map(([, list]) =>
    Array.from(list.values())
  );

  const packagesFlat = groupedPackages.flat();
  const packagesWeight = packagesFlat.reduce(
    (totalWeight, item) => totalWeight + item.peso,
    0
  );
  const groupCounts = groupedPackages.map((list) => list.length);

  return {
    groupCounts,
    groupLabels,
    packagesFlat,
    packagesWeight,
  };
};

const EnviosSeleccionados = ({ selectedPackages, onPackageRemove }) => {
  const { groupCounts, groupLabels, packagesFlat, packagesWeight } =
    getGroupProperties(selectedPackages);

  const handlePackageRemove = (packageId) => {
    for (const [category, values] of selectedPackages.entries()) {
      if (values.has(packageId)) {
        onPackageRemove({ category, packageId });
        break;
      }
    }
  };

  return (
    <Card h="100%" flex={1} padding="none" shadow="none" withBorder>
      <Card.Section withBorder py="xs" px="md">
        <Title order={5}>Envíos seleccionados</Title>
      </Card.Section>

      <GroupedVirtuoso
        groupCounts={groupCounts}
        groupContent={(index) => (
          <Paper bg="gray.0" radius="0" p="xs">
            <Text size="sm" fw="500">
              {LABELS[groupLabels[index]]} ({groupCounts[index]})
            </Text>
          </Paper>
        )}
        itemContent={(index) => (
          <SelectableItemList
            key={packagesFlat[index].id}
            onClick={() => handlePackageRemove(packagesFlat[index].id)}
          >
            <ItemPaquete shouldRemove item={packagesFlat[index]} />
          </SelectableItemList>
        )}
        components={{
          EmptyPlaceholder: () => (
            <ScreenContainer
              styleProps={{
                h: "100%",
              }}
              onEmptyData={{
                show: true,
                title: "No hay envíos seleccionados",
                description:
                  "Seleccioná los envíos que se incluirán en el viaje",
              }}
            />
          ),
        }}
      />

      {/* <Box
        p="0"
        m="0"
        flex={1}
        component="ul"
        style={{ listStyle: "none", overflowY: "auto" }}
      >
        {[].map((item) => (
          <PackageItem key={item.id} item={item} shouldRemove />
        ))}

        {[].length === 0 && (
          <ScreenContainer
            styleProps={{
              h: "100%",
              bg: "transparent",
            }}
            onEmptyData={{
              show: true,
              title: "No hay envíos seleccionados",
              description: "Seleccioná los envíos que se incluirán en el viaje",
            }}
          />
        )}
      </Box> */}

      <Card.Section withBorder>
        <Table layout="fixed" variant="vertical">
          <Table.Tbody>
            <Table.Tr>
              <Table.Th w={200}>Paquetes seleccionados</Table.Th>
              <Table.Td align="right">{packagesFlat.length}</Table.Td>
            </Table.Tr>

            <Table.Tr>
              <Table.Th>Peso total acumulado</Table.Th>
              <Table.Td align="right">
                <NumberFormatter
                  suffix=" kg"
                  decimalScale={2}
                  decimalSeparator=","
                  thousandSeparator="."
                  value={packagesWeight}
                />
              </Table.Td>
            </Table.Tr>
          </Table.Tbody>
        </Table>
      </Card.Section>
    </Card>
  );
};

export default EnviosSeleccionados;
