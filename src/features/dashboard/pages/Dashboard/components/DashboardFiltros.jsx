import { useState } from 'react';

import { DatePickerInput } from '@mantine/dates';
import { Card, Chip, Flex, Select } from '@mantine/core';

import {
  DEFAULT_QUICK_FILTER,
  QUICK_FILTERS,
  getQuickFilterRange,
} from '../dashboard.helpers';
import { useSucursalesOptions } from '../hooks/useDashboardData';

/**
 * Filtros del dashboard: rango de fechas + selector de sucursal + quick-filters de
 * período. Cada cambio emite el estado completo de filtros al padre, que lo
 * traduce a `params` y dispara el refetch real (TanStack Query).
 *
 * El **selector de sucursal es sólo para SUPERUSER** (`CONTRACTS.md §3`): un ADMIN
 * siempre ve su propia sucursal y el backend ignora cualquier `sucursalId` que le
 * mande, así que ni se muestra el control. El gate sale de
 * `useSucursalesOptions().isSuperUser` (deriva de `useAuthStore`).
 */
const DashboardFiltros = ({ value, onChange }) => {
  const { isSuperUser, options: sucursalOptions } = useSucursalesOptions();

  const [date, setDate] = useState(value.date);
  const [sucursalId, setSucursalId] = useState(value.sucursalId);
  const [activeQuick, setActiveQuick] = useState(value.quickFilterLabel);

  const emit = (next) => {
    const sucursalLabel =
      next.sucursalId != null
        ? sucursalOptions.find((s) => s.value === next.sucursalId)?.label ?? null
        : null;
    onChange({ ...next, sucursalLabel });
  };

  const handleDateChange = (nextDate) => {
    // Esperar a que el usuario elija las dos puntas del rango.
    if (nextDate[0] && !nextDate[1]) {
      setDate(nextDate);
      return;
    }

    // Rango limpiado por completo → volver al quick-filter default.
    if (!nextDate[0] && !nextDate[1]) {
      const range = getQuickFilterRange(DEFAULT_QUICK_FILTER);
      setDate(range);
      setActiveQuick(DEFAULT_QUICK_FILTER);
      emit({ date: range, sucursalId, quickFilterLabel: DEFAULT_QUICK_FILTER });
      return;
    }

    setDate(nextDate);
    setActiveQuick(null);
    emit({ date: nextDate, sucursalId, quickFilterLabel: null });
  };

  const handleQuickFilter = (label) => {
    if (activeQuick === label) return;
    const range = getQuickFilterRange(label);
    setActiveQuick(label);
    setDate(range);
    emit({ date: range, sucursalId, quickFilterLabel: label });
  };

  const handleSucursalChange = (nextSucursalId) => {
    setSucursalId(nextSucursalId);
    emit({ date, sucursalId: nextSucursalId, quickFilterLabel: activeQuick });
  };

  return (
    <Card component="search">
      <Flex gap="md" align="flex-end" mb="md" wrap="wrap">
        <DatePickerInput
          value={date}
          onChange={handleDateChange}
          type="range"
          clearable
          allowSingleDateInRange
          label="Rango de fechas"
          placeholder="Seleccioná un rango"
          w={260}
        />
        {isSuperUser && (
          <Select
            value={sucursalId}
            onChange={handleSucursalChange}
            label="Sucursal"
            placeholder="Todas las sucursales"
            data={sucursalOptions}
            w={220}
            searchable
            clearable
          />
        )}
      </Flex>

      <Flex gap="xs" wrap="wrap">
        {QUICK_FILTERS.map(({ label }) => (
          <Chip
            key={label}
            variant="light"
            checked={activeQuick === label}
            onChange={() => handleQuickFilter(label)}
          >
            {label}
          </Chip>
        ))}
      </Flex>
    </Card>
  );
};

export default DashboardFiltros;
