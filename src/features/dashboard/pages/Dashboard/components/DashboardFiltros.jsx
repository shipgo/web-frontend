import { useRef, useState } from 'react';

import { useForm } from '@mantine/form';
import { DatePickerInput } from '@mantine/dates';
import { Card, Chip, Flex, Select } from '@mantine/core';

import {
  QUICK_FILTERS,
  SUCURSALES,
  getTodayDateRange,
  getSucursalLabel,
} from '../dashboard.helpers';

const isSameDate = (a, b) => a?.valueOf() === b?.valueOf();

const DashboardFiltros = ({ onFiltersChange }) => {
  const [activeFilterLabel, setActiveFilterLabel] = useState('Hoy');

  // Ref mirror of activeFilterLabel to avoid stale closure inside onValuesChange.
  const activeFilterLabelRef = useRef('Hoy');

  // Signals that the next onValuesChange was triggered programmatically, not by the user.
  const applyingQuickFilterRef = useRef(false);

  // Stores the last known date to detect whether date or sucursal changed.
  // Compared by value (.valueOf()), not by reference, since Mantine clones form values internally.
  const lastDateRef = useRef(getTodayDateRange());

  const syncActiveFilter = (label) => {
    setActiveFilterLabel(label);
    activeFilterLabelRef.current = label;
  };

  const buildFiltersPayload = (date, sucursalValue, quickFilterLabel) => ({
    date,
    sucursal: sucursalValue,
    quickFilterLabel,
    sucursalLabel: getSucursalLabel(sucursalValue),
  });

  const form = useForm({
    mode: 'controlled',
    initialValues: { date: getTodayDateRange(), sucursal: null },
    onValuesChange: (values) => {
      if (applyingQuickFilterRef.current) {
        applyingQuickFilterRef.current = false;
        lastDateRef.current = values.date;
        return;
      }

      const prevDate = lastDateRef.current;
      const dateChanged =
        !isSameDate(values.date[0], prevDate[0]) || !isSameDate(values.date[1], prevDate[1]);

      lastDateRef.current = values.date;

      if (!values.date[0] && !values.date[1]) {
        const todayRange = getTodayDateRange();
        syncActiveFilter('Hoy');
        applyingQuickFilterRef.current = true;
        form.setValues({ date: todayRange, sucursal: values.sucursal });
        onFiltersChange?.(buildFiltersPayload(todayRange, values.sucursal, 'Hoy'));
        return;
      }

      // Wait until the user picks both ends of the range.
      if (values.date[0] && !values.date[1]) return;

      if (dateChanged) syncActiveFilter(null);

      onFiltersChange?.(
        buildFiltersPayload(
          values.date,
          values.sucursal,
          dateChanged ? null : activeFilterLabelRef.current,
        ),
      );
    },
  });

  const handleChipSelect = (label) => {
    if (activeFilterLabel === label) return;

    const currentSucursal = form.getValues().sucursal;
    const dateRange = QUICK_FILTERS.find((f) => f.label === label).getDateRange();
    syncActiveFilter(label);
    applyingQuickFilterRef.current = true;
    form.setValues({ date: dateRange, sucursal: currentSucursal });
    onFiltersChange?.(buildFiltersPayload(dateRange, currentSucursal, label));
  };

  return (
    <Card component="search">
      <Flex gap="md" align="flex-end" mb="md">
        <DatePickerInput
          {...form.getInputProps('date')}
          type="range"
          clearable
          label="Rango de fechas"
          placeholder="Seleccioná un rango"
          w={260}
        />
        <Select
          {...form.getInputProps('sucursal')}
          label="Sucursal"
          placeholder="Todas las sucursales"
          data={SUCURSALES}
          w={220}
          searchable
          clearable
        />
      </Flex>

      <Flex gap="xs">
        {QUICK_FILTERS.map(({ label }) => (
          <Chip
            key={label}
            variant="light"
            checked={activeFilterLabel === label}
            onChange={() => handleChipSelect(label)}
          >
            {label}
          </Chip>
        ))}
      </Flex>
    </Card>
  );
};

export default DashboardFiltros;
