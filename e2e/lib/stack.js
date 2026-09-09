import config from "./config.js";
import { isUp, waitForHttp, spawnBackground, killProcessTree } from "./processes.js";

/**
 * Formas de levantar el backend. Hoy esta máquina no tiene Docker (ver
 * `planning/DEV_ENV.md` Opción B) así que la única estrategia implementada es
 * Maven local. El día que haya Docker disponible (CI vía `SHG-INFRA-002`, u
 * otra máquina de desarrollo) alcanza con agregar acá una entrada tipo:
 *
 *   docker: {
 *     start: (log) => spawnBackground("docker", ["compose", "up", "--build"], {
 *       cwd: config.backendDir,
 *       onLine: (line) => log(`[backend] ${line}`),
 *     }),
 *   },
 *
 * y correr con `E2E_BACKEND_STRATEGY=docker npm run e2e` — el resto del
 * harness (esperar `/actuator/health`, correr los casos, tear down) no
 * cambia un carácter.
 */
const BACKEND_STRATEGIES = {
  "local-maven": {
    start: (log) => {
      const cmd = process.platform === "win32" ? "mvnw.cmd" : "./mvnw";
      return spawnBackground(
        cmd,
        ["spring-boot:run", "-Dspring-boot.run.profiles=dev"],
        {
          cwd: config.backendDir,
          onLine: (line) => log(`[backend] ${line}`),
        },
      );
    },
  },
};

/**
 * Garantiza un backend en `config.backendBaseUrl`. Si ya hay uno respondiendo
 * `UP` (típicamente el que corre el desarrollador a mano) lo reusa tal cual y
 * NO lo toca — no lo reinicia ni lo tira abajo en el teardown. Sólo lo
 * levanta (y sólo lo mata al final) si el harness lo arrancó él mismo.
 */
export async function ensureBackendUp(log) {
  if (await isUp(config.backendHealthUrl)) {
    log(
      `Backend ya está UP en ${config.backendBaseUrl} (${config.backendHealthUrl}) — lo reuso tal cual, no lo reinicio.`,
    );
    return { process: null, ownedByHarness: false };
  }

  const strategyName = process.env.E2E_BACKEND_STRATEGY ?? "local-maven";
  const strategy = BACKEND_STRATEGIES[strategyName];
  if (!strategy) {
    throw new Error(
      `Estrategia de backend desconocida: "${strategyName}". Opciones: ${Object.keys(BACKEND_STRATEGIES).join(", ")}`,
    );
  }

  log(
    `Backend no responde en ${config.backendHealthUrl} — levantando con estrategia "${strategyName}" desde ${config.backendDir}...`,
  );
  const child = strategy.start(log);

  await waitForHttp(config.backendHealthUrl, {
    timeoutMs: config.startupTimeoutMs,
    label: "backend /actuator/health",
    onTick: () => log("... esperando al backend"),
  });
  log(`Backend UP en ${config.backendBaseUrl}.`);

  return { process: child, ownedByHarness: true };
}

/** Igual que `ensureBackendUp` pero para el vite dev server del front. */
export async function ensureWebUp(log) {
  if (await isUp(config.webBaseUrl)) {
    log(`Web dev server ya responde en ${config.webBaseUrl} — lo reuso tal cual.`);
    return { process: null, ownedByHarness: false };
  }

  log(`Levantando vite dev server en :${config.webPort}...`);
  const child = spawnBackground(
    "pnpm",
    ["exec", "vite", "--port", String(config.webPort), "--strictPort"],
    {
      cwd: config.repoRoot,
      onLine: (line) => log(`[vite] ${line}`),
    },
  );

  await waitForHttp(config.webBaseUrl, {
    timeoutMs: config.startupTimeoutMs,
    label: "vite dev server",
    onTick: () => log("... esperando a vite"),
  });
  log(`Vite UP en ${config.webBaseUrl}.`);

  return { process: child, ownedByHarness: true };
}

/** Tear down: sólo mata lo que el harness levantó (`ownedByHarness`). */
export function teardown(handles, log) {
  handles.forEach((handle, i) => {
    if (!handle?.ownedByHarness || !handle.process) return;
    log(`Deteniendo proceso #${i} (pid ${handle.process.pid})...`);
    killProcessTree(handle.process.pid);
  });
}
