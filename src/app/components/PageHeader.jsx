import { Button, Flex, Group, Stack, Text, Title } from "@mantine/core";
import { IconHelp } from "@tabler/icons-react";

const PageHeader = ({ title, subtitle, children }) => (
  <Flex justify="space-between" gap="xs" align="flex-end">
    <Stack gap={0}>
      <Title order={2}>{title}</Title>
      {subtitle && <Text c="dimmed">{subtitle}</Text>}
    </Stack>
    <Group gap="xs">
      {children}
      <Button variant="subtle">Necesito ayuda</Button>
    </Group>
  </Flex>
);

export default PageHeader;
