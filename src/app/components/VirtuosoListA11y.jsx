/**
 * `react-virtuoso` envuelve cada `<li>` de `SelectableItemList` en un `<div>`
 * sin rol (su wrapper de item por defecto) — como ese `<div>` es el padre DOM
 * directo del `<li>` y no tiene rol `list`/`presentation`/`none`, axe-core lo
 * marca (`listitem`, serio — SHG-FE-041, visto en `/viajes/crear`:
 * `ListadoEnviosPendientes`, `ListaVehiculosDisponibles`).
 *
 * Fix mínimo: pasar este componente como `components.Item` de Virtuoso para
 * que ese wrapper sea `role="presentation"` — el `<li>` pasa el chequeo sin
 * tocar `components.List` (dejarlo como está evita meterse con la regla
 * `list`, que sí exige que un `<ul>`/`role="list"` contenga SOLO `listitem`s
 * como hijos directos, algo que `GroupedVirtuoso` rompería con sus headers de
 * grupo).
 */
export const VirtuosoItem = (props) => <div {...props} role="presentation" />;

export default VirtuosoItem;
