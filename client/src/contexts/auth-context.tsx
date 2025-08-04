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
  const [hasAttemptedAuth, setHasAttemptedAuth] = useState(false);
  const queryClient = useQueryClient();

  // Check if user is already logged in
  const { data: currentUser, isLoading } = useQuery({
    queryKey: ['/api/auth/me'],
    retry: false,
    refetchOnWindowFocus: false,
    enabled: !user && !hasAttemptedAuth, // Only run if user is not set and we haven't attempted auth
  });

  useEffect(() => {
    if (currentUser && typeof currentUser === 'object' && !user) {
      setUser(currentUser as User);
      setHasAttemptedAuth(true);
    } else if (!isLoading && !currentUser && !hasAttemptedAuth) {
      setHasAttemptedAuth(true);
    }
  }, [currentUser, user, isLoading, hasAttemptedAuth]);

  const loginMutation = useMutation({
    mutationFn: async ({ username, password }: { username: string; password: string }) => {
      const response = await apiRequest('POST', '/api/auth/login', { username, password });
      return await response.json();
    },
    onSuccess: (userData) => {
      setUser(userData);
      setHasAttemptedAuth(true);
      queryClient.setQueryData(['/api/auth/me'], userData);
    },
  });

  const login = async (username: string, password: string) => {
    await loginMutation.mutateAsync({ username, password });
  };

  const logout = () => {
    console.log('Logout function called');
    setUser(null);
    setHasAttemptedAuth(false);
    queryClient.clear();
    queryClient.setQueryData(['/api/auth/me'], null);
    localStorage.removeItem('auth-token');
    // Force a complete reload to ensure clean state
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