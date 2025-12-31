import {
  Button,
  Flex,
  Modal,
  Select,
  Stack,
  TextInput,
  Title,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconPlus } from "@tabler/icons-react";

const ListaUsuariosCrearUser = () => {
  const [opened, { open, close }] = useDisclosure(false);

  return (
    <>
      <Button leftSection={<IconPlus />} onClick={open}>
        Crear usuario
      </Button>

      <Modal
        centered
        opened={opened}
        onClose={close}
        closeOnEscape={false}
        withCloseButton={false}
        closeOnClickOutside={false}
        title={<Title order={4}>Crear un nuevo usuario</Title>}
      >
        <Stack component="form">
          <Title order={6}>Información personal</Title>
          <TextInput label="Nombre completo" placeholder="Ej: Juan Perez" />
          <TextInput label="Email" placeholder="Ej: juanperez@email.com" />

          <Title order={6}>Información de acceso</Title>
          <TextInput label="Usuario" placeholder="Ej: juanperez" />
          <Select
            label="Rol"
            placeholder="Seleccioná un rol"
            data={[
              { value: "admin", label: "Administrador" },
              { value: "user", label: "Usuario" },
            ]}
          />

          <Flex gap="xs">
            <Button>Crear usuario</Button>
            <Button variant="subtle" onClick={close}>
              Cancelar
            </Button>
          </Flex>
        </Stack>
      </Modal>
    </>
  );
};

export default ListaUsuariosCrearUser;
