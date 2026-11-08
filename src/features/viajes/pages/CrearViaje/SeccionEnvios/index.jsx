import { useMemo } from "react";
import { IconPackage } from "@tabler/icons-react";
import { Box, Group } from "@mantine/core";

import AvailableSelectedTabs from "@components/AvailableSelectedTabs";
import { useIsMobile } from "@hooks/useIsMobile";

import SeccionPlegable from "../SeccionPlegable";
import { useFormContext } from "../contexts/EnviosFormContext";
import { useEnviosPendientes } from "../hooks/useEnviosPendientes";
import useEnviosStats from "../hooks/useEnviosStats";

import EnviosPendientes from "./EnviosPendientes";
import EnviosEnViaje from "./EnviosEnViaje";

/** Alto de cada lista en mobile (las listas virtualizadas necesitan alto fijo). */
const ALTO_LISTA_MOBILE = "min(560px, 70dvh)";

/**
 * `extraEnviosPendientes` (opcional): pasa directo a `EnviosPendientes` — ver
 * ahí el porqué (`SHG-FE-049`, precarga de envíos ya asignados en `EditarViaje`).
 *
 * Mobile: "Pendientes · N" / "Incluidos · N" en pestañas
 * (`AvailableSelectedTabs`) en vez de dos columnas.
 */
const SeccionEnvios = ({ extraEnviosPendientes }) => {
  const isMobile = useIsMobile();
  const pendientesQuery = useEnviosPendientes();
  const {
    values: { enviosIncluidos },
  } = useFormContext();
  const { totalPackages } = useEnviosStats();

  const pendientesCount = useMemo(() => {
    const incluidos = new Set();
    enviosIncluidos.forEach((entry) => entry.packages.forEach((_, id) => incluidos.add(id)));
    const ids = new Set(
      [...(pendientesQuery.data ?? []), ...(extraEnviosPendientes ?? [])].map((e) => e.id),
    );
    return Array.from(ids).filter((id) => !incluidos.has(id)).length;
  }, [pendientesQuery.data, extraEnviosPendientes, enviosIncluidos]);

  return (
    <SeccionPlegable
      value="envios"
      icon={<IconPackage />}
      title="Selección de envíos"
      description="Seleccioná los envíos que se incluirán en el viaje"
      cardProps={{ h: "700" }}
    >
      {isMobile ? (
        <AvailableSelectedTabs
          availableLabel="Pendientes"
          selectedLabel="Incluidos"
          availableCount={pendientesCount}
          selectedCount={totalPackages}
          available={
            <Box h={ALTO_LISTA_MOBILE}>
              <EnviosPendientes extraEnvios={extraEnviosPendientes} />
            </Box>
          }
          selected={
            <Box h={ALTO_LISTA_MOBILE}>
              <EnviosEnViaje />
            </Box>
          }
        />
      ) : (
        <Group justify="space-between" flex={1}>
          <EnviosPendientes extraEnvios={extraEnviosPendientes} />
          <EnviosEnViaje />
        </Group>
      )}
    </SeccionPlegable>
  );
};

export default SeccionEnvios;
