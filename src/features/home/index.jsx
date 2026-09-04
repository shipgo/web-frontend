import { SimpleGrid, Stack, Text, Title } from '@mantine/core';
import { useMantineColorScheme } from '@mantine/core';

import PageContainer from '@components/PageContainer';
import { useAuth } from '@contexts/auth';

import { getHomeItems } from './getHomeItems.js';
import HomeItem from './components/HomeItem.jsx';

const HomePage = () => {
  const { toggleColorScheme } = useMantineColorScheme();
  const { user } = useAuth();
  const items = getHomeItems(user);

  const resolveonClick = (action) => {
    if (action === 'toggleTheme') return toggleColorScheme;
    return undefined;
  };

  return (
    <PageContainer>
      <Stack gap={4}>
        <Title order={2}>Bienvenido</Title>
        <Text c='dimmed'>¿Qué querés hacer hoy?</Text>
      </Stack>

      <Stack gap='xl'>
        {items.map(({ title, options }) => (
          <Stack key={title} gap='sm'>
            <Text size='xs' fw={600} tt='uppercase' c='dimmed' style={{ letterSpacing: '0.08em' }}>
              {title}
            </Text>
            <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing='md'>
              {options.map((option) => (
                <HomeItem key={option.title} {...option} onClick={resolveonClick(option.action)} />
              ))}
            </SimpleGrid>
          </Stack>
        ))}
      </Stack>
    </PageContainer>
  );
};

export default HomePage;
