import { Button, Stack, Tabs } from "@mantine/core";
import { IconPlus } from "@tabler/icons-react";
import { Link, useLocation } from "wouter";

import PageHeader from "@components/PageHeader";

const TABS = [
  { value: "marcas", label: "Marcas" },
  { value: "modelos", label: "Modelos" },
];

/**
 * Header compartido de `ListaMarcas`/`ListaModelos`: tabs para alternar entre
 * ambos catálogos (mismo router anidado, `/catalogo-vehiculos`) + el
 * `PageHeader` canónico con el botón de alta. Evita duplicar la navegación
 * entre las dos pantallas de listado — ver nota de alcance en
 * `planning/tasks/SHG-FE-059.md` sobre por qué Marca y Modelo comparten
 * feature en vez de vivir en dos secciones de nav separadas.
 *
 * @param {Object} props
 * @param {'marcas'|'modelos'} props.active
 * @param {string} props.title
 * @param {string} props.subtitle
 * @param {string} props.createLabel
 * @param {string} props.createHref - relativo al nest `/catalogo-vehiculos`.
 */
const CatalogoVehiculosHeader = ({
  active,
  title,
  subtitle,
  createLabel,
  createHref,
}) => {
  const [, navigate] = useLocation();

  return (
    <Stack gap="md">
      <Tabs
        value={active}
        onChange={(value) => navigate(`/${value}`)}
      >
        <Tabs.List>
          {TABS.map((tab) => (
            <Tabs.Tab key={tab.value} value={tab.value}>
              {tab.label}
            </Tabs.Tab>
          ))}
        </Tabs.List>
      </Tabs>

      <PageHeader title={title} subtitle={subtitle}>
        <Button to={createHref} component={Link} leftSection={<IconPlus />}>
          {createLabel}
        </Button>
      </PageHeader>
    </Stack>
  );
};

export default CatalogoVehiculosHeader;
