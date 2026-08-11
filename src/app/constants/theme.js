import {
  Anchor,
  Card,
  createTheme,
  TextInput,
  Select,
  MultiSelect,
  Tooltip,
  Modal,
  Textarea,
  NumberFormatter,
  Loader,
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
    }),
    MultiSelect: MultiSelect.extend({
      styles: {
        label: {
          marginBlockEnd: "0.5rem",
        },
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
      },
    }),
  },
});
