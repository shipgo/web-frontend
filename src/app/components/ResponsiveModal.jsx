import { Drawer, Modal } from '@mantine/core';

import { useIsMobile } from '@hooks/useIsMobile';

/**
 * Modal de acción responsive: `Modal` normal en escritorio y hoja inferior
 * (`Drawer position="bottom"`) en mobile. Props básicas idénticas a `Modal`.
 *
 * Para `@mantine/modals` (`modals.open` / `openConfirmModal` / `openContextModal`)
 * no hace falta reescribir los usos: pasá `fullScreen` según el hook, por ejemplo
 * `modals.open({ title, children, fullScreen: isMobile })`, o definí los modales
 * propios con `<ResponsiveModal>` dentro de un context modal. Para confirmaciones
 * cortas `modalProps`/`fullScreen` alcanza; el `Modal` de Mantine ya queda
 * centrado y con `size` acotado al ancho disponible.
 *
 * @param {Object} props
 * @param {boolean} props.opened
 * @param {() => void} props.onClose
 * @param {import('react').ReactNode} [props.title]
 * @param {import('react').ReactNode} props.children
 * @param {string | number} [props.size] Sólo escritorio.
 * @param {boolean} [props.fullScreenOnMobile] `true`: pantalla completa en vez de hoja inferior.
 * @param {Object} [props.rest] Resto de props se reenvía a `Modal` / `Drawer`.
 */
const ResponsiveModal = ({
  opened,
  onClose,
  title,
  children,
  size,
  fullScreenOnMobile = false,
  ...rest
}) => {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <Drawer
        opened={opened}
        onClose={onClose}
        title={title}
        position={fullScreenOnMobile ? undefined : 'bottom'}
        size={fullScreenOnMobile ? '100%' : 'auto'}
        radius={fullScreenOnMobile ? 0 : 'md'}
        styles={{
          content: { maxHeight: fullScreenOnMobile ? '100dvh' : '85dvh' },
          body: { paddingBottom: 'calc(var(--mantine-spacing-md) + env(safe-area-inset-bottom))' },
        }}
        {...rest}
      >
        {children}
      </Drawer>
    );
  }

  return (
    <Modal opened={opened} onClose={onClose} title={title} size={size} centered {...rest}>
      {children}
    </Modal>
  );
};

export default ResponsiveModal;
