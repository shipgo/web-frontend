import { Anchor, Card, Stack, Text, ThemeIcon, Title } from '@mantine/core';
import { useHover } from '@mantine/hooks';
import { Link } from 'wouter';

const HomeItem = ({ title, description, icon, color, to, href, onClick }) => {
  const { hovered, ref } = useHover();

  return (
    <Card
      ref={ref}
      to={to}
      href={href}
      target={href ? '_blank' : undefined}
      padding='xl'
      radius='md'
      shadow={hovered ? 'md' : 'xs'}
      onClick={onClick}
      component={to ? Link : href ? Anchor : 'div'}
      style={{ cursor: to || href || onClick ? 'pointer' : 'default', transition: 'box-shadow 150ms ease' }}
    >
      <Stack gap='md'>
        <ThemeIcon variant='light' color={color} size={56} radius='md'>
          {icon}
        </ThemeIcon>
        <Stack gap={4}>
          <Title order={5}>{title}</Title>
          <Text size='sm' c='dimmed' lh={1.5}>
            {description}
          </Text>
        </Stack>
      </Stack>
    </Card>
  );
};

export default HomeItem;
