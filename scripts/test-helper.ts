// scripts/test-helper.ts
export async function getTestBaseUrl(): Promise<string> {
  const envPort = process.env.PORT ? parseInt(process.env.PORT, 10) : null;
  const ports = envPort ? [envPort, 3002, 3000, 3001] : [3002, 3000, 3001, 3005];

  for (const port of ports) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/api/health`);
      if (res.ok) {
        return `http://127.0.0.1:${port}`;
      }
    } catch (_) {}
  }
  return 'http://127.0.0.1:3002';
}
