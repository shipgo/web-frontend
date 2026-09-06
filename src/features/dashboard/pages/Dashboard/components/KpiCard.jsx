import {
  Card,
  Flex,
  Group,
  RingProgress,
  Stack,
  Text,
  ThemeIcon,
  Title,
  Tooltip,
} from '@mantine/core';
import { IconInfoCircle } from '@tabler/icons-react';

import ScreenContainer from '@components/ScreenContainer';

const KpiCard = ({
  title,
  value,
  subtitle,
  icon,
  color,
  ring = null,
  isLoading,
  isError = false,
  onRetry,
  tooltip,
}) => (
  <Card>
    <Group justify="space-between" wrap="nowrap">
      <Flex gap="sm" align="flex-start">
        <ThemeIcon variant="light" color={color} size="xl">
          {icon}
        </ThemeIcon>
        <Stack gap={4}>
          <Group gap={4} align="center">
            <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
              {title}
            </Text>
            {tooltip && (
              <Tooltip label={tooltip} withArrow multiline maw={280}>
                <IconInfoCircle
                  size={12}
                  style={{ color: 'var(--mantine-color-dimmed)' }}
                />
              </Tooltip>
            )}
          </Group>
          <ScreenContainer
            onLoading={{ show: isLoading }}
            onError={{
              show: !isLoading && isError,
              title: 'Error',
              description: 'No se pudo cargar este dato.',
              onClick: onRetry,
            }}
            styleProps={{ bg: 'transparent', mih: '64px', shadow: 'none' }}
          >
            <Title order={2} c={!ring ? color : undefined}>
              {value}
            </Title>
            <Text size="xs" c="dimmed">
              {subtitle}
            </Text>
          </ScreenContainer>
        </Stack>
      </Flex>
      {ring && !isLoading && !isError && (
        <RingProgress
          size={70}
          thickness={6}
          roundCaps
          sections={ring.sections}
          label={
            <Text ta="center" size="xs" fw={700}>
              {ring.label}
            </Text>
          }
        />
      )}
    </Group>
  </Card>
);

export default KpiCard;
