import {
  Card,
  Stack,
  Group,
  ThemeIcon,
  Box,
  Title,
  Text,
  ScrollArea,
  Timeline,
  Divider,
  Button,
} from "@mantine/core";
import {
  IconFileDescription,
  IconGitPullRequest,
  IconMessageDots,
  IconFlag3,
  IconPin,
} from "@tabler/icons-react";

import { Map } from "@components";

const SeccionResumen = () => {
  return (
    <Card padding="lg" component={Stack}>
      <Group gap="0.75rem">
        <ThemeIcon size="xl" variant="light">
          <IconFileDescription />
        </ThemeIcon>

        <Box>
          <Title order={4}>Resumen del viaje</Title>
          <Text c="gray.6" size="sm">
            Revisa los datos del viaje antes de finalizar
          </Text>
        </Box>

        <Button ml="auto" variant="light">
          Recalcular resumen
        </Button>
      </Group>

      <Group>
        <Card withBorder p="0" h={400} flex={1}>
          <Map />
        </Card>

        <Card withBorder p="0" h={400} maw="35%">
          <ScrollArea flex={1}>
            <Timeline bulletSize={24} lineWidth={2} m="md">
              <Timeline.Item
                bullet={
                  <ThemeIcon size={22} bg="white" radius="xl">
                    <IconFlag3 size={13} color="black" />
                  </ThemeIcon>
                }
                title="Salida"
              >
                <Text c="dimmed" size="sm">
                  Sucursal Centro
                </Text>
                <Text size="xs" mt={4}>
                  (8:00am estimado)
                </Text>
              </Timeline.Item>

              <Timeline.Item
                bullet={<IconPin size={12} />}
                title="Calle Falsa 123"
              >
                <Text c="dimmed" size="sm">
                  Villa María, Córdoba
                </Text>
                <Text size="xs" mt={4}>
                  (3 paquetes)
                </Text>
              </Timeline.Item>

              <Timeline.Item
                title="Pull request"
                bullet={<IconGitPullRequest size={12} />}
              >
                <Text c="dimmed" size="sm">
                  You&apos;ve submitted a pull request
                  <Text variant="link" component="span" inherit>
                    Fix incorrect notification message (#187)
                  </Text>
                </Text>
                <Text size="xs" mt={4}>
                  34 minutes ago
                </Text>
              </Timeline.Item>

              <Timeline.Item
                title="Code review"
                bullet={<IconMessageDots size={12} />}
              >
                <Text c="dimmed" size="sm">
                  <Text variant="link" component="span" inherit>
                    Robert Gluesticker
                  </Text>{" "}
                  left a code review on your pull request
                </Text>
                <Text size="xs" mt={4}>
                  12 minutes ago
                </Text>
              </Timeline.Item>

              <Timeline.Item
                title="Code review"
                bullet={<IconMessageDots size={12} />}
              >
                <Text c="dimmed" size="sm">
                  <Text variant="link" component="span" inherit>
                    Robert Gluesticker
                  </Text>{" "}
                  left a code review on your pull request
                </Text>
                <Text size="xs" mt={4}>
                  12 minutes ago
                </Text>
              </Timeline.Item>

              <Timeline.Item
                title="Code review"
                bullet={<IconMessageDots size={12} />}
              >
                <Text c="dimmed" size="sm">
                  <Text variant="link" component="span" inherit>
                    Robert Gluesticker
                  </Text>{" "}
                  left a code review on your pull request
                </Text>
                <Text size="xs" mt={4}>
                  12 minutes ago
                </Text>
              </Timeline.Item>
            </Timeline>
          </ScrollArea>
        </Card>
      </Group>
    </Card>
  );
};

export default SeccionResumen;
