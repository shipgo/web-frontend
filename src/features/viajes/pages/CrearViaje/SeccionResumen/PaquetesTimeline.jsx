import { IconMessageDots, IconFlag3 } from "@tabler/icons-react";
import { Card, ScrollArea, Text, ThemeIcon, Timeline } from "@mantine/core";
import { IconPin } from "@tabler/icons-react";
import { IconGitPullRequest } from "@tabler/icons-react";

const PaquetesTimeline = () => {
  return (
    <Card withBorder shadow="0" p="0" h={400} maw="35%">
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

          <Timeline.Item bullet={<IconPin size={12} />} title="Calle Falsa 123">
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
  );
};

export default PaquetesTimeline;
