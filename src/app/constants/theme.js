import { DateInput } from "@mantine/dates";
import { Anchor, Card, createTheme, TextInput } from "@mantine/core";

import { COLOR_PALETTE } from "@constants/colorPalette";

export const THEME = createTheme({
  colors: { colorPalette: COLOR_PALETTE },
  primaryShade: 9,
  primaryColor: "colorPalette",
  cursorType: "pointer",
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
    TextInput: TextInput.extend({
      defaultProps: {
        autoCorrect: "off",
        autoComplete: "off",
      },
    }),
    DateInput: DateInput.extend({
      defaultProps: {
        valueFormat: "DD/MM/YYYY",
      },
    }),
  },
});
