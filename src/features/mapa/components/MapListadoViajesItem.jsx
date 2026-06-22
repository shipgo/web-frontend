import {
  Badge,
  Text,
  Group,
  Title,
  Box,
  useMantineColorScheme,
} from "@mantine/core";
import { useHover } from "@mantine/hooks";

import { useSelectedViaje } from "../contexts/selectedViaje";

const BACKGROUND_COLORS = {
  dark: {
    selected: "dark.8",
    hovered: "dark.7",
    default: "dark.6",
  },
  light: {
    selected: "gray.1",
    hovered: "gray.0",
    default: "white",
  },
};

const getBackground = (isHovered, isSelected, colorScheme) => {
  const colors = BACKGROUND_COLORS[colorScheme] || BACKGROUND_COLORS.light;

  if (isSelected) return colors.selected;
  if (isHovered) return colors.hovered;
  return colors.default;
};

const MapListadoViajesItem = ({ viajeId }) => {
  const { hovered, ref } = useHover();
  const { colorScheme } = useMantineColorScheme();
  const { selectedViajeId, setSelectedViajeId } = useSelectedViaje();

  const isSelected = selectedViajeId === viajeId;

  return (
    <Box
      p="md"
      ref={ref}
      style={{ cursor: "pointer" }}
      onClick={() => setSelectedViajeId(viajeId)}
      bg={getBackground(hovered, isSelected, colorScheme)}
    >
      <Group gap="xs">
        <Title order={5}>ASD123</Title>
        <Text c="dimmed" size="sm">
          Joaquín Dolcemascolo
        </Text>
        <Badge ml="auto" variant="light" color="green">
          Activo
        </Badge>
      </Group>

      <Group>
        <Text c="dimmed" size="sm">
          7 paquetes restantes
        </Text>
        <Text c="dimmed" size="sm">
          ETA: 12:00
        </Text>
      </Group>
    </Box>
  );
};

export default MapListadoViajesItem;
