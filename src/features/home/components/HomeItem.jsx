import { Anchor, Card, Stack, Text, ThemeIcon, Title } from "@mantine/core";
import { useHover } from "@mantine/hooks";
import { Link } from "wouter";

const HomeItem = ({ title, description, icon, to, href }) => {
  const { hovered, ref } = useHover();

  return (
    <Card
      ref={ref}
      to={to}
      href={href}
      key={title}
      padding="xl"
      target="_blank"
      shadow={hovered ? "sm" : "xs"}
      component={to ? Link : Anchor}
    >
      <Stack gap="sm">
        <ThemeIcon variant="light" size="xl" radius="md">
          {icon}
        </ThemeIcon>
        <Title order={5}>{title}</Title>
        <Text>{description}</Text>
      </Stack>
    </Card>
  );
};

export default HomeItem;
