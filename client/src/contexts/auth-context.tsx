import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useLocation } from 'wouter';

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

// Define LoginCredentials interface for clarity
interface LoginCredentials {
  username: string;
  password: string;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const queryClient = useQueryClient();
  const [, navigate] = useLocation(); // useLocation hook for wouter navigation

  // Verificar se há um usuário salvo no localStorage na inicialização
  useEffect(() => {
    const savedUser = localStorage.getItem('auth-user');
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
        queryClient.setQueryData(['/api/auth/me'], parsedUser);
      } catch (error) {
        console.error('Erro ao carregar usuário salvo:', error);
        localStorage.removeItem('auth-user');
      }
    }
    setIsLoading(false);
  }, [queryClient]);

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      try {
        console.log('Login API call started:', credentials.username);
        
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(credentials),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || `HTTP error! status: ${response.status}`);
        }

        const user = await response.json();
        console.log('Login API call successful:', user);
        return user;
      } catch (error) {
        console.error('Login API call failed:', error);
        if (error instanceof Error) {
          if (error.message.includes('Servidor não está disponível')) {
            throw new Error('Servidor não está disponível. Por favor, verifique se o sistema está rodando.');
          } else if (error.message.includes('conectar ao servidor')) {
            throw new Error('Não foi possível conectar ao servidor. Verifique sua conexão com a internet.');
          }
        }
        throw error;
      }
    },
    onSuccess: (user) => {
      setUser(user);
      localStorage.setItem('auth-user', JSON.stringify(user));
      if (user.sessionId) {
        localStorage.setItem('session-id', user.sessionId);
      }
      queryClient.invalidateQueries();
      navigate('/');
    },
    onError: (error) => {
      console.error('Login failed:', error);
      // Error will be handled by the component
    },
  });

  const login = async (username: string, password: string) => {
    await loginMutation.mutateAsync({ username, password });
  };

  const logout = async () => {
    console.log('Logout function called');
    try {
      // Call the logout endpoint to clear server-side session
      const sessionId = localStorage.getItem('session-id');
      if (sessionId) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-session-id': sessionId,
          },
        });
      }
    } catch (error) {
      console.error('Logout API error:', error);
    }
    // Clear client-side state regardless of API success/failure
    setUser(null);
    queryClient.clear();
    queryClient.setQueryData(['/api/auth/me'], null);
    localStorage.removeItem('auth-token');
    localStorage.removeItem('auth-user');
    localStorage.removeItem('session-id');
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