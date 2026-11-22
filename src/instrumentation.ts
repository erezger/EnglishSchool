// Runs once when the Next.js server starts: apply DB migrations + bootstrap early,
// so the first visitor doesn't pay for it and failures show up in the logs right away.
export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;
  const { ready } = await import('./lib/db');
  try {
    await ready();
    console.log('[startup] database ready');
  } catch (err) {
    // Not fatal: ready() is retried on the next request.
    console.error('[startup] database not ready yet', err);
  }
}
