import { Card } from "@mantine/core";

import ListadoEnviosPendientes from "./ListadoEnviosPendientes";
import SearchEnviosPendientes from "./SearchEnviosPendientes";

import { useEnviosPendientes } from "../hooks/useEnviosPendientes";
import { useState } from "react";

const EnviosPendientes = () => {
  const [searchValue, setSearchValue] = useState("");
  const [hideIncludedPackages, setHideIncludedPackages] = useState(true);

  const enviosPendientesQuery = useEnviosPendientes({ searchValue });

  return (
    <Card h="100%" flex={1} padding="none" shadow="none" withBorder>
      <SearchEnviosPendientes
        onSearchChange={setSearchValue}
        onToggleShowIncluded={setHideIncludedPackages}
      />
      <ListadoEnviosPendientes
        queryState={enviosPendientesQuery}
        hideIncludedPackages={hideIncludedPackages}
      />
    </Card>
  );
};

export default EnviosPendientes;
