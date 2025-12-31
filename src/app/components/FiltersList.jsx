import { memo, useCallback } from "react";

import { Button, Group, Pill, Text } from "@mantine/core";

import { omit, isDate } from "es-toolkit";
import { castArray, isEmpty, toPairs } from "es-toolkit/compat";

import { toLocalDate } from "@utils/dates";

const FiltersList = memo(
  ({ onClearFilters, onFilterRemove, filters = {}, disabled = false }) => {
    const normalizeValues = useCallback((value) => {
      const formattedValue = isDate(value) ? toLocalDate(value) : value;
      return castArray(formattedValue).join(", ");
    }, []);

    if (isEmpty(filters)) {
      return (
        <Text size="sm" c="gray">
          Sin filtros aplicados
        </Text>
      );
    }

    return (
      <Group gap="xs">
        <Text size="sm" c="gray">
          Filtros aplicados:
        </Text>

        {toPairs(omit(filters, "page")).map(([key, { label, values }]) => (
          <Pill
            key={key}
            withRemoveButton={onFilterRemove}
            onRemove={() => onFilterRemove(key)}
          >
            {`${label}: ${normalizeValues(values)}`}
          </Pill>
        ))}

        <Button
          variant="subtle"
          size="compact-xs"
          disabled={disabled}
          onClick={onClearFilters}
        >
          Limpiar todo
        </Button>
      </Group>
    );
  }
);

export default FiltersList;
