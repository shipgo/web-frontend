import { Box, Checkbox, Radio, useMantineColorScheme } from "@mantine/core";
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
  removable = false,
  selected = null,
  disabled = false,
  singleSelection = false,
}) => {
  const { hovered, ref } = useHover();
  const { colorScheme } = useMantineColorScheme();

  const getBackgroundColor = () => {
    const colors = COLORS[colorScheme] ?? COLORS.light;

    if (selected) return colors.selected;
    if (hovered) return colors.hovered;
    return "transparent";
  };

  const getCursor = () => {
    if (disabled) return "not-allowed";
    if (removable) return "default";
    return "pointer";
  };

  const renderSelectable = () => {
    if (selected === null) return null;

    if (singleSelection) {
      return (
        <Radio
          readOnly
          variant="outline"
          checked={selected}
          disabled={disabled}
        />
      );
    }

    return (
      <Checkbox
        readOnly
        checked={selected}
        variant="outline"
        disabled={disabled}
      />
    );
  };

  const isClickable = !disabled && !removable;

  return (
    <Box
      p="md"
      pr="lg"
      ref={ref}
      component="li"
      onClick={isClickable ? onClick : undefined}
      bg={getBackgroundColor()}
      style={{
        gap: "1rem",
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        cursor: getCursor(),
      }}
    >
      {renderSelectable()}
      {children}
    </Box>
  );
};

export default SelectableItemList;
