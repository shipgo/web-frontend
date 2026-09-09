import {
  Anchor,
  Card,
  createTheme,
  TextInput,
  Select,
  MultiSelect,
  NumberInput,
  Tooltip,
  Modal,
  Textarea,
  NumberFormatter,
  Loader,
  Pagination,
} from "@mantine/core";
import { DatePickerInput, DateTimePicker } from "@mantine/dates";

import { COLOR_PALETTE } from "@constants/colorPalette";
import { BarChart } from "@mantine/charts";

export const THEME = createTheme({
  colors: { colorPalette: COLOR_PALETTE },
  primaryShade: 9,
  primaryColor: "colorPalette",
  cursorType: "pointer",
  defaultRadius: "md",
  components: {
    Anchor: Anchor.extend({
      defaultProps: {
        underline: "never",
      },
    }),
    Card: Card.extend({
      defaultProps: {
        shadow: "xs",
        padding: "lg",
      },
    }),
    // Switch: Switch.extend({
    //   defaultProps: {
    //     size: "md",
    //   },
    // }),
    Select: Select.extend({
      styles: {
        label: {
          marginBlockEnd: "0.5rem",
        },
      },
      // Sin `aria-label` propio, el botón de limpiar de un `Select` clearable
      // queda sin nombre accesible (axe-core `button-name`, crítico —
      // SHG-FE-041). Default global: cualquier `Select` puede pisarlo con su
      // propio `clearButtonProps` si el label no aplica.
      defaultProps: {
        clearButtonProps: { "aria-label": "Limpiar selección" },
      },
    }),
    MultiSelect: MultiSelect.extend({
      styles: {
        label: {
          marginBlockEnd: "0.5rem",
        },
      },
    }),
    NumberInput: NumberInput.extend({
      styles: {
        label: {
          marginBlockEnd: "0.5rem",
        },
      },
      defaultProps: {
        autoCorrect: "off",
        autoComplete: "off",
      },
    }),
    Textarea: Textarea.extend({
      styles: {
        label: {
          marginBlockEnd: "0.5rem",
        },
      },
      defaultProps: {
        // size: "md",
        autoCorrect: "off",
        autoComplete: "off",
      },
    }),
    TextInput: TextInput.extend({
      styles: {
        label: {
          marginBlockEnd: "0.5rem",
        },
      },
      defaultProps: {
        // size: "md",
        autoCorrect: "off",
        autoComplete: "off",
      },
    }),
    // Button: Button.extend({
    //   defaultProps: {
    //     size: "md",
    //   },
    // }),
    BarChart: BarChart.extend({
      defaultProps: {
        barProps: { radius: 10 },
      },
    }),
    Loader: Loader.extend({
      defaultProps: {
        type: "bars",
      },
    }),
    // Mantine no le pone `aria-label` propio a los controles prev/next/first/
    // last de `Pagination` — quedan como botones sin nombre accesible
    // (axe-core `button-name`, crítico, en cada listado con paginación:
    // envíos, viajes, y el resto de las listas que usan `<Pagination>` sin
    // pasarle nada — ver SHG-FE-041). Default global en vez de repetirlo en
    // cada página.
    Pagination: Pagination.extend({
      defaultProps: {
        getControlProps: (control) => {
          const labels = {
            first: "Primera página",
            previous: "Página anterior",
            next: "Página siguiente",
            last: "Última página",
          };
          return labels[control] ? { "aria-label": labels[control] } : {};
        },
      },
    }),
    NumberFormatter: NumberFormatter.extend({
      defaultProps: {
        thousandSeparator: ".",
        decimalScale: 2,
        decimalSeparator: ",",
      },
    }),
    Modal: Modal.extend({
      defaultProps: {
        centered: true,
        padding: "lg",
      },
    }),
    Tooltip: Tooltip.extend({
      defaultProps: {
        withArrow: true,
      },
    }),
    DateTimePicker: DateTimePicker.extend({
      styles: {
        label: {
          marginBlockEnd: "0.5rem",
        },
      },
      defaultProps: {
        valueFormat: "DD/MM/YYYY",
        // size: "md",
      },
    }),
    DatePickerInput: DatePickerInput.extend({
      styles: {
        label: {
          marginBlockEnd: "0.5rem",
        },
      },
      defaultProps: {
        valueFormat: "DD/MM/YYYY",
        // size: "md",
        // Mismo motivo que en `Select` — botón de limpiar sin nombre
        // accesible (axe-core `button-name`, crítico — SHG-FE-041).
        clearButtonProps: { "aria-label": "Limpiar rango de fechas" },
      },
    }),
  },
});
