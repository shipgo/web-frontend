import { MantineProvider } from "@mantine/core";
import { ModalsProvider } from "@mantine/modals";
import { Notifications } from "@mantine/notifications";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";

/**
 * Generic test wrapper used across features (not vehiculos-specific) to
 * render components that depend on Mantine + React Query providers.
 *
 * Usage: renderWithProviders(<MyComponent />)
 */
export const renderWithProviders = (ui, { route = "/" } = {}) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, refetchOnWindowFocus: false },
    },
  });

  if (route) {
    window.history.pushState({}, "", route);
  }

  return render(
    <QueryClientProvider client={queryClient}>
      <MantineProvider>
        <ModalsProvider>
          {ui}
          <Notifications />
        </ModalsProvider>
      </MantineProvider>
    </QueryClientProvider>
  );
};
