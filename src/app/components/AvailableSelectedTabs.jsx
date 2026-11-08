import { SimpleGrid, Tabs } from '@mantine/core';

import { useIsMobile } from '@hooks/useIsMobile';

/**
 * Dos paneles "Disponibles" / "Seleccionados" (pantallas de armado de viaje,
 * asignación, etc., que usan `SelectableItemList` en cada lado). Escritorio: dos
 * paneles lado a lado. Mobile: pestañas "Disponibles · N" / "Seleccionados · N".
 * Los hijos (`SelectableItemList`) no cambian.
 *
 * @param {Object} props
 * @param {import('react').ReactNode} props.available Panel de disponibles.
 * @param {import('react').ReactNode} props.selected Panel de seleccionados.
 * @param {number} [props.availableCount]
 * @param {number} [props.selectedCount]
 * @param {string} [props.availableLabel]
 * @param {string} [props.selectedLabel]
 */
const AvailableSelectedTabs = ({
  available,
  selected,
  availableCount = 0,
  selectedCount = 0,
  availableLabel = 'Disponibles',
  selectedLabel = 'Seleccionados',
}) => {
  const isMobile = useIsMobile();

  if (!isMobile) {
    return (
      <SimpleGrid cols={2} spacing="md">
        {available}
        {selected}
      </SimpleGrid>
    );
  }

  return (
    <Tabs defaultValue="available" keepMounted={false}>
      <Tabs.List grow>
        <Tabs.Tab value="available" mih={44}>
          {`${availableLabel} · ${availableCount}`}
        </Tabs.Tab>
        <Tabs.Tab value="selected" mih={44}>
          {`${selectedLabel} · ${selectedCount}`}
        </Tabs.Tab>
      </Tabs.List>
      <Tabs.Panel value="available" pt="sm">{available}</Tabs.Panel>
      <Tabs.Panel value="selected" pt="sm">{selected}</Tabs.Panel>
    </Tabs>
  );
};

export default AvailableSelectedTabs;
