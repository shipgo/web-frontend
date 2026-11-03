import { useMemo, memo } from "react";

import { Text, Skeleton, Group, Button } from "@mantine/core";

import { isNumber } from "es-toolkit/compat";
import { IconRefresh } from "@tabler/icons-react";

const TEXT_PROPS = {
  c: "gray",
  size: "sm",
  miw: "max-content",
};

const ResultsCounter = memo(
  ({ amount, onRefresh, limit = 10, currentPage = 1, isLoading = false }) => {
    const isEmptyResult = useMemo(
      () => [amount === 0, !isNumber(amount)].some((value) => value),
      [amount]
    );

    const { start, end } = useMemo(() => {
      // Asegurar que currentPage sea al menos 1
      const safePage = Math.max(1, currentPage || 1);
      const offset = (safePage - 1) * limit;
      const calculatedEnd = offset + limit;

      return {
        start: Math.max(1, Math.min(offset + 1, amount || 0)),
        end: Math.min(calculatedEnd, amount || 0),
      };
    }, [limit, currentPage, amount]);

    if (isLoading) {
      return <Skeleton height={36} width={150} />;
    }

    if (isEmptyResult) {
      return <Text {...TEXT_PROPS}>Sin resultados</Text>;
    }

    return (
      <Group wrap="nowrap">
        <Text {...TEXT_PROPS}>
          Mostrando {start} - {end} de {amount.toLocaleString("es-AR")}{" "}
          resultados
        </Text>

        {onRefresh && (
          <Button
            size="xs"
            variant="subtle"
            onClick={onRefresh}
            leftSection={<IconRefresh height="20" />}
          >
            Actualizar
          </Button>
        )}
      </Group>
    );
  }
);

export default ResultsCounter;
