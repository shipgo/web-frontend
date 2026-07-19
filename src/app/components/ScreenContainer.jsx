import { cloneElement } from 'react';
import { IconFilesOff, IconAlertTriangle } from '@tabler/icons-react';
import { Loader, EmptyState, Button, Card } from '@mantine/core';

const Wrapper = ({ children, className, styleProps }) => (
  <EmptyState
    mih='17rem'
    component={Card}
    shadow='none'
    bg='var(--mantine-color-body)'
    radius='0'
    className={className}
    style={{ justifyContent: 'center' }}
    {...styleProps}
  >
    {children}
  </EmptyState>
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
          <EmptyState.Indicator>
            <Loader />
          </EmptyState.Indicator>
          <EmptyState.Description>{onLoading.description ?? 'Cargando...'}</EmptyState.Description>
        </Wrapper>
      )
    );
  }

  if (onError?.show) {
    return (
      onError.children ?? (
        <Wrapper styleProps={styleProps} className={className}>
          <EmptyState.Indicator>
            <IconAlertTriangle size={50} color='var(--mantine-color-dimmed)' />
          </EmptyState.Indicator>
          <EmptyState.Title>{onError.title ?? 'Oops'}</EmptyState.Title>
          <EmptyState.Description>
            {onError.description ?? 'Parece ser que ocurrió un error'}
          </EmptyState.Description>
          {onError.onClick && (
            <EmptyState.Actions>
              <Button variant='subtle' onClick={onError.onClick}>
                Reintentar
              </Button>
            </EmptyState.Actions>
          )}
        </Wrapper>
      )
    );
  }

  if (onEmptyData?.show) {
    return (
      onEmptyData.children ?? (
        <Wrapper styleProps={styleProps} className={className}>
          <EmptyState.Indicator>
            {onEmptyData.icon ? (
              cloneElement(onEmptyData.icon, { color: 'var(--mantine-color-dimmed)' })
            ) : (
              <IconFilesOff size={50} color='var(--mantine-color-dimmed)' />
            )}
          </EmptyState.Indicator>
          <EmptyState.Title>{onEmptyData.title ?? 'Sin datos'}</EmptyState.Title>
          <EmptyState.Description>
            {onEmptyData.description ?? 'Parece ser que no hay información que mostrar'}
          </EmptyState.Description>
        </Wrapper>
      )
    );
  }

  if (onEmptyFiltersData?.show) {
    return (
      onEmptyFiltersData.children ?? (
        <Wrapper styleProps={styleProps} className={className}>
          <EmptyState.Indicator>
            <IconFilesOff size={50} color='var(--mantine-color-dimmed)' />
          </EmptyState.Indicator>
          <EmptyState.Title>{onEmptyFiltersData.title ?? 'Sin datos'}</EmptyState.Title>
          <EmptyState.Description>
            {onEmptyFiltersData.description ??
              'Parece ser que no hay información que mostrar con estos filtros'}
          </EmptyState.Description>
        </Wrapper>
      )
    );
  }

  return children;
};

export default ScreenContainer;
