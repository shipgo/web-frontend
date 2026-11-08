import { Accordion, Card, Group, Stack, Title } from '@mantine/core';

import { useIsMobile } from '@hooks/useIsMobile';

const FormSections = ({ sections, opened, onChange }) => {
  const isMobile = useIsMobile();

  if (!isMobile) {
    return (
      <Stack>
        {sections.map(({ value, title, icon, children, cardProps }) => (
          <Card key={value} {...cardProps}>
            <Stack gap="md">
              <Group gap="0.75rem">
                {icon}
                <Title order={4}>{title}</Title>
              </Group>
              {children}
            </Stack>
          </Card>
        ))}
      </Stack>
    );
  }

  return (
    <Accordion multiple variant="separated" value={opened} onChange={onChange}>
      {sections.map(({ value, title, icon, children }) => (
        <Accordion.Item key={value} value={value}>
          <Accordion.Control icon={icon} mih={48}>
            <Title order={5}>{title}</Title>
          </Accordion.Control>
          <Accordion.Panel>
            <Stack gap="md">{children}</Stack>
          </Accordion.Panel>
        </Accordion.Item>
      ))}
    </Accordion>
  );
};

export default FormSections;
