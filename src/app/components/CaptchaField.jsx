import { Alert, Box, Button, Group, Loader, Text } from "@mantine/core";
import { IconAlertTriangle, IconClockExclamation } from "@tabler/icons-react";

/**
 * UI del captcha (Cloudflare Turnstile) para las superficies públicas con
 * costo (login, tracking guest, self-signup, recuperación de contraseña).
 * SHG-FE-043. Puramente presentacional: recibe el resultado de `useCaptcha`
 * y no sabe nada de a qué endpoint va el token.
 *
 * Con el captcha desactivado (`captcha.enabled === false`, dev/CI/tests) no
 * renderiza nada — el formulario queda igual que antes de esta tarea.
 *
 * @param {Object} props
 * @param {ReturnType<typeof import('@hooks/useCaptcha').useCaptcha>} props.captcha
 */
const CaptchaField = ({ captcha }) => {
  const { enabled, status, containerRef, retry } = captcha;

  if (!enabled) return null;

  return (
    <Box>
      {status === "loading-script" ? (
        <Group gap="xs" c="dimmed">
          <Loader size="xs" />
          <Text size="sm">Cargando verificación de seguridad…</Text>
        </Group>
      ) : null}

      {status === "script-error" ? (
        <Alert
          color="red"
          variant="light"
          icon={<IconAlertTriangle size={16} />}
          title="No pudimos cargar la verificación de seguridad"
        >
          <Text size="sm">
            Puede deberse a un bloqueador de anuncios o a un problema de red.
            Desactivalo para este sitio o probá de nuevo.
          </Text>
          <Button size="xs" variant="white" color="red" mt="xs" onClick={retry}>
            Reintentar
          </Button>
        </Alert>
      ) : null}

      {status === "expired" ? (
        <Group gap="xs" c="orange">
          <IconClockExclamation size={16} />
          <Text size="sm">La verificación venció, resolvela de nuevo.</Text>
        </Group>
      ) : null}

      {status === "error" ? (
        <Text size="sm" c="red">
          No pudimos validar la verificación. Intentá de nuevo.
        </Text>
      ) : null}

      {/* Cloudflare monta/desmonta el widget acá — nunca queda vacío mudo:
          siempre hay uno de los mensajes de arriba mientras no esté "ready". */}
      <div ref={containerRef} data-testid="captcha-widget" />
    </Box>
  );
};

export default CaptchaField;
