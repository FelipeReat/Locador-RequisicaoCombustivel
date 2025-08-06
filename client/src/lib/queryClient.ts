
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
      // Configurações mais responsivas para atualizações em tempo real
      staleTime: 30 * 1000, // 30 segundos - dados ficam "fresh" por 30s
      cacheTime: 5 * 60 * 1000, // 5 minutos - cache mantido por 5min
      refetchOnWindowFocus: true, // Revalida quando usuário volta para a aba
      refetchOnReconnect: true, // Revalida quando reconecta à internet
      refetchInterval: false, // Não usar polling automático (pode ser habilitado se necessário)
      retry: (failureCount, error: any) => {
        // Não retry em erros de autenticação
        if (error?.message?.includes('401')) return false;
        return failureCount < 2; // Máximo 2 tentativas
      },
    },
    mutations: {
      retry: false,
      // Configurações para melhor UX em mutações
      networkMode: 'online', // Só executa quando online
    },
  },
});
