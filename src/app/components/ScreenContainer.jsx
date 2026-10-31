import { cloneElement } from 'react';
import { IconFilesOff, IconAlertTriangle } from '@tabler/icons-react';
import { Loader, EmptyState, Button, Card } from '@mantine/core';


import RecursoNoEncontrado from './RecursoNoEncontrado';
import { PANTALLA } from '@copy/common';

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
  onNotFound,
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

  // 404 (SHG-FE-104): antes que `onError` — no ofrece "Reintentar".
  if (onNotFound?.show) {
    return <RecursoNoEncontrado className={className} styleProps={styleProps} {...onNotFound} />;
  }

  if (onError?.show) {
    return (
      onError.children ?? (
        <Wrapper styleProps={styleProps} className={className}>
          <EmptyState.Indicator>
            <IconAlertTriangle size={50} color='var(--mantine-color-dimmed)' />
          </EmptyState.Indicator>
          <EmptyState.Title>{onError.title ?? PANTALLA.errorTitulo}</EmptyState.Title>
          <EmptyState.Description>
            {onError.description ?? PANTALLA.errorDescripcion}
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
          <EmptyState.Title>{onEmptyData.title ?? PANTALLA.vacioTitulo}</EmptyState.Title>
          <EmptyState.Description>
            {onEmptyData.description ?? PANTALLA.vacioDescripcion}
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
          <EmptyState.Title>{onEmptyFiltersData.title ?? PANTALLA.sinResultadosTitulo}</EmptyState.Title>
          <EmptyState.Description>
            {onEmptyFiltersData.description ?? PANTALLA.sinResultadosDescripcion}
          </EmptyState.Description>
          {onEmptyFiltersData.onClick && (
            <EmptyState.Actions>
              <Button variant='subtle' onClick={onEmptyFiltersData.onClick}>
                {onEmptyFiltersData.actionLabel ?? 'Limpiar filtros'}
              </Button>
            </EmptyState.Actions>
          )}
        </Wrapper>
      )
    );
  }

  return children;
};

export default ScreenContainer;
