import { cloneElement } from 'react';
import { IconFilesOff, IconAlertTriangle } from '@tabler/icons-react';
import { Text, Loader, Stack, Title, Button, Card } from '@mantine/core';

const Wrapper = ({ children, className, styleProps }) => (
  <Stack
    gap='xs'
    mih='17rem'
    align='center'
    justify='center'
    component={Card}
    shadow='none'
    bg='var(--mantine-color-body)'
    radius='0'
    className={className}
    {...styleProps}
  >
    {children}
  </Stack>
);

const ScreenContainer = ({
  children,
  onError,
  onLoading,
  onEmptyData,
  onEmptyFiltersData,
  className = '',
  styleProps = {},
}) => {
  if (onLoading?.show) {
    return (
      onLoading.children ?? (
        <Wrapper styleProps={styleProps} className={className}>
          <Loader />
          <Text c='dimmed' size='sm' ta='center' maw='50ch'>
            {onLoading.description ?? 'Cargando...'}
          </Text>
        </Wrapper>
      )
    );
  }

  if (onError?.show) {
    return (
      onError.children ?? (
        <Wrapper styleProps={styleProps} className={className}>
          <IconAlertTriangle size={50} color='var(--mantine-color-dimmed)' />
          <Stack gap='0' align='center' justify='center'>
            <Title c='dimmed' order={5}>
              {onError.title ?? 'Oops'}
            </Title>
            <Text c='dimmed' size='sm' ta='center' maw='50ch'>
              {onError.description ?? 'Parece ser que ocurrió un error'}
            </Text>
          </Stack>
          {onError.onClick && (
            <Button variant='subtle' onClick={onError.onClick}>
              Reintentar
            </Button>
          )}
        </Wrapper>
      )
    );
  }

  if (onEmptyData?.show) {
    return (
      onEmptyData.children ?? (
        <Wrapper styleProps={styleProps} className={className}>
          {onEmptyData.icon ? (
            cloneElement(onEmptyData.icon, { color: 'var(--mantine-color-dimmed)' })
          ) : (
            <IconFilesOff size={50} color='var(--mantine-color-dimmed)' />
          )}
          <Stack gap='0' align='center' justify='center'>
            <Title c='dimmed' order={5}>
              {onEmptyData.title ?? 'Sin datos'}
            </Title>
            <Text c='dimmed' size='sm' ta='center' maw='50ch'>
              {onEmptyData.description ?? 'Parece ser que no hay información que mostrar'}
            </Text>
          </Stack>
        </Wrapper>
      )
    );
  }

  if (onEmptyFiltersData?.show) {
    return (
      onEmptyFiltersData.children ?? (
        <Wrapper styleProps={styleProps} className={className}>
          <IconFilesOff size={50} color='var(--mantine-color-dimmed)' />
          <Stack gap='0' align='center' justify='center'>
            <Title c='dimmed' order={5}>
              {onEmptyFiltersData.title ?? 'Sin datos'}
            </Title>
            <Text c='dimmed' size='sm' ta='center' maw='50ch'>
              {onEmptyFiltersData.description ??
                'Parece ser que no hay información que mostrar con estos filtros'}
            </Text>
          </Stack>
        </Wrapper>
      )
    );
  }

  return children;
};

export default ScreenContainer;
