import { IconPlugConnectedX } from '@tabler/icons-react';
import { Button, Center, EmptyState } from '@mantine/core';

const DESCRIPCIONES = {
  network: 'El servidor no responde. Revisá tu conexión y volvé a intentar en unos instantes.',
  server: 'El servidor está teniendo problemas. Volvé a intentar en unos instantes.',
};

/**
 * Pantalla de "sin conexión con la API" (SHG-FE-110): reemplaza al loader eterno
 * cuando el bootstrap de sesión no obtiene respuesta (timeout / red / 5xx).
 * @param {{ kind?: 'network'|'server', onRetry: () => void }} props
 */
const ConnectionErrorScreen = ({ kind = 'network', onRetry }) => (
  <Center h="100vh" p="xl">
    <EmptyState mih="17rem">
      <EmptyState.Indicator>
        <IconPlugConnectedX size={50} color="var(--mantine-color-dimmed)" />
      </EmptyState.Indicator>
      <EmptyState.Title>No pudimos conectar con el servidor</EmptyState.Title>
      <EmptyState.Description>{DESCRIPCIONES[kind] ?? DESCRIPCIONES.network}</EmptyState.Description>
      <EmptyState.Actions>
        <Button onClick={onRetry}>Reintentar</Button>
      </EmptyState.Actions>
    </EmptyState>
  </Center>
);

export default ConnectionErrorScreen;
