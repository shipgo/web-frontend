import {
  Card,
  Flex,
  Center,
  Pagination,
  Stack,
  Button,
  Title,
  Divider,
  Collapse,
} from "@mantine/core";

import { ResultsCounter, FiltersList, ScreenContainer } from "@components";

import { Link } from "wouter";
import { isEmpty } from "es-toolkit/compat";
import { useDisclosure } from "@mantine/hooks";
import {
  IconMailPlus,
  IconUpload,
  IconShare,
  IconFilter,
} from "@tabler/icons-react";

import EnviosTable from "./components/EnviosTable";
import EnviosFilters from "./components/EnviosFilters";

import { useGetEnvios } from "./hooks/useGetEnvios";

const PAGE_LIMIT = 5;

const ListaEnvios = () => {
  const [showFilters, { toggle }] = useDisclosure(true);

  const {
    params,
    setPage,
    refetch,
    setFilters,
    enviosQuery,
    clearFilters,
    removeFilter,
  } = useGetEnvios(PAGE_LIMIT);

  const { page, filters } = params;

  const showPagination =
    enviosQuery.data?.totalPages > 1 && !enviosQuery.isFetching;

  return (
    <Stack gap="s" m="auto" maw="1440" p="lg">
      <Card component={Stack}>
        <Flex justify="space-between" gap="0.5rem" align="flex-end">
          <Title order={2}>Envíos</Title>
          <Button
            ml="auto"
            to="/crear"
            component={Link}
            leftSection={<IconMailPlus />}
          >
            Crear envío
          </Button>

          <Button variant="light" onClick={toggle} leftSection={<IconFilter />}>
            Filtros
          </Button>

          <Button variant="subtle" leftSection={<IconUpload />}>
            Importar
          </Button>

          <Button variant="subtle" leftSection={<IconShare />}>
            Exportar
          </Button>
        </Flex>

        <Collapse in={showFilters}>
          <Divider mb="lg" />
          <EnviosFilters onFiltersChange={setFilters} />
        </Collapse>
      </Card>

      <Card component={Stack}>
        <ScreenContainer
          onLoading={{
            show: enviosQuery.isFetching,
            description: "Cargando envíos...",
          }}
          onError={{
            onClick: refetch,
            show: enviosQuery.error,
            description: "Ocurrió un error al cargar los envíos",
          }}
          onEmptyData={{ show: enviosQuery.data?.resultsTotal === 0 }}
          onEmptyFiltersData={{
            show: enviosQuery.data?.resultsTotal === 0 && !isEmpty(filters),
          }}
        >
          <Flex align="center" justify="space-between">
            <FiltersList
              filters={filters}
              onClearFilters={clearFilters}
              onFilterRemove={removeFilter}
            />

            <ResultsCounter
              limit={PAGE_LIMIT}
              currentPage={page}
              onRefresh={refetch}
              amount={enviosQuery.data?.total}
            />
          </Flex>

          <EnviosTable items={enviosQuery.data?.content} />
        </ScreenContainer>
      </Card>

      {showPagination && (
        <Center>
          <Pagination
            value={page}
            variant="dots"
            onChange={setPage}
            total={enviosQuery.data?.totalPages}
          />
        </Center>
      )}
    </Stack>
  );
};

export default ListaEnvios;
