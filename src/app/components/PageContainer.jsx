import { Stack } from "@mantine/core";

const PageContainer = ({ children, ...rest }) => (
  <Stack pt="md" pb="xl" px="xl" maw="1440px" mx="auto" {...rest}>
    {children}
  </Stack>
);

export default PageContainer;
