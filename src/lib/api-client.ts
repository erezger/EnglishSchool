'use client';

/** Small fetch wrapper for the React pages: JSON in/out, Hebrew error messages, 401 -> login. */
export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

export async function api<T = unknown>(
  url: string,
  options: { method?: string; body?: unknown } = {},
): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, {
      method: options.method ?? 'GET',
      headers: options.body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      cache: 'no-store',
    });
  } catch {
    throw new ApiError(0, 'network', 'אין חיבור לשרת. בדקו את האינטרנט ונסו שוב');
  }
  const data = (await res.json().catch(() => ({}))) as { error?: string; message?: string };
  if (res.status === 401 && !url.startsWith('/api/auth/login')) {
    window.location.href = '/login?expired=1';
  }
  if (!res.ok) {
    throw new ApiError(res.status, data.error ?? 'error', data.message ?? 'משהו השתבש, נסו שוב');
  }
  return data as T;
}
