import { Button } from "@mantine/core";
import { IconPlus } from "@tabler/icons-react";
import { Link } from "wouter";

const ListaUsuariosCrearUser = () => {
  return (
    <Button component={Link} to="~/usuarios/crear" leftSection={<IconPlus />}>
      Crear usuario
    </Button>
  );
};

export default ListaUsuariosCrearUser;
