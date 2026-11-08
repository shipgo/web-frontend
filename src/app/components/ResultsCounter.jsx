import { useMemo, memo } from "react";

import { Text, Skeleton, Group, Button, ActionIcon, Pagination } from "@mantine/core";

import { isNumber } from "es-toolkit/compat";
import { IconRefresh } from "@tabler/icons-react";

import { useIsMobile } from "@hooks/useIsMobile";

const TEXT_PROPS = {
  c: "gray",
  size: "sm",
  miw: "max-content",
};

/**
 * Contador "Mostrando X - Y de N resultados" + botón "Actualizar".
 *
 * Props nuevas opcionales (`onPageChange`, `totalPages`): si se pasan se dibuja
 * además una paginación. En mobile (< sm) todo va en UNA línea sin apilar:
 * "Mostrando 1–10 de 48" + paginación compacta (sólo anterior/siguiente y página
 * actual) y el refresh como botón de ícono. Escritorio: igual que siempre.
 */
const ResultsCounter = memo(
  ({ amount, onRefresh, limit = 10, currentPage = 1, isLoading = false, onPageChange, totalPages }) => {
    const isMobile = useIsMobile();
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

    // Sólo en la primera carga (todavía no hay total). En una recarga el total anterior
    // se mantiene (`keepPreviousData`), así que no parpadea ni dice "Sin resultados".
    if (isLoading && !isNumber(amount)) {
      return <Skeleton height={36} width={150} />;
    }

    if (isEmptyResult) {
      return <Text {...TEXT_PROPS}>Sin resultados</Text>;
    }

    if (isMobile) {
      const pages = totalPages ?? Math.ceil(amount / limit);
      // Al pasar de página desde el final de una lista larga, se vuelve al inicio:
      // si no, la página nueva aparece con el scroll en el pie.
      const handlePageChange = (page) => {
        onPageChange?.(page);
        window.scrollTo?.({ top: 0 });
      };
      return (
        <Group wrap="nowrap" justify="space-between" gap="xs">
          <Text {...TEXT_PROPS}>
            Mostrando {start}–{end} de {amount.toLocaleString("es-AR")}
          </Text>
          <Group wrap="nowrap" gap="xs">
            {onPageChange && pages > 1 && (
              <Pagination
                size="md"
                siblings={0}
                boundaries={0}
                withEdges={false}
                value={currentPage}
                onChange={handlePageChange}
                total={pages}
                aria-label="Paginación"
              />
            )}
            {onRefresh && (
              <ActionIcon size={44} variant="subtle" onClick={onRefresh} aria-label="Actualizar">
                <IconRefresh size={20} />
              </ActionIcon>
            )}
          </Group>
        </Group>
      );
    }

    return (
      <Group wrap="nowrap">
        <Text {...TEXT_PROPS}>
          Mostrando {start} - {end} de {amount.toLocaleString("es-AR")}{" "}
          resultados
        </Text>

        {onPageChange && (
          <Pagination
            value={currentPage}
            onChange={onPageChange}
            total={totalPages ?? Math.ceil(amount / limit)}
          />
        )}

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
