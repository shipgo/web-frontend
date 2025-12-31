import { Box, Checkbox, useMantineColorScheme } from "@mantine/core";
import { useHover } from "@mantine/hooks";

const COLORS = {
  dark: {
    selected: "dark.8",
    hovered: "dark.7",
  },
  light: {
    selected: "gray.1",
    hovered: "gray.0",
  },
};

const SelectableItemList = ({
  children,
  onClick,
  selected = null,
  disabled = false,
}) => {
  const { hovered, ref } = useHover();
  const { colorScheme } = useMantineColorScheme();

  const getBackgroundColor = () => {
    const colors = COLORS[colorScheme] ?? COLORS.light;

    if (selected) return colors.selected;
    if (hovered) return colors.hovered;
    return "transparent";
  };

  return (
    <Box
      p="md"
      ref={ref}
      component="li"
      onClick={!disabled && onClick}
      bg={getBackgroundColor()}
      style={{
        gap: "1rem",
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        cursor: disabled ? "not-allowed" : "pointer",
      }}
    >
      {selected !== null && (
        <Checkbox readOnly checked={selected} disabled={disabled} />
      )}
      {children}
    </Box>
  );
};

export default SelectableItemList;
