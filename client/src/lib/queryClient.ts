import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  // Adicionar token de autenticação se disponível
  const authUser = localStorage.getItem('auth-user');
  const headers: Record<string, string> = {};

  if (data) {
    headers["Content-Type"] = "application/json";
  }

  if (authUser) {
    headers['x-auth-token'] = 'authenticated';
  }

  const res = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    // Adicionar token de autenticação se disponível
    const authUser = localStorage.getItem('auth-user');
    const headers: Record<string, string> = {};

    if (authUser) {
      headers['x-auth-token'] = 'authenticated';
    }

    const res = await fetch(queryKey.join("/") as string, {
      credentials: "include",
      headers,
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      staleTime: 2 * 60 * 1000, // 2 minutos - balanceio entre performance e dados frescos
      gcTime: 1000 * 60 * 5, // 5 minutos no cache
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      refetchOnMount: false, // Usa cache sempre que disponível
      refetchInterval: false, // Desabilita polling automático
      retry: (failureCount, error: any) => {
        if (error?.status === 401) {
          return false;
        }
        return failureCount < 1; // Apenas 1 tentativa para ser mais rápido
      },
    },
    mutations: {
      retry: false,
      networkMode: 'online',
    },
  },
});