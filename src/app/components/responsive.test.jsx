import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { renderWithProviders } from '../../test/renderWithProviders';

const mobile = { value: false };
vi.mock('@hooks/useIsMobile', () => ({
  useIsMobile: () => mobile.value,
  MOBILE_QUERY: '',
}));

vi.mock('wouter', () => ({
  Link: ({ children }) => children,
  useLocation: () => ['/', vi.fn()],
}));

import ResponsiveList from './ResponsiveList';
import ListCard from './ListCard';
import FilterSheet from './FilterSheet';
import PageHeader from './PageHeader';
import PageBreadcrumbsHeader from './PageBreadcrumbsHeader';
import StickyActionBar from './StickyActionBar';
import ResponsiveModal from './ResponsiveModal';
import RowActionsMenu from './RowActionsMenu';
import ResultsCounter from './ResultsCounter';

beforeEach(() => {
  mobile.value = false;
});

const items = [
  { id: 1, codigo: 'AAA' },
  { id: 2, codigo: 'BBB' },
];

const renderList = (props = {}) =>
  renderWithProviders(
    <ResponsiveList
      items={items}
      selectedIds={new Set([2])}
      onToggle={props.onToggle}
      renderCard={
        props.noCard
          ? undefined
          : (row, { selected, onToggle }) => (
              <ListCard title={row.codigo} selected={selected} onToggle={onToggle} selectLabel={`sel ${row.codigo}`} />
            )
      }
      onEmptyData={props.empty}
    >
      <table data-testid="tabla"><tbody><tr><td>fila</td></tr></tbody></table>
    </ResponsiveList>,
  );

describe('ResponsiveList', () => {
  it('escritorio con renderCard muestra la tabla', () => {
    renderList();
    expect(screen.getByTestId('tabla')).toBeInTheDocument();
    expect(screen.queryAllByTestId('list-card')).toHaveLength(0);
  });

  it('mobile sin renderCard muestra la tabla', () => {
    mobile.value = true;
    renderList({ noCard: true });
    expect(screen.getByTestId('tabla')).toBeInTheDocument();
  });

  it('mobile con renderCard muestra tarjetas con selección', async () => {
    mobile.value = true;
    const onToggle = vi.fn();
    renderList({ onToggle });
    expect(screen.queryByTestId('tabla')).not.toBeInTheDocument();
    expect(screen.getAllByTestId('list-card')).toHaveLength(2);
    expect(screen.getByLabelText('sel BBB')).toBeChecked();
    await userEvent.click(screen.getByLabelText('sel AAA'));
    expect(onToggle).toHaveBeenCalledWith(1);
  });

  it('mobile respeta el estado vacío', () => {
    mobile.value = true;
    renderList({ empty: { show: true, title: 'Nada por acá' } });
    expect(screen.getByText('Nada por acá')).toBeInTheDocument();
    expect(screen.queryAllByTestId('list-card')).toHaveLength(0);
  });

  describe('recarga con tarjetas ya cargadas (mobile)', () => {
    const renderCargando = (extra = {}) =>
      renderWithProviders(
        <ResponsiveList
          items={extra.items ?? items}
          onLoading={{ show: true, description: 'Cargando envíos...' }}
          renderCard={(row) => <ListCard title={row.codigo} />}
        >
          <table data-testid="tabla" />
        </ResponsiveList>,
      );

    it('conserva las tarjetas atenuadas e inertes con un indicador, sin la tarjeta de carga', () => {
      mobile.value = true;
      renderCargando();

      expect(screen.getAllByTestId('list-card')).toHaveLength(2);
      expect(screen.getByTestId('responsive-list-cards')).toHaveAttribute('inert');
      expect(screen.getByTestId('responsive-list-cards').style.opacity).toBe('0.45');
      expect(screen.getByRole('status')).toHaveTextContent('Cargando envíos...');
    });

    it('primera carga (sin tarjetas): tarjetas fantasma, sin tarjeta de carga ni indicador', () => {
      mobile.value = true;
      renderCargando({ items: [] });

      expect(screen.queryAllByTestId('list-card')).toHaveLength(0);
      expect(screen.getAllByTestId('list-card-skeleton')).toHaveLength(6);
      expect(screen.queryByTestId('responsive-list-refreshing')).not.toBeInTheDocument();
      // Se anuncia a lectores de pantalla.
      expect(screen.getByRole('status')).toHaveTextContent('Cargando envíos...');
    });

    it('primera carga con `onLoading.children` propio: respeta el contenido a medida', () => {
      mobile.value = true;
      renderWithProviders(
        <ResponsiveList
          items={[]}
          onLoading={{ show: true, children: <p>carga a medida</p> }}
          renderCard={(row) => <ListCard title={row.codigo} />}
        >
          <table />
        </ResponsiveList>,
      );

      expect(screen.getByText('carga a medida')).toBeInTheDocument();
      expect(screen.queryAllByTestId('list-card-skeleton')).toHaveLength(0);
    });

    it('escritorio: la tabla se conserva atenuada e inerte con un indicador, sin tarjeta de carga', () => {
      renderCargando();

      expect(screen.getByTestId('tabla')).toBeInTheDocument();
      expect(screen.queryAllByTestId('list-card')).toHaveLength(0);
      expect(screen.getByTestId('responsive-list-table')).toHaveAttribute('inert');
      expect(screen.getByTestId('responsive-list-table').style.opacity).toBe('0.45');
      expect(screen.getByRole('status')).toHaveTextContent('Cargando envíos...');
    });

    it('escritorio, primera carga: filas fantasma en lugar de la tabla y de la tarjeta de carga', () => {
      renderCargando({ items: [] });

      expect(screen.queryByTestId('tabla')).not.toBeInTheDocument();
      expect(screen.getByTestId('list-table-skeleton')).toBeInTheDocument();
      expect(screen.queryAllByTestId('list-card-skeleton')).toHaveLength(0);
      expect(screen.getByRole('status')).toHaveTextContent('Cargando envíos...');
    });

    it('escritorio con `onLoading.children` propio: respeta el contenido a medida', () => {
      renderWithProviders(
        <ResponsiveList items={[]} onLoading={{ show: true, children: <p>carga a medida</p> }}>
          <table data-testid="tabla" />
        </ResponsiveList>,
      );

      expect(screen.getByText('carga a medida')).toBeInTheDocument();
      expect(screen.queryByTestId('list-table-skeleton')).not.toBeInTheDocument();
    });

    it('al terminar de cargar las tarjetas vuelven a ser interactivas', () => {
      mobile.value = true;
      renderList();

      expect(screen.getByTestId('responsive-list-cards')).not.toHaveAttribute('inert');
      expect(screen.queryByTestId('responsive-list-refreshing')).not.toBeInTheDocument();
    });
  });
});

describe('FilterSheet', () => {
  const setup = (onClear = vi.fn()) =>
    renderWithProviders(
      <FilterSheet
        search={<input aria-label="buscar" />}
        quickFilters={<button>Pendientes</button>}
        activeCount={2}
        resultsCount={48}
        onClear={onClear}
      >
        <input aria-label="destino" />
      </FilterSheet>,
    );

  it('escritorio muestra todo inline sin botón Filtros', () => {
    setup();
    expect(screen.getByLabelText('destino')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Filtros/ })).not.toBeInTheDocument();
  });

  it('mobile abre la hoja, limpia y cierra', async () => {
    mobile.value = true;
    const onClear = vi.fn();
    setup(onClear);
    expect(screen.queryByLabelText('destino')).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Filtros (2)' }));
    expect(await screen.findByLabelText('destino')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Limpiar' }));
    expect(onClear).toHaveBeenCalled();
    await userEvent.click(screen.getByRole('button', { name: 'Ver 48 resultados' }));
    expect(screen.getByRole('button', { name: 'Filtros (2)' })).toBeInTheDocument();
  });
});

describe('PageHeader', () => {
  it('escritorio: botones con texto y Ayuda', () => {
    renderWithProviders(
      <PageHeader
        title="Envíos"
        primaryAction={{ label: 'Crear envío', onClick: () => {} }}
        secondaryActions={[{ label: 'Exportar CSV', onClick: () => {} }]}
      />,
    );
    expect(screen.getByRole('button', { name: 'Crear envío' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Exportar CSV' })).toBeInTheDocument();
    expect(screen.getByText('Ayuda')).toBeInTheDocument();
  });

  it('mobile: ícono con aria-label y menú de tres puntos', async () => {
    mobile.value = true;
    const onExport = vi.fn();
    renderWithProviders(
      <PageHeader
        title="Envíos"
        primaryAction={{ label: 'Crear envío', onClick: () => {} }}
        secondaryActions={[{ label: 'Exportar CSV', onClick: onExport }]}
      />,
    );
    expect(screen.getByRole('button', { name: 'Crear envío' })).toBeInTheDocument();
    expect(screen.queryByText('Exportar CSV')).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Más opciones' }));
    await userEvent.click(await screen.findByText('Exportar CSV'));
    expect(onExport).toHaveBeenCalled();
    expect(screen.getByText('Envíos')).toBeInTheDocument();
  });
});

describe('Títulos de pantalla en mobile (una sola línea)', () => {
  // `Title` no resuelve `truncate`: "Crear mantenimiento" se partía en dos líneas en 390 px.
  const unaLinea = { whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' };

  it('PageBreadcrumbsHeader: una línea con puntos suspensivos y 24 px', () => {
    mobile.value = true;
    renderWithProviders(<PageBreadcrumbsHeader entidad="Mantenimientos" accion="Crear mantenimiento" />);
    const titulo = screen.getByRole('heading', { name: 'Crear mantenimiento' });
    expect(titulo).toHaveStyle(unaLinea);
  });

  it('PageHeader: una línea con puntos suspensivos', () => {
    mobile.value = true;
    renderWithProviders(<PageHeader title="Configurá tu empresa" />);
    expect(screen.getByRole('heading', { name: 'Configurá tu empresa' })).toHaveStyle(unaLinea);
  });

  it('PageHeader en escritorio no se trunca', () => {
    renderWithProviders(<PageHeader title="Configurá tu empresa" />);
    expect(screen.getByRole('heading', { name: 'Configurá tu empresa' })).not.toHaveStyle({
      whiteSpace: 'nowrap',
    });
  });
});

describe('StickyActionBar', () => {
  it('ejecuta la acción primaria y muestra el menú', async () => {
    const onClick = vi.fn();
    const onDelete = vi.fn();
    renderWithProviders(
      <StickyActionBar label="Guardar" onClick={onClick} actions={[{ label: 'Eliminar', color: 'red', onClick: onDelete }]} />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Guardar' }));
    expect(onClick).toHaveBeenCalled();
    await userEvent.click(screen.getByRole('button', { name: 'Más acciones' }));
    await userEvent.click(await screen.findByText('Eliminar'));
    expect(onDelete).toHaveBeenCalled();
  });

  it('sin acciones secundarias no muestra el menú', () => {
    renderWithProviders(<StickyActionBar label="Guardar" />);
    expect(screen.queryByRole('button', { name: 'Más acciones' })).not.toBeInTheDocument();
  });
});

describe('ResponsiveModal', () => {
  it('escritorio usa dialog de Modal', () => {
    renderWithProviders(<ResponsiveModal opened onClose={() => {}} title="Hola">contenido</ResponsiveModal>);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('contenido')).toBeInTheDocument();
  });

  it('mobile usa Drawer inferior', () => {
    mobile.value = true;
    renderWithProviders(<ResponsiveModal opened onClose={() => {}} title="Hola">contenido</ResponsiveModal>);
    expect(screen.getByText('contenido')).toBeInTheDocument();
    expect(document.querySelector('.mantine-Drawer-content')).toBeInTheDocument();
    expect(document.querySelector('.mantine-Modal-content')).not.toBeInTheDocument();
  });
});

describe('RowActionsMenu mobile', () => {
  it('abre hoja inferior y ejecuta la acción', async () => {
    mobile.value = true;
    const onClick = vi.fn();
    renderWithProviders(<RowActionsMenu actions={[{ label: 'Editar', onClick }]} ariaLabel="Acciones de X" />);
    await userEvent.click(screen.getByRole('button', { name: 'Acciones de X' }));
    const dialog = await screen.findByRole('dialog');
    await userEvent.click(within(dialog).getByText('Editar'));
    expect(onClick).toHaveBeenCalled();
  });
});

describe('ResultsCounter mobile', () => {
  it('una línea compacta', () => {
    mobile.value = true;
    renderWithProviders(<ResultsCounter amount={48} limit={10} currentPage={1} />);
    expect(screen.getByText(/Mostrando 1–10 de 48/)).toBeInTheDocument();
  });

  it('primera carga (sin total todavía): esqueleto, no «Sin resultados»', () => {
    mobile.value = true;
    renderWithProviders(<ResultsCounter amount={undefined} isLoading />);
    expect(screen.queryByText('Sin resultados')).not.toBeInTheDocument();
  });

  it('recarga con el total anterior retenido: mantiene el contador', () => {
    mobile.value = true;
    renderWithProviders(<ResultsCounter amount={48} limit={10} currentPage={2} isLoading />);
    expect(screen.getByText(/Mostrando 11–20 de 48/)).toBeInTheDocument();
  });

  it('al cambiar de página avisa a la pantalla y vuelve al inicio de la página', async () => {
    mobile.value = true;
    const onPageChange = vi.fn();
    const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
    renderWithProviders(
      <ResultsCounter amount={48} limit={10} currentPage={1} onPageChange={onPageChange} totalPages={5} />,
    );

    await userEvent.click(screen.getByRole('button', { name: '2' }));

    expect(onPageChange).toHaveBeenCalledWith(2);
    expect(scrollTo).toHaveBeenCalledWith({ top: 0 });
    scrollTo.mockRestore();
  });
});
