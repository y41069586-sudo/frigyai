/**
 * Frees the dev port before `npm run dev` (Windows-friendly).
 * Keep in sync with vite.config.ts `server.port`.
 */
import { execSync } from "node:child_process";

const PORT = 4137;

function freePortWindows() {
  const ps = [
    `$conns = Get-NetTCPConnection -LocalPort ${PORT} -ErrorAction SilentlyContinue`,
    "| Select-Object -ExpandProperty OwningProcess -Unique",
    "| Where-Object { $_ -and $_ -gt 0 }",
  ].join(" ");
  try {
    const out = execSync(`powershell -NoProfile -Command "${ps}"`, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
    if (!out) return;
    for (const pid of out.split(/\s+/)) {
      const n = Number(pid);
      if (!Number.isFinite(n) || n <= 0 || n === process.pid) continue;
      try {
        execSync(`taskkill /PID ${n} /F`, { stdio: "ignore" });
        console.log(`[dev] Freed port ${PORT} (stopped PID ${n})`);
      } catch {
        // already gone
      }
    }
  } catch {
    // port free
  }
}

freePortWindows();
