import { Text, Paper, Divider } from "@mantine/core";
import { GroupedVirtuoso } from "react-virtuoso";

import ScreenContainer from "@components/ScreenContainer";
import SelectableItemList from "@components/SelectableItemList";
import { VirtuosoItem } from "@components/VirtuosoListA11y";

import ItemPaquete from "./ItemPaquete";
import { useFormContext } from "../contexts/EnviosFormContext";

const ListadoEnviosEnViaje = ({
  filteredPackages,
  groupCounts,
  groupLabels,
}) => {
  const { values, setFieldValue } = useFormContext();
  const { enviosIncluidos } = values;

  const handlePackageRemove = (packageId, groupIndex) => {
    const packagesByCategory = Array.from(enviosIncluidos.entries());
    const [categoryKey, categoryValue] = packagesByCategory[groupIndex];

    const newPackages = new Map(categoryValue.packages);
    newPackages.delete(packageId);

    if (newPackages.size === 0) {
      const newEnviosIncluidos = new Map(enviosIncluidos);
      newEnviosIncluidos.delete(categoryKey);
      setFieldValue("enviosIncluidos", newEnviosIncluidos);
      return;
    }

    setFieldValue(
      "enviosIncluidos",
      new Map([
        ...enviosIncluidos,
        [categoryKey, { ...categoryValue, packages: newPackages }],
      ]),
    );
  };

  return (
    <GroupedVirtuoso
      groupCounts={groupCounts}
      groupContent={(index) => (
        <>
          <Paper p="xs" radius="0">
            <Text size="sm" fw="500">
              {groupLabels[index]} ({groupCounts[index]})
            </Text>
          </Paper>
          <Divider />
        </>
      )}
      itemContent={(index, groupIndex) => (
        <SelectableItemList removable key={filteredPackages[index].id}>
          <ItemPaquete
            item={filteredPackages[index]}
            sucursal={groupLabels[groupIndex]}
            onRemove={() =>
              handlePackageRemove(filteredPackages[index].id, groupIndex)
            }
          />
        </SelectableItemList>
      )}
      components={{
        Item: VirtuosoItem,
        EmptyPlaceholder: () => (
          <ScreenContainer
            styleProps={{ h: "100%" }}
            onEmptyData={{
              show: true,
              title: "No hay envíos seleccionados",
              description: "Seleccioná los envíos que se incluirán en el viaje",
            }}
          />
        ),
      }}
    />
  );
};

export default ListadoEnviosEnViaje;
