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
  const [user, setUser] = useState<User | null>(null);
  const queryClient = useQueryClient();

  // Check if user is already logged in
  const { data: currentUser, isLoading } = useQuery({
    queryKey: ['/api/auth/me'],
    retry: false,
    refetchOnWindowFocus: false,
    enabled: !user, // Only run if user is not already set
  });

  useEffect(() => {
    if (currentUser && typeof currentUser === 'object' && !user) {
      setUser(currentUser as User);
    }
  }, [currentUser, user]);

  const loginMutation = useMutation({
    mutationFn: async ({ username, password }: { username: string; password: string }) => {
      const response = await apiRequest('POST', '/api/auth/login', { username, password });
      return await response.json();
    },
    onSuccess: (userData) => {
      setUser(userData);
      queryClient.setQueryData(['/api/auth/me'], userData);
    },
  });

  const login = async (username: string, password: string) => {
    await loginMutation.mutateAsync({ username, password });
  };

  const logout = () => {
    setUser(null);
    queryClient.removeQueries();
    queryClient.setQueryData(['/api/auth/me'], null);
    localStorage.removeItem('auth-token');
    // Force a page reload to ensure clean state
    window.location.reload();
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