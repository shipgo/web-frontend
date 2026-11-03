import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const E2E_DIR = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const REPO_ROOT = path.dirname(E2E_DIR);

/**
 * Candidatos donde puede vivir el checkout de `backend` relativo a este repo.
 * El harness puede correr desde el checkout principal de `web-frontend`
 * (hermano de `backend`) o desde un worktree bajo `_worktrees/SHG-*`
 * (dos niveles más abajo) — probamos ambos antes de rendirnos.
 */
const BACKEND_DIR_CANDIDATES = [
  path.resolve(REPO_ROOT, "../backend"),
  path.resolve(REPO_ROOT, "../../backend"),
];

const resolveBackendDir = () => {
  if (process.env.E2E_BACKEND_DIR) return process.env.E2E_BACKEND_DIR;
  return (
    BACKEND_DIR_CANDIDATES.find((dir) => existsSync(path.join(dir, "pom.xml"))) ??
    BACKEND_DIR_CANDIDATES[0]
  );
};

/**
 * `HEADLESS`: en CI (`process.env.CI` truthy, lo setea SHG-INFRA-002 más
 * adelante) corre headless por defecto — no hay display. Local, headed
 * (`headless: false`) salvo que se fuerce con `E2E_HEADLESS=1`. Ver README
 * "Headed vs headless".
 */
export const config = {
  repoRoot: REPO_ROOT,
  e2eDir: E2E_DIR,
  artifactsDir: path.join(E2E_DIR, "artifacts"),

  webPort: Number(process.env.E2E_WEB_PORT ?? 5173),
  get webBaseUrl() {
    return process.env.E2E_WEB_URL ?? `http://localhost:${this.webPort}`;
  },

  backendPort: Number(process.env.E2E_BACKEND_PORT ?? 8080),
  get backendBaseUrl() {
    return process.env.E2E_BACKEND_URL ?? `http://localhost:${this.backendPort}`;
  },
  get backendHealthUrl() {
    return `${this.backendBaseUrl}/actuator/health`;
  },
  backendDir: resolveBackendDir(),

  headless: process.env.E2E_HEADLESS
    ? process.env.E2E_HEADLESS === "1"
    : Boolean(process.env.CI),

  startupTimeoutMs: Number(process.env.E2E_STARTUP_TIMEOUT_MS ?? 120_000),
  pollIntervalMs: 1_500,

  seedPassword: "Shipgo123!",
};

export default config;
