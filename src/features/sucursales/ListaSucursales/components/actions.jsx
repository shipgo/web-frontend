import { IconEdit, IconFileDescription, IconTrash } from "@tabler/icons-react";

export const ACTIONS = [
  {
    name: "Detalles",
    items: [{ icon: <IconFileDescription size={18} />, label: "Ver detalles" }],
  },
  {
    name: "Opciones",
    items: [
      { icon: <IconEdit size={18} />, label: "Editar", color: "blue" },
      { icon: <IconTrash size={18} />, label: "Eliminar", color: "red" },
    ],
  },
];
