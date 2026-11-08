import { IconEdit, IconFileDescription, IconTrash } from "@tabler/icons-react";

export const getActionsForRow = ({ onVerDetalles, onEditar, onEliminar }) => [
  {
    name: "Detalles",
    items: [
      {
        icon: <IconFileDescription size={18} />,
        label: "Ver detalles",
        onClick: onVerDetalles,
      },
    ],
  },
  {
    name: "Opciones",
    items: [
      { icon: <IconEdit size={18} />, label: "Editar", color: "blue", onClick: onEditar },
      { icon: <IconTrash size={18} />, label: "Eliminar", color: "red", onClick: onEliminar },
    ],
  },
];

export const marcaModelo = (vehiculo) => {
  if (!vehiculo) return null;
  const marca = vehiculo.modelo?.marca?.nombre ?? "";
  const modelo = vehiculo.modelo?.nombre ?? "";
  return `${marca} ${modelo}`.trim() || null;
};
