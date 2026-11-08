import { useState } from 'react';
import { Box, Button, Drawer, Flex, Group, Stack } from '@mantine/core';
import { IconAdjustmentsHorizontal } from '@tabler/icons-react';

import { useIsMobile } from '@hooks/useIsMobile';

/**
 * Barra de filtros responsive para los listados.
 *
 * Cómo adaptar una pantalla (el estado/`useForm` sigue viviendo en la pantalla;
 * este componente sólo acomoda el layout):
 * ```jsx
 * <Card component="search">
 *   <FilterSheet
 *     search={<TextInput {...form.getInputProps('search')} label="Buscar envío" />}
 *     quickFilters={QUICK_FILTERS.map((f) => <Chip key={f.label} ...>{f.label}</Chip>)}
 *     activeCount={Object.keys(filters).length}
 *     resultsCount={data.total}
 *     onClear={handleClearFilters}
 *   >
 *     <TextInput {...form.getInputProps('destino')} label="Destino" />
 *     <DatePickerInput ... />
 *     <MultiSelect ... />
 *   </FilterSheet>
 * </Card>
 * ```
 * - `search`: el campo principal (siempre visible, afuera de la hoja).
 * - `children`: los campos restantes; van dentro de la hoja en mobile, uno por
 *   fila (y con `size` md), y en escritorio en una fila junto a `search` igual que hoy.
 * - `quickFilters`: chips; quedan visibles afuera de la hoja, en una fila con
 *   scroll horizontal propio (mobile).
 *
 * Los campos aplican en vivo (debounce de la pantalla), por eso "Ver N resultados"
 * sólo cierra la hoja y "Limpiar" llama a `onClear`.
 *
 * @param {Object} props
 * @param {import('react').ReactNode} props.search Campo principal.
 * @param {import('react').ReactNode} props.children Campos secundarios.
 * @param {import('react').ReactNode} [props.quickFilters] Chips.
 * @param {number} [props.activeCount] Filtros activos, para "Filtros (N)".
 * @param {number} [props.resultsCount] N de "Ver N resultados" (si falta: "Ver resultados").
 * @param {() => void} [props.onClear] Handler de "Limpiar".
 * @param {string} [props.title] Título de la hoja (default "Filtros").
 */
const FilterSheet = ({
  search,
  children,
  quickFilters,
  activeCount = 0,
  resultsCount,
  onClear,
  title = 'Filtros',
}) => {
  const isMobile = useIsMobile();
  const [opened, setOpened] = useState(false);

  if (!isMobile) {
    return (
      <>
        <Flex mb="md" gap="md" align="flex-start">
          {search}
          {children}
        </Flex>
        {quickFilters && <Flex gap="xs">{quickFilters}</Flex>}
      </>
    );
  }

  const close = () => setOpened(false);

  return (
    <Stack gap="sm">
      <Group gap="xs" wrap="nowrap" align="flex-end">
        <Box flex={1} miw={0}>{search}</Box>
        <Button
          variant="default"
          size="md"
          mih={44}
          leftSection={<IconAdjustmentsHorizontal size={18} />}
          onClick={() => setOpened(true)}
        >
          {activeCount > 0 ? `Filtros (${activeCount})` : 'Filtros'}
        </Button>
      </Group>

      {quickFilters && (
        <Group gap="xs" wrap="nowrap" style={{ overflowX: 'auto' }} data-testid="quick-filters">
          {quickFilters}
        </Group>
      )}

      <Drawer
        opened={opened}
        onClose={close}
        position="bottom"
        size="auto"
        title={title}
        radius="md"
        styles={{
          content: { maxHeight: '85dvh', display: 'flex', flexDirection: 'column' },
          body: { overflowY: 'auto', paddingBottom: 0 },
        }}
      >
        <Stack gap="md" pb="md">{children}</Stack>
        <Group
          gap="xs"
          wrap="nowrap"
          pt="xs"
          style={{
            position: 'sticky',
            bottom: 0,
            background: 'var(--mantine-color-body)',
            paddingBottom: 'calc(var(--mantine-spacing-xs) + env(safe-area-inset-bottom))',
          }}
        >
          <Button variant="default" size="md" mih={44} onClick={onClear}>
            Limpiar
          </Button>
          <Button flex={1} size="md" mih={44} onClick={close}>
            {typeof resultsCount === 'number' ? `Ver ${resultsCount} resultados` : 'Ver resultados'}
          </Button>
        </Group>
      </Drawer>
    </Stack>
  );
};

export default FilterSheet;
