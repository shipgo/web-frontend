import { Stack } from "@mantine/core";

/** En mobile (< sm) padding horizontal de 16 px; sin anchos mínimos. */
const PageContainer = ({ children, ...rest }) => (
  <Stack pt="md" pb="xl" px={{ base: "md", sm: "xl" }} maw="1440px" mx="auto" {...rest}>
    {children}
  </Stack>
);

export default PageContainer;
