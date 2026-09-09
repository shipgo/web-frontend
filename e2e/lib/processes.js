import { spawn, spawnSync } from "node:child_process";

/** Sondea `url` hasta que responda 2xx o se agote `timeoutMs`. */
export async function waitForHttp(
  url,
  { timeoutMs, intervalMs = 1_500, label = url, onTick } = {},
) {
  const deadline = Date.now() + timeoutMs;
  let lastError;

  while (Date.now() < deadline) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(5_000) });
      if (res.ok) return true;
      lastError = new Error(`${label} respondió ${res.status}`);
    } catch (err) {
      lastError = err;
    }
    onTick?.(lastError);
    await new Promise((r) => setTimeout(r, intervalMs));
  }

  throw new Error(
    `Timeout (${timeoutMs}ms) esperando a ${label}. Último error: ${lastError?.message}`,
  );
}

/** `true` si algo responde en esa URL ahora mismo (sin reintentos). */
export async function isUp(url) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(3_000) });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Levanta un proceso de larga vida (backend/vite) en background, devuelve el
 * `ChildProcess`. `onLine` recibe cada línea de stdout/stderr — el logger del
 * run lo usa para dejar un archivo de log del proceso.
 */
export function spawnBackground(command, args, { cwd, env, onLine } = {}) {
  const child = spawn(command, args, {
    cwd,
    env: { ...process.env, ...env },
    shell: process.platform === "win32",
    windowsHide: true,
  });

  const pipe = (stream) => {
    let buf = "";
    stream.on("data", (chunk) => {
      buf += chunk.toString();
      const lines = buf.split(/\r?\n/);
      buf = lines.pop();
      lines.forEach((line) => onLine?.(line));
    });
  };
  pipe(child.stdout);
  pipe(child.stderr);

  return child;
}

/**
 * Mata un proceso y sus hijos. En Windows, `child_process.kill()` no basta
 * cuando se lanzó con `shell: true` (mata la shell, no `mvnw`/`vite` que
 * quedan huérfanos) — hace falta `taskkill /t` sobre el árbol completo.
 */
export function killProcessTree(pid) {
  if (!pid) return;
  if (process.platform === "win32") {
    spawnSync("taskkill", ["/pid", String(pid), "/t", "/f"], { stdio: "ignore" });
    return;
  }
  try {
    process.kill(-pid, "SIGTERM");
  } catch {
    try {
      process.kill(pid, "SIGTERM");
    } catch {
      /* ya estaba muerto */
    }
  }
}
