import { Stack } from "@mantine/core";

const PageContainer = ({ children }) => {
  return (
    <Stack pt="md" pb="xl" px="xl" maw="1440px" mx="auto">
      {children}
    </Stack>
  );
};

export default PageContainer;
