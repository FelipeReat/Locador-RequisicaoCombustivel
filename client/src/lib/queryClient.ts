
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
      staleTime: 0, // Dados sempre considerados stale - força refetch
      gcTime: 1000 * 60 * 2, // 2 minutos (reduzido de 5 minutos)
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      refetchOnMount: true, // Sempre refetch ao montar componente
      retry: (failureCount, error: any) => {
        // Não tenta novamente para erros 401 (não autorizado)
        if (error?.status === 401) {
          return false;
        }
        return failureCount < 3;
      },
    },
    mutations: {
      retry: false,
      // Configurações para melhor UX em mutações
      networkMode: 'online', // Só executa quando online
    },
  },
});
