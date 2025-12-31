import "dayjs/locale/es";

import { useColorScheme } from "@mantine/hooks";
import { DatesProvider } from "@mantine/dates";
import { MantineProvider } from "@mantine/core";
import { Notifications } from "@mantine/notifications";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import dayjs from "dayjs";
dayjs.locale("es");

import { THEME } from "@constants/theme";
import AuthProvider from "@providers/AuthProvider";

import { Switch, Route } from "wouter";

import Layout from "@components/Layout";
import { ModalsProvider } from "@mantine/modals";

import LoginPage from "@pages/login";
import HomePage from "@pages/home";
import EnviosRoutes from "@pages/envios";
import ViajesRoutes from "@pages/viajes";
import Mapa from "@pages/mapa";
import UsuariosRoutes from "@pages/usuarios";

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
              <Switch>
                <Route path="/login" component={LoginPage} />

                <Route>
                  <Layout>
                    <Switch>
                      <Route path="/" component={HomePage} />
                      <Route path="/mapa" component={Mapa} />
                      <Route path="/envios" component={EnviosRoutes} nest />
                      <Route path="/viajes" component={ViajesRoutes} nest />
                      <Route path="/usuarios" component={UsuariosRoutes} nest />
                    </Switch>
                  </Layout>
                </Route>
              </Switch>

              <Notifications autoClose={NOTIFICATION_DELAY_IN_MS} />
            </ModalsProvider>
          </DatesProvider>
        </MantineProvider>
      </QueryClientProvider>
    </AuthProvider>
  );
};

export default App;
