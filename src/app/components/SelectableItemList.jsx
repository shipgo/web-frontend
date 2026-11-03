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

    // `readOnly`: es sólo un indicador visual del estado "seleccionado" del
    // `<li>` completo (que ya maneja el `onClick`), no un control independiente
    // — sin `aria-hidden` queda como checkbox/radio sin label accesible
    // (axe-core `label`, crítico). `tabIndex={-1}`: `readOnly` no lo saca del
    // orden de tabulación, y un elemento enfocable dentro de algo
    // `aria-hidden` es a su vez otra violación (axe-core `aria-hidden-focus`,
    // serio) — ambas encontradas en SHG-FE-041.
    if (singleSelection) {
      return (
        <Radio
          readOnly
          aria-hidden="true"
          tabIndex={-1}
          variant="outline"
          checked={selected}
          disabled={disabled}
        />
      );
    }

    return (
      <Checkbox
        readOnly
        aria-hidden="true"
        tabIndex={-1}
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
