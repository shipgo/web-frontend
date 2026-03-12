import { Grid, Stack, Text, Title } from "@mantine/core";

import { uniqueId } from "es-toolkit/compat";

const GridData = ({ items, columnsCount = 1 }) => {
  const normalizedItems = items.map((item) => ({
    ...item,
    id: item.id ?? uniqueId(),
  }));

  return (
    <Grid>
      {normalizedItems.map(({ id, label, value, isFullWidth }) => (
        <Grid.Col span={isFullWidth ? 12 : 12 / columnsCount} key={id}>
          <Stack gap={0}>
            <Title order={6}>{label ?? "-"}</Title>
            <Text truncate>{value ?? "-"}</Text>
          </Stack>
        </Grid.Col>
      ))}
    </Grid>
  );
};

export default GridData;
