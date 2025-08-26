import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE',
  endpoint: string,
  data?: any,
): Promise<Response> {
  const config: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  // Adicionar header de sessão se disponível
  const sessionId = localStorage.getItem('session-id');
  if (sessionId) {
    (config.headers as Record<string, string>)['x-session-id'] = sessionId;
  }

  if (data) {
    config.body = JSON.stringify(data);
  }

  const response = await fetch(endpoint, config);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Erro desconhecido' }));
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
  }

  return response;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    // Include session ID and auth token for authenticated requests
    const sessionId = localStorage.getItem('session-id');
    const authUser = localStorage.getItem('auth-user');
    const headers: Record<string, string> = {};

    if (authUser) {
      headers['x-auth-token'] = 'authenticated';
    }

    if (sessionId) {
      headers['x-session-id'] = sessionId;
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
      staleTime: 2 * 1000, // 2 segundos apenas para dados críticos
      gcTime: 1000 * 10, // 10 segundos no cache
      refetchOnWindowFocus: false,
      refetchOnReconnect: true, // Reativa para melhor confiabilidade
      refetchOnMount: true, // Reativa para garantir dados frescos
      refetchInterval: false,
      retry: (failureCount, error: any) => {
        if (error?.status === 401) {
          return false;
        }
        return failureCount < 2; // 2 tentativas para melhor confiabilidade
      },
    },
    mutations: {
      retry: false,
      networkMode: 'online',
    },
  },
});