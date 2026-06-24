import { Card, Flex, Group, RingProgress, Stack, Text, ThemeIcon, Title } from '@mantine/core';
import ScreenContainer from '@components/ScreenContainer';

const KpiCard = ({ title, value, subtitle, icon, color, ring = null, isLoading }) => (
  <Card>
    <Group justify="space-between" wrap="nowrap">
      <Flex gap="sm" align="flex-start">
        <ThemeIcon variant="light" color={color} size="xl">
          {icon}
        </ThemeIcon>
        <Stack gap={4}>
          <Text size="xs" c="dimmed" tt="uppercase" fw={600}>{title}</Text>
          <ScreenContainer
            onLoading={{ show: isLoading }}
            styleProps={{ bg: 'transparent', mih: '64px', shadow: 'none' }}
          >
            <Title order={2} c={!ring ? color : undefined}>{value}</Title>
            <Text size="xs" c="dimmed">{subtitle}</Text>
          </ScreenContainer>
        </Stack>
      </Flex>
      {ring && !isLoading && (
        <RingProgress
          size={70}
          thickness={6}
          roundCaps
          sections={ring.sections}
          label={<Text ta="center" size="xs" fw={700}>{ring.label}</Text>}
        />
      )}
    </Group>
  </Card>
);

export default KpiCard;
