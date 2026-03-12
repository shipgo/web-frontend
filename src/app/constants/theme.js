import { DateInput } from "@mantine/dates";
import { Anchor, Button, Card, createTheme, TextInput, Select, MultiSelect, Switch } from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";

import { COLOR_PALETTE } from "@constants/colorPalette";

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
          marginBlockEnd: "0.5rem"
        }
      },
    }),
    MultiSelect: MultiSelect.extend({
      styles: {
        label: {
          marginBlockEnd: "0.5rem"
        }
      },
    }),
    TextInput: TextInput.extend({
      styles: {
        label: {
          marginBlockEnd: "0.5rem"
        }
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
    DatePickerInput: DatePickerInput.extend({
      styles: {
        label: {
          marginBlockEnd: "0.5rem"
        }
      },
      defaultProps: {
        valueFormat: "DD/MM/YYYY",
        // size: "md",
      },
    }),
  },
});
