import { Card } from "@mantine/core";

import { useFormContext } from "../contexts/EnviosFormContext";

import HeaderEnviosEnViaje from "./HeaderEnviosEnViaje";
import ListadoEnviosEnViaje from "./ListadoEnviosEnViaje";

import { getGroupProperties } from "./utils";

const EnviosEnViaje = () => {
  const {
    values: { enviosIncluidos },
  } = useFormContext();

  const { groupCounts, groupLabels, packagesFlat } =
    getGroupProperties(enviosIncluidos);

  return (
    <Card h="100%" flex={1} padding="none" shadow="none" withBorder>
      <HeaderEnviosEnViaje />
      <ListadoEnviosEnViaje
        filteredPackages={packagesFlat}
        groupCounts={groupCounts}
        groupLabels={groupLabels}
      />
    </Card>
  );
};

export default EnviosEnViaje;
