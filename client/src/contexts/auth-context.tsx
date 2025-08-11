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
  const [, navigate] = useLocation(); // useLocation hook for wouter navigation

  // Check if user is already logged in - only when user is not set and no saved user
  const { data: currentUser, isLoading, error } = useQuery({
    queryKey: ['/api/auth/me'],
    retry: false,
    refetchOnWindowFocus: false,
    enabled: !user,
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
  });

  useEffect(() => {
    if (currentUser && typeof currentUser === 'object' && !user) {
      const userData = currentUser as User;
      setUser(userData);
      localStorage.setItem('auth-user', JSON.stringify(userData));
    } else if (error && !user) {
      // Se há erro na verificação e não tem usuário salvo, limpa qualquer estado inconsistente
      localStorage.removeItem('auth-user');
    }
  }, [currentUser, user, error]);

  const loginMutation = useMutation({
    mutationFn: async ({ username, password }: LoginCredentials) => {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        const error = new Error(errorData.message || 'Login failed');
        // Pass the errorType to help with specific error handling
        (error as any).errorType = errorData.errorType;
        throw error;
      }

      return response.json();
    },
    onSuccess: (user) => {
      setUser(user);
      localStorage.setItem('auth-user', JSON.stringify(user)); // Ensure user is saved on success
      queryClient.setQueryData(['/api/auth/me'], user);
      navigate('/dashboard');
    },
    onError: (error: any) => {
      console.error('Login mutation error:', error);
      // The error is already thrown from mutationFn, so no need to re-throw here
      // The UI can then catch this error and display appropriate messages based on error.errorType
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