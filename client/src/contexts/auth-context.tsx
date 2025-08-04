import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface User {
  id: number;
  username: string;
  fullName?: string;
  email?: string;
  role: string;
  department?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(() => {
    // Tentar recuperar usuário do localStorage na inicialização
    try {
      const savedUser = localStorage.getItem('auth-user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });
  const queryClient = useQueryClient();

  // Check if user is already logged in - only when user is not set and no saved user
  const { data: currentUser, isLoading } = useQuery({
    queryKey: ['/api/auth/me'],
    retry: false,
    refetchOnWindowFocus: false,
    enabled: !user,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  useEffect(() => {
    if (currentUser && typeof currentUser === 'object' && !user) {
      const userData = currentUser as User;
      setUser(userData);
      localStorage.setItem('auth-user', JSON.stringify(userData));
    }
  }, [currentUser, user]);

  const loginMutation = useMutation({
    mutationFn: async ({ username, password }: { username: string; password: string }) => {
      try {
        const response = await apiRequest('POST', '/api/auth/login', { username, password });
        return await response.json();
      } catch (error: any) {
        console.error('Login error:', error);
        throw new Error(error.message || 'Erro de conexão com o servidor');
      }
    },
    onSuccess: (userData) => {
      setUser(userData);
      localStorage.setItem('auth-user', JSON.stringify(userData));
      queryClient.setQueryData(['/api/auth/me'], userData);
    },
    onError: (error) => {
      console.error('Login mutation error:', error);
    },
  });

  const login = async (username: string, password: string) => {
    await loginMutation.mutateAsync({ username, password });
  };

  const logout = async () => {
    console.log('Logout function called');
    try {
      // Call the logout endpoint to clear server-side session
      await apiRequest('POST', '/api/auth/logout', {});
    } catch (error) {
      console.error('Logout API error:', error);
    }
    // Clear client-side state regardless of API success/failure
    setUser(null);
    queryClient.clear();
    queryClient.setQueryData(['/api/auth/me'], null);
    localStorage.removeItem('auth-token');
    localStorage.removeItem('auth-user');
  };

  const value = {
    user,
    isLoading: isLoading || loginMutation.isPending,
    login,
    logout,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}