import "dayjs/locale/es";

import { ModalsProvider } from "@mantine/modals";
import { useColorScheme } from "@mantine/hooks";
import { DatesProvider } from "@mantine/dates";
import { MantineProvider } from "@mantine/core";
import { Notifications } from "@mantine/notifications";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import dayjs from "dayjs";

import AppRoutes from "./routes";
import { THEME } from "./constants/theme";
import AuthProvider from "./providers/AuthProvider";

dayjs.locale("es");
const NOTIFICATION_DELAY_IN_MS = 20_000; // 20s
const DATE_PROVIDER_CONFIG = { locale: "es", firstDayOfWeek: 1 };

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => {
  const colorScheme = useColorScheme();

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <MantineProvider theme={THEME} defaultColorScheme={colorScheme}>
          <DatesProvider settings={DATE_PROVIDER_CONFIG}>
            <ModalsProvider>
              <AppRoutes />
              <Notifications autoClose={NOTIFICATION_DELAY_IN_MS} />
            </ModalsProvider>
          </DatesProvider>
        </MantineProvider>
      </QueryClientProvider>
    </AuthProvider>
  );
};

export default App;
