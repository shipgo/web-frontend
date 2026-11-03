import "dayjs/locale/es";

import { ModalsProvider } from "@mantine/modals";
import { DatesProvider } from "@mantine/dates";
import { MantineProvider } from "@mantine/core";
import { Notifications } from "@mantine/notifications";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import dayjs from "dayjs";

import AppRoutes from "./routes";
import { THEME } from "./constants/theme";
import { cssVariablesResolver } from "./constants/cssVariablesResolver";
import AuthProvider from "./providers/AuthProvider";
import OperatingContextProvider from "./providers/OperatingContextProvider";

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
  return (
    <QueryClientProvider client={queryClient}>
      <MantineProvider theme={THEME} defaultColorScheme="auto" cssVariablesResolver={cssVariablesResolver}>
        <DatesProvider settings={DATE_PROVIDER_CONFIG}>
          <ModalsProvider>
            <AuthProvider>
              <OperatingContextProvider>
                <AppRoutes />
                <Notifications autoClose={NOTIFICATION_DELAY_IN_MS} />
              </OperatingContextProvider>
            </AuthProvider>
          </ModalsProvider>
        </DatesProvider>
      </MantineProvider>
    </QueryClientProvider>
  );
};

export default App;
