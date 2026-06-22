# Routing

## Pattern

Each feature has two separate files:

1. **`src/features/<feature>/index.js`** — exports only page components (no routing logic)
2. **`src/app/routes/<feature>.routes.jsx`** — imports from the feature index and defines the route tree

`index.jsx` (this file) registers all feature route groups under their base path with `nest`.

## Adding a new feature

1. Create `src/features/<feature>/index.js` exporting its pages
2. Create `src/app/routes/<feature>.routes.jsx` with a `<Switch>` of `<Route>` entries
3. Import and register it here with `<Route path="/<feature>" component={<Feature>Routes} nest />`

## Route placeholders

Unimplemented pages use inline components (`component={() => 'PageName'}`) as placeholders until the real page is built.
