# 🔐 Guía de Autenticación Frontend - API INGEOCIMYC

## 📋 Índice

- [Sistema de Autenticación](#sistema-de-autenticación)
- [Configuración Base](#configuración-base)
- [Implementación del Login Mejorado](#implementación-del-login-mejorado)
- [Persistencia de Sesión Avanzada](#persistencia-de-sesión-avanzada)
- [Gestión de Tokens](#gestión-de-tokens)
- [Auto-Renovación y Alertas](#auto-renovación-y-alertas)
- [Peticiones Autenticadas](#peticiones-autenticadas)
- [Sistema de Roles](#sistema-de-roles)
- [Rutas Protegidas](#rutas-protegidas)
- [Manejo de Errores](#manejo-de-errores)
- [Seguridad Avanzada](#seguridad-avanzada)
- [Mejores Prácticas UX](#mejores-prácticas-ux)
- [Ejemplos Completos](#ejemplos-completos)

---

## 🏗️ Sistema de Autenticación

La API utiliza **JWT (JSON Web Tokens)** con las siguientes características:

- **Token válido por**: 24 horas
- **Almacenamiento**: localStorage (recomendado para esta implementación)
- **Roles disponibles**: `admin`, `lab`, `client`
- **No hay refresh token automático**: Los tokens expiran después de 24 horas

### ⚠️ Puntos Importantes

- **NO existe endpoint `/auth/refresh`**
- **NO existe endpoint `/auth/logout`** (solo frontend)
- **NO existe endpoint `/auth/me`** o `/auth/verify`
- El logout es únicamente eliminar el token del localStorage

---

## ⚙️ Configuración Base

### 1. Cliente HTTP Base

```typescript
// utils/api-client.ts
class ApiClient {
  private baseURL: string;
  private token: string | null = null;

  constructor() {
    // Ajustar según tu entorno
    this.baseURL =
      process.env.NODE_ENV === 'production'
        ? 'https://api-cuentas-zlut.onrender.com/api'
        : 'http://localhost:5050/api';

    // Recuperar token existente
    this.token = localStorage.getItem('accessToken');
  }

  setToken(token: string): void {
    this.token = token;
    localStorage.setItem('accessToken', token);
  }

  clearToken(): void {
    this.token = null;
    localStorage.removeItem('accessToken');
  }

  getToken(): string | null {
    return this.token;
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return headers;
  }

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;

    const config: RequestInit = {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...options.headers,
      },
      credentials: 'include', // Para cookies si las usas
    };

    try {
      const response = await fetch(url, config);

      // Manejar token expirado
      if (response.status === 401) {
        this.clearToken();
        // Redirigir al login o emitir evento
        window.dispatchEvent(new CustomEvent('auth:expired'));
        throw new Error(
          'Sesión expirada. Por favor, inicia sesión nuevamente.',
        );
      }

      // Manejar otros errores
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message ||
            `Error ${response.status}: ${response.statusText}`,
        );
      }

      return await response.json();
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Error de conexión. Verifica tu conexión a internet.');
      }
      throw error;
    }
  }
}

// Instancia singleton
const apiClient = new ApiClient();
export default apiClient;
```

### 2. Tipos TypeScript

```typescript
// types/auth.ts
export interface User {
  email: string;
  name: string;
  role: 'admin' | 'lab' | 'client';
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  role?: 'admin' | 'lab' | 'client';
  jwt2?: string; // Solo para crear admin
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}

export interface ApiError {
  message: string;
  statusCode?: number;
  error?: string;
}
```

---

## 🔐 Implementación del Login Mejorado

### 1. Token Manager Avanzado

```typescript
// utils/token-manager.ts
interface TokenData {
  token: string;
  expirationTime: number;
  rememberMe: boolean;
  user: any;
}

class TokenManager {
  private readonly TOKEN_KEY = 'ingeocimyc_token';
  private readonly USER_KEY = 'ingeocimyc_user';
  private readonly REMEMBER_KEY = 'ingeocimyc_remember';
  private readonly TOKEN_EXPIRY_KEY = 'ingeocimyc_token_expiry';

  // JWT válido por 24 horas
  private readonly TOKEN_DURATION = 24 * 60 * 60 * 1000; // 24 horas en ms
  private readonly WARNING_TIME = 30 * 60 * 1000; // 30 minutos antes de expirar

  // Guardar token con información de expiración
  setToken(token: string, user: any, rememberMe: boolean = false): void {
    const expirationTime = Date.now() + this.TOKEN_DURATION;

    if (rememberMe) {
      // Usar localStorage para "Recordarme"
      localStorage.setItem(this.TOKEN_KEY, token);
      localStorage.setItem(this.USER_KEY, JSON.stringify(user));
      localStorage.setItem(this.REMEMBER_KEY, 'true');
      localStorage.setItem(this.TOKEN_EXPIRY_KEY, expirationTime.toString());
    } else {
      // Usar sessionStorage para sesión temporal
      sessionStorage.setItem(this.TOKEN_KEY, token);
      sessionStorage.setItem(this.USER_KEY, JSON.stringify(user));
      sessionStorage.setItem(this.TOKEN_EXPIRY_KEY, expirationTime.toString());

      // Limpiar localStorage si existía
      this.clearPersistentData();
    }
  }

  getToken(): string | null {
    // Buscar primero en sessionStorage, luego en localStorage
    let token = sessionStorage.getItem(this.TOKEN_KEY);
    let storage: Storage = sessionStorage;

    if (!token) {
      token = localStorage.getItem(this.TOKEN_KEY);
      storage = localStorage;
    }

    if (!token) return null;

    // Verificar si el token ha expirado
    const expiryStr = storage.getItem(this.TOKEN_EXPIRY_KEY);
    if (expiryStr) {
      const expiryTime = parseInt(expiryStr);
      if (Date.now() > expiryTime) {
        this.clearAllData();
        return null;
      }
    }

    return token;
  }

  getUser(): any | null {
    let userStr = sessionStorage.getItem(this.USER_KEY);

    if (!userStr) {
      userStr = localStorage.getItem(this.USER_KEY);
    }

    if (!userStr) return null;

    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }

  // Verificar si el token expirará pronto
  isTokenExpiringSoon(): boolean {
    let expiryStr = sessionStorage.getItem(this.TOKEN_EXPIRY_KEY);

    if (!expiryStr) {
      expiryStr = localStorage.getItem(this.TOKEN_EXPIRY_KEY);
    }

    if (!expiryStr) return false;

    const expiryTime = parseInt(expiryStr);
    const timeToExpiry = expiryTime - Date.now();

    return timeToExpiry <= this.WARNING_TIME && timeToExpiry > 0;
  }

  // Obtener tiempo restante en minutos
  getTimeToExpiry(): number {
    let expiryStr = sessionStorage.getItem(this.TOKEN_EXPIRY_KEY);

    if (!expiryStr) {
      expiryStr = localStorage.getItem(this.TOKEN_EXPIRY_KEY);
    }

    if (!expiryStr) return 0;

    const expiryTime = parseInt(expiryStr);
    const timeToExpiry = expiryTime - Date.now();

    return Math.max(0, Math.floor(timeToExpiry / (60 * 1000)));
  }

  isRememberMeEnabled(): boolean {
    return localStorage.getItem(this.REMEMBER_KEY) === 'true';
  }

  clearAllData(): void {
    // Limpiar sessionStorage
    sessionStorage.removeItem(this.TOKEN_KEY);
    sessionStorage.removeItem(this.USER_KEY);
    sessionStorage.removeItem(this.TOKEN_EXPIRY_KEY);

    // Limpiar localStorage
    this.clearPersistentData();
  }

  private clearPersistentData(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    localStorage.removeItem(this.REMEMBER_KEY);
    localStorage.removeItem(this.TOKEN_EXPIRY_KEY);
  }

  // Extender sesión (simular refresh - requiere nuevo login)
  needsReauth(): boolean {
    const token = this.getToken();
    return !token;
  }
}

const tokenManager = new TokenManager();
export default tokenManager;
```

### 2. Hook de Sesión Mejorado

```typescript
// hooks/useSession.ts
import { useState, useEffect, useCallback } from 'react';
import tokenManager from '../utils/token-manager';

interface SessionState {
  isAuthenticated: boolean;
  user: any | null;
  isExpiringSoon: boolean;
  timeToExpiry: number;
  needsReauth: boolean;
}

export const useSession = () => {
  const [sessionState, setSessionState] = useState<SessionState>({
    isAuthenticated: false,
    user: null,
    isExpiringSoon: false,
    timeToExpiry: 0,
    needsReauth: false,
  });

  const updateSessionState = useCallback(() => {
    const token = tokenManager.getToken();
    const user = tokenManager.getUser();
    const isExpiringSoon = tokenManager.isTokenExpiringSoon();
    const timeToExpiry = tokenManager.getTimeToExpiry();
    const needsReauth = tokenManager.needsReauth();

    setSessionState({
      isAuthenticated: !!token && !!user,
      user,
      isExpiringSoon,
      timeToExpiry,
      needsReauth,
    });
  }, []);

  useEffect(() => {
    // Verificar estado inicial
    updateSessionState();

    // Verificar periódicamente (cada minuto)
    const interval = setInterval(updateSessionState, 60000);

    // Escuchar eventos de autenticación
    const handleAuthEvent = () => updateSessionState();
    window.addEventListener('auth:login', handleAuthEvent);
    window.addEventListener('auth:logout', handleAuthEvent);
    window.addEventListener('auth:expired', handleAuthEvent);

    return () => {
      clearInterval(interval);
      window.removeEventListener('auth:login', handleAuthEvent);
      window.removeEventListener('auth:logout', handleAuthEvent);
      window.removeEventListener('auth:expired', handleAuthEvent);
    };
  }, [updateSessionState]);

  return sessionState;
};
```

---

## 📱 Persistencia de Sesión Avanzada

### 1. Componente de Alerta de Expiración

```typescript
// components/SessionExpiryWarning.tsx
import React, { useState, useEffect } from 'react';
import { useSession } from '../hooks/useSession';

interface SessionExpiryWarningProps {
  onExtendSession: () => Promise<boolean>;
  onLogout: () => void;
}

export const SessionExpiryWarning: React.FC<SessionExpiryWarningProps> = ({
  onExtendSession,
  onLogout,
}) => {
  const { isExpiringSoon, timeToExpiry } = useSession();
  const [isExtending, setIsExtending] = useState(false);

  if (!isExpiringSoon) return null;

  const handleExtendSession = async () => {
    setIsExtending(true);
    try {
      const success = await onExtendSession();
      if (!success) {
        // Si no se puede extender, hacer logout
        onLogout();
      }
    } catch (error) {
      console.error('Error extending session:', error);
      onLogout();
    } finally {
      setIsExtending(false);
    }
  };

  return (
    <div className="session-expiry-warning">
      <div className="warning-content">
        <h4>⚠️ Sesión por expirar</h4>
        <p>
          Tu sesión expirará en {timeToExpiry} minuto{timeToExpiry !== 1 ? 's' : ''}.
        </p>
        <div className="warning-actions">
          <button
            onClick={handleExtendSession}
            disabled={isExtending}
            className="btn-primary"
          >
            {isExtending ? 'Extendiendo...' : 'Extender sesión'}
          </button>
          <button onClick={onLogout} className="btn-secondary">
            Cerrar sesión
          </button>
        </div>
      </div>
    </div>
  );
};
```

### 2. Login Form Mejorado

```typescript
// components/LoginForm.tsx
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

export const LoginForm: React.FC = () => {
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await login(
        { email: formData.email, password: formData.password },
        formData.rememberMe
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al iniciar sesión');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  return (
    <div className="login-form-container">
      <form onSubmit={handleSubmit} className="login-form">
        <h2>Iniciar Sesión</h2>

        {error && (
          <div className="error-message" role="alert">
            {error}
          </div>
        )}

        <div className="form-group">
          <label htmlFor="email">Email:</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            autoComplete="username"
            disabled={isLoading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">Contraseña:</label>
          <div className="password-input">
            <input
              type={showPassword ? 'text' : 'password'}
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              autoComplete="current-password"
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="password-toggle"
              disabled={isLoading}
            >
              {showPassword ? '🙈' : '👁️'}
            </button>
          </div>
        </div>

        <div className="form-group checkbox-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              name="rememberMe"
              checked={formData.rememberMe}
              onChange={handleChange}
              disabled={isLoading}
            />
            <span className="checkmark"></span>
            Recordarme por 24 horas
          </label>
        </div>

        <button
          type="submit"
          disabled={isLoading || !formData.email || !formData.password}
          className="submit-button"
        >
          {isLoading ? (
            <>
              <span className="spinner"></span>
              Iniciando sesión...
            </>
          ) : (
            'Iniciar Sesión'
          )}
        </button>

        <div className="form-footer">
          <p>¿No tienes cuenta? <a href="/register">Regístrate aquí</a></p>
        </div>
      </form>
    </div>
  );
};
```

---

## ⚡ Auto-Renovación y Alertas

### 1. Context de Autenticación Mejorado

```typescript
// contexts/AuthContext.tsx
import React, { createContext, useContext, useReducer, useEffect } from 'react';
import tokenManager from '../utils/token-manager';
import authService from '../services/auth.service';
import { User, LoginRequest } from '../types/auth';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isExpiringSoon: boolean;
  timeToExpiry: number;
}

type AuthAction =
  | { type: 'LOGIN_START' }
  | { type: 'LOGIN_SUCCESS'; payload: User }
  | { type: 'LOGIN_FAILURE' }
  | { type: 'LOGOUT' }
  | { type: 'UPDATE_SESSION'; payload: Partial<AuthState> }
  | { type: 'SET_LOADING'; payload: boolean };

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  isExpiringSoon: false,
  timeToExpiry: 0,
};

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'LOGIN_START':
      return { ...state, isLoading: true };
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        isLoading: false,
      };
    case 'LOGIN_FAILURE':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        isExpiringSoon: false,
        timeToExpiry: 0,
      };
    case 'UPDATE_SESSION':
      return { ...state, ...action.payload };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    default:
      return state;
  }
};

interface AuthContextType extends AuthState {
  login: (credentials: LoginRequest, rememberMe?: boolean) => Promise<void>;
  logout: () => void;
  extendSession: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Verificar sesión al cargar
  useEffect(() => {
    const checkInitialAuth = () => {
      const token = tokenManager.getToken();
      const user = tokenManager.getUser();

      if (token && user) {
        dispatch({ type: 'LOGIN_SUCCESS', payload: user });
      } else {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    checkInitialAuth();
  }, []);

  // Monitorear estado de sesión
  useEffect(() => {
    const updateSessionState = () => {
      const isExpiringSoon = tokenManager.isTokenExpiringSoon();
      const timeToExpiry = tokenManager.getTimeToExpiry();

      dispatch({
        type: 'UPDATE_SESSION',
        payload: { isExpiringSoon, timeToExpiry },
      });

      // Si necesita reautenticación, hacer logout
      if (tokenManager.needsReauth() && state.isAuthenticated) {
        logout();
      }
    };

    // Verificar cada minuto
    const interval = setInterval(updateSessionState, 60000);

    // Verificar inmediatamente
    updateSessionState();

    return () => clearInterval(interval);
  }, [state.isAuthenticated]);

  const login = async (credentials: LoginRequest, rememberMe = false) => {
    dispatch({ type: 'LOGIN_START' });

    try {
      const user = await authService.login(credentials);
      const token = tokenManager.getToken();

      if (token) {
        tokenManager.setToken(token, user, rememberMe);
        dispatch({ type: 'LOGIN_SUCCESS', payload: user });

        // Emitir evento personalizado
        window.dispatchEvent(new CustomEvent('auth:login', { detail: user }));
      } else {
        throw new Error('No se recibió token de autenticación');
      }
    } catch (error) {
      dispatch({ type: 'LOGIN_FAILURE' });
      throw error;
    }
  };

  const logout = () => {
    tokenManager.clearAllData();
    dispatch({ type: 'LOGOUT' });

    // Emitir evento personalizado
    window.dispatchEvent(new CustomEvent('auth:logout'));
  };

  const extendSession = async (): Promise<boolean> => {
    // Como no hay refresh token, necesitamos que el usuario vuelva a hacer login
    // Esta función podría abrir un modal de re-autenticación
    try {
      // En una implementación real, aquí podrías:
      // 1. Abrir un modal de re-login
      // 2. Usar un refresh token si lo hubiera
      // 3. Validar el token actual contra el servidor

      // Por ahora, simplemente verificamos si el token sigue siendo válido
      const currentToken = tokenManager.getToken();
      if (currentToken) {
        // El token aún es válido, no necesita extensión
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error extending session:', error);
      return false;
    }
  };

  const contextValue: AuthContextType = {
    ...state,
    login,
    logout,
    extendSession,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
```

---

## 🚪 Implementación del Login

### 1. Servicio de Autenticación

```typescript
// services/auth.service.ts
import apiClient from '../utils/api-client';
import {
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  User,
} from '../types/auth';

class AuthService {
  async login(credentials: LoginRequest): Promise<User> {
    try {
      const response = await apiClient.request<AuthResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });

      // Guardar token
      apiClient.setToken(response.accessToken);

      return response.user;
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : 'Error al iniciar sesión',
      );
    }
  }

  async register(userData: RegisterRequest): Promise<User> {
    try {
      const response = await apiClient.request<AuthResponse>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData),
      });

      // Guardar token
      apiClient.setToken(response.accessToken);

      return response.user;
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : 'Error al registrar usuario',
      );
    }
  }

  logout(): void {
    apiClient.clearToken();
    // Opcional: redirigir o limpiar estado
    window.location.href = '/login';
  }

  isAuthenticated(): boolean {
    const token = apiClient.getToken();
    if (!token) return false;

    // Verificar si el token ha expirado
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const now = Date.now() / 1000;

      if (payload.exp < now) {
        this.logout();
        return false;
      }

      return true;
    } catch {
      this.logout();
      return false;
    }
  }

  getUserFromToken(): User | null {
    const token = apiClient.getToken();
    if (!token) return null;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return {
        email: payload.email,
        name: payload.name || payload.email,
        role: payload.role,
      };
    } catch {
      return null;
    }
  }
}

const authService = new AuthService();
export default authService;
```

### 2. Context de React

```typescript
// contexts/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import authService from '../services/auth.service';
import { User, LoginRequest, RegisterRequest } from '../types/auth';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  register: (userData: RegisterRequest) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  hasRole: (role: string) => boolean;
  canAccess: (allowedRoles: string[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar si hay un usuario logueado al cargar la app
    const initializeAuth = () => {
      if (authService.isAuthenticated()) {
        const userData = authService.getUserFromToken();
        setUser(userData);
      }
      setLoading(false);
    };

    initializeAuth();

    // Escuchar evento de token expirado
    const handleAuthExpired = () => {
      setUser(null);
      // Opcional: mostrar notificación
      alert('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
    };

    window.addEventListener('auth:expired', handleAuthExpired);

    return () => {
      window.removeEventListener('auth:expired', handleAuthExpired);
    };
  }, []);

  const login = async (credentials: LoginRequest) => {
    setLoading(true);
    try {
      const userData = await authService.login(credentials);
      setUser(userData);
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData: RegisterRequest) => {
    setLoading(true);
    try {
      const user = await authService.register(userData);
      setUser(user);
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  const hasRole = (role: string): boolean => {
    return user?.role === role;
  };

  const canAccess = (allowedRoles: string[]): boolean => {
    return user ? allowedRoles.includes(user.role) : false;
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user,
    hasRole,
    canAccess,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
```

---

## 🔑 Gestión de Tokens

### Token Manager Avanzado

```typescript
// utils/token-manager.ts
class TokenManager {
  private static readonly TOKEN_KEY = 'accessToken';
  private static readonly USER_KEY = 'userData';

  static setAuth(token: string, user: any): void {
    localStorage.setItem(this.TOKEN_KEY, token);
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  static getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  static getUser(): any | null {
    const userData = localStorage.getItem(this.USER_KEY);
    return userData ? JSON.parse(userData) : null;
  }

  static clearAuth(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
  }

  static isTokenValid(): boolean {
    const token = this.getToken();
    if (!token) return false;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const now = Date.now() / 1000;

      // Verificar si expira en los próximos 5 minutos
      const expiresIn = payload.exp - now;

      if (expiresIn <= 0) {
        this.clearAuth();
        return false;
      }

      // Advertir si expira pronto (menos de 5 minutos)
      if (expiresIn < 300) {
        console.warn(
          'El token expirará pronto. Considera solicitar al usuario que vuelva a iniciar sesión.',
        );
      }

      return true;
    } catch {
      this.clearAuth();
      return false;
    }
  }

  static getTokenExpiration(): Date | null {
    const token = this.getToken();
    if (!token) return null;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return new Date(payload.exp * 1000);
    } catch {
      return null;
    }
  }

  static getTimeUntilExpiration(): number {
    const expiration = this.getTokenExpiration();
    if (!expiration) return 0;

    return Math.max(0, expiration.getTime() - Date.now());
  }
}

export default TokenManager;
```

---

## 📡 Peticiones Autenticadas

### Hook Personalizado para Peticiones

```typescript
// hooks/useApi.ts
import { useState, useCallback } from 'react';
import apiClient from '../utils/api-client';
import { useAuth } from '../contexts/AuthContext';

interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export function useApi<T>() {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const { logout } = useAuth();

  const request = useCallback(
    async (endpoint: string, options: RequestInit = {}): Promise<T> => {
      setState(prev => ({ ...prev, loading: true, error: null }));

      try {
        const data = await apiClient.request<T>(endpoint, options);
        setState({ data, loading: false, error: null });
        return data;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Error desconocido';
        setState(prev => ({ ...prev, loading: false, error: errorMessage }));

        // Si es error de autenticación, hacer logout
        if (errorMessage.includes('expirada')) {
          logout();
        }

        throw error;
      }
    },
    [logout],
  );

  const get = useCallback(
    (endpoint: string) => request(endpoint, { method: 'GET' }),
    [request],
  );

  const post = useCallback(
    (endpoint: string, data: any) =>
      request(endpoint, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    [request],
  );

  const put = useCallback(
    (endpoint: string, data: any) =>
      request(endpoint, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    [request],
  );

  const patch = useCallback(
    (endpoint: string, data: any) =>
      request(endpoint, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    [request],
  );

  const del = useCallback(
    (endpoint: string) => request(endpoint, { method: 'DELETE' }),
    [request],
  );

  return {
    ...state,
    request,
    get,
    post,
    put,
    patch,
    delete: del,
  };
}
```

### Ejemplos de Uso

```typescript
// components/ProjectsList.tsx
import React, { useEffect } from 'react';
import { useApi } from '../hooks/useApi';

interface Project {
  id: number;
  name: string;
  status: string;
}

const ProjectsList: React.FC = () => {
  const { data: projects, loading, error, get } = useApi<Project[]>();

  useEffect(() => {
    // Esta petición requiere autenticación y rol admin
    get('/projects');
  }, [get]);

  if (loading) return <div>Cargando proyectos...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h2>Proyectos</h2>
      {projects?.map(project => (
        <div key={project.id}>
          <h3>{project.name}</h3>
          <p>Estado: {project.status}</p>
        </div>
      ))}
    </div>
  );
};

export default ProjectsList;
```

---

## 👥 Sistema de Roles

### Roles y Permisos

| Rol      | Descripción             | Endpoints Disponibles               |
| -------- | ----------------------- | ----------------------------------- |
| `admin`  | Administrador completo  | Todos los endpoints                 |
| `lab`    | Personal de laboratorio | `/api/lab/*`, lectura de proyectos  |
| `client` | Cliente                 | Servicios públicos, sus solicitudes |

### Implementación de Roles

```typescript
// utils/permissions.ts
export const PERMISSIONS = {
  // Endpoints públicos (no requieren autenticación)
  PUBLIC: [
    '/services',
    '/service-requests', // Solo POST
  ],

  // Solo admin
  ADMIN_ONLY: ['/projects', '/gastos-mes', '/pdf', '/resumen'],

  // Admin + Lab
  ADMIN_LAB: ['/lab/apiques', '/lab/profiles'],

  // Admin + Client
  ADMIN_CLIENT: ['/client/service-requests'],
};

export function canAccessEndpoint(
  userRole: string,
  endpoint: string,
  method: string = 'GET',
): boolean {
  // Endpoints públicos
  if (PERMISSIONS.PUBLIC.some(path => endpoint.startsWith(path))) {
    // POST a service-requests es público, otros métodos no
    if (endpoint.startsWith('/service-requests') && method !== 'POST') {
      return userRole === 'admin';
    }
    return true;
  }

  // Solo admin
  if (PERMISSIONS.ADMIN_ONLY.some(path => endpoint.startsWith(path))) {
    return userRole === 'admin';
  }

  // Admin + Lab
  if (PERMISSIONS.ADMIN_LAB.some(path => endpoint.startsWith(path))) {
    return ['admin', 'lab'].includes(userRole);
  }

  // Admin + Client
  if (PERMISSIONS.ADMIN_CLIENT.some(path => endpoint.startsWith(path))) {
    return ['admin', 'client'].includes(userRole);
  }

  // Por defecto, solo admin puede acceder
  return userRole === 'admin';
}
```

---

## 🛡️ Rutas Protegidas

### Componente ProtectedRoute

```typescript
// components/ProtectedRoute.tsx
import React, { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: string[];
  requiredRole?: string;
  fallbackPath?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
  requiredRole,
  fallbackPath = '/login'
}) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Mostrar loading mientras verifica autenticación
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Verificando permisos...</div>
      </div>
    );
  }

  // Redirigir a login si no está autenticado
  if (!user) {
    return <Navigate to={fallbackPath} state={{ from: location }} replace />;
  }

  // Verificar rol específico
  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/unauthorized" replace />;
  }

  // Verificar roles permitidos
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
```

### Configuración de Rutas

```typescript
// App.tsx
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import AdminDashboard from './pages/AdminDashboard';
import LabDashboard from './pages/LabDashboard';
import ClientDashboard from './pages/ClientDashboard';
import UnauthorizedPage from './pages/UnauthorizedPage';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Rutas públicas */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />

          {/* Rutas protegidas por rol */}
          <Route path="/admin/*" element={
            <ProtectedRoute requiredRole="admin">
              <AdminDashboard />
            </ProtectedRoute>
          } />

          <Route path="/lab/*" element={
            <ProtectedRoute allowedRoles={['admin', 'lab']}>
              <LabDashboard />
            </ProtectedRoute>
          } />

          <Route path="/client/*" element={
            <ProtectedRoute allowedRoles={['admin', 'client']}>
              <ClientDashboard />
            </ProtectedRoute>
          } />

          {/* Ruta por defecto */}
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
```

---

## 🔒 Seguridad Avanzada

### 1. Detector de Múltiples Pestañas

```typescript
// utils/multi-tab-manager.ts
class MultiTabManager {
  private readonly STORAGE_KEY = 'ingeocimyc_active_tab';
  private readonly HEARTBEAT_INTERVAL = 5000; // 5 segundos
  private tabId: string;
  private heartbeatInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.tabId = this.generateTabId();
    this.startHeartbeat();
    this.setupStorageListener();
    this.setupUnloadListener();
  }

  private generateTabId(): string {
    return `tab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private startHeartbeat(): void {
    this.updateTabTimestamp();
    this.heartbeatInterval = setInterval(() => {
      this.updateTabTimestamp();
    }, this.HEARTBEAT_INTERVAL);
  }

  private updateTabTimestamp(): void {
    const tabData = {
      id: this.tabId,
      timestamp: Date.now(),
    };
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(tabData));
  }

  private setupStorageListener(): void {
    window.addEventListener('storage', e => {
      if (e.key === this.STORAGE_KEY && e.newValue) {
        const newTabData = JSON.parse(e.newValue);

        // Si otra pestaña se volvió activa, pausar esta
        if (newTabData.id !== this.tabId) {
          this.pauseSession();
        }
      }
    });
  }

  private setupUnloadListener(): void {
    window.addEventListener('beforeunload', () => {
      this.cleanup();
    });
  }

  private pauseSession(): void {
    // Pausar actividad en esta pestaña
    window.dispatchEvent(new CustomEvent('session:paused'));
  }

  cleanup(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    // Solo limpiar si esta pestaña era la activa
    const currentTabData = localStorage.getItem(this.STORAGE_KEY);
    if (currentTabData) {
      const data = JSON.parse(currentTabData);
      if (data.id === this.tabId) {
        localStorage.removeItem(this.STORAGE_KEY);
      }
    }
  }
}

// Instancia singleton
const multiTabManager = new MultiTabManager();
export default multiTabManager;
```

### 2. Sistema de Detección de Inactividad

```typescript
// utils/inactivity-detector.ts
class InactivityDetector {
  private readonly WARNING_TIME = 20 * 60 * 1000; // 20 minutos
  private readonly LOGOUT_TIME = 25 * 60 * 1000; // 25 minutos

  private lastActivity: number = Date.now();
  private warningTimer: NodeJS.Timeout | null = null;
  private logoutTimer: NodeJS.Timeout | null = null;
  private isWarningShown: boolean = false;

  constructor(
    private onWarning: () => void,
    private onLogout: () => void,
  ) {
    this.setupEventListeners();
    this.startTimers();
  }

  private setupEventListeners(): void {
    const events = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
      'click',
    ];

    events.forEach(event => {
      document.addEventListener(event, this.resetTimers.bind(this), true);
    });
  }

  private resetTimers(): void {
    this.lastActivity = Date.now();
    this.isWarningShown = false;

    // Limpiar timers existentes
    if (this.warningTimer) clearTimeout(this.warningTimer);
    if (this.logoutTimer) clearTimeout(this.logoutTimer);

    // Iniciar nuevos timers
    this.startTimers();
  }

  private startTimers(): void {
    // Timer para mostrar advertencia
    this.warningTimer = setTimeout(() => {
      if (!this.isWarningShown) {
        this.isWarningShown = true;
        this.onWarning();
      }
    }, this.WARNING_TIME);

    // Timer para logout automático
    this.logoutTimer = setTimeout(() => {
      this.onLogout();
    }, this.LOGOUT_TIME);
  }

  destroy(): void {
    const events = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
      'click',
    ];

    events.forEach(event => {
      document.removeEventListener(event, this.resetTimers.bind(this), true);
    });

    if (this.warningTimer) clearTimeout(this.warningTimer);
    if (this.logoutTimer) clearTimeout(this.logoutTimer);
  }
}

export default InactivityDetector;
```

### 3. Componente de Advertencia de Inactividad

```typescript
// components/InactivityWarning.tsx
import React, { useState, useEffect } from 'react';

interface InactivityWarningProps {
  isVisible: boolean;
  onContinue: () => void;
  onLogout: () => void;
  timeRemaining: number; // en segundos
}

export const InactivityWarning: React.FC<InactivityWarningProps> = ({
  isVisible,
  onContinue,
  onLogout,
  timeRemaining: initialTime
}) => {
  const [timeRemaining, setTimeRemaining] = useState(initialTime);

  useEffect(() => {
    if (!isVisible) return;

    setTimeRemaining(initialTime);

    const countdown = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(countdown);
          onLogout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(countdown);
  }, [isVisible, initialTime, onLogout]);

  if (!isVisible) return null;

  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;

  return (
    <div className="inactivity-warning-overlay">
      <div className="inactivity-warning-modal">
        <h3>⏰ Sesión inactiva</h3>
        <p>
          Tu sesión se cerrará automáticamente en{' '}
          <strong>
            {minutes}:{seconds.toString().padStart(2, '0')}
          </strong>
        </p>
        <p>¿Deseas continuar con tu sesión?</p>

        <div className="warning-actions">
          <button onClick={onContinue} className="btn-primary">
            Continuar sesión
          </button>
          <button onClick={onLogout} className="btn-secondary">
            Cerrar sesión
          </button>
        </div>
      </div>
    </div>
  );
};
```

### 4. Validación de Integridad del Token

```typescript
// utils/token-validator.ts
import tokenManager from './token-manager';

class TokenValidator {
  private readonly VALIDATION_INTERVAL = 5 * 60 * 1000; // 5 minutos
  private validationTimer: NodeJS.Timeout | null = null;

  startValidation(onInvalidToken: () => void): void {
    this.validationTimer = setInterval(() => {
      this.validateCurrentToken(onInvalidToken);
    }, this.VALIDATION_INTERVAL);

    // Validar inmediatamente
    this.validateCurrentToken(onInvalidToken);
  }

  private validateCurrentToken(onInvalidToken: () => void): void {
    const token = tokenManager.getToken();

    if (!token) {
      onInvalidToken();
      return;
    }

    // Validar estructura del JWT
    if (!this.isValidJWTStructure(token)) {
      console.warn('Token con estructura inválida detectado');
      onInvalidToken();
      return;
    }

    // Validar expiración
    if (this.isTokenExpired(token)) {
      console.warn('Token expirado detectado');
      onInvalidToken();
      return;
    }
  }

  private isValidJWTStructure(token: string): boolean {
    const parts = token.split('.');
    if (parts.length !== 3) return false;

    try {
      // Validar que se puede decodificar el payload
      const payload = JSON.parse(atob(parts[1]));
      return !!(payload.exp && payload.iat);
    } catch {
      return false;
    }
  }

  private isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const now = Math.floor(Date.now() / 1000);
      return payload.exp <= now;
    } catch {
      return true;
    }
  }

  stopValidation(): void {
    if (this.validationTimer) {
      clearInterval(this.validationTimer);
      this.validationTimer = null;
    }
  }
}

const tokenValidator = new TokenValidator();
export default tokenValidator;
```

---

## 🎯 Mejores Prácticas UX

### 1. Loading States Inteligentes

```typescript
// hooks/useSmartLoading.ts
import { useState, useEffect, useRef } from 'react';

interface UseSmartLoadingOptions {
  minDuration?: number; // Duración mínima del loading
  showInstantly?: boolean; // Mostrar loading inmediatamente
}

export const useSmartLoading = (options: UseSmartLoadingOptions = {}) => {
  const { minDuration = 500, showInstantly = false } = options;
  const [isLoading, setIsLoading] = useState(false);
  const [shouldShow, setShouldShow] = useState(false);
  const startTimeRef = useRef<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const startLoading = () => {
    startTimeRef.current = Date.now();
    setIsLoading(true);

    if (showInstantly) {
      setShouldShow(true);
    } else {
      // Mostrar loading después de 150ms para evitar flashes
      timeoutRef.current = setTimeout(() => {
        setShouldShow(true);
      }, 150);
    }
  };

  const stopLoading = () => {
    const elapsed = Date.now() - startTimeRef.current;

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (elapsed < minDuration && shouldShow) {
      // Esperar hasta completar la duración mínima
      setTimeout(() => {
        setIsLoading(false);
        setShouldShow(false);
      }, minDuration - elapsed);
    } else {
      setIsLoading(false);
      setShouldShow(false);
    }
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    isLoading: isLoading && shouldShow,
    startLoading,
    stopLoading,
  };
};
```

### 2. Feedback Visual Mejorado

```typescript
// components/SmartButton.tsx
import React from 'react';
import { useSmartLoading } from '../hooks/useSmartLoading';

interface SmartButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  success?: boolean;
  error?: boolean;
  children: React.ReactNode;
}

export const SmartButton: React.FC<SmartButtonProps> = ({
  loading = false,
  success = false,
  error = false,
  children,
  className = '',
  disabled,
  ...props
}) => {
  const getIcon = () => {
    if (loading) return '⏳';
    if (success) return '✅';
    if (error) return '❌';
    return null;
  };

  const getStatusClass = () => {
    if (loading) return 'btn-loading';
    if (success) return 'btn-success';
    if (error) return 'btn-error';
    return '';
  };

  return (
    <button
      className={`smart-button ${getStatusClass()} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {getIcon() && <span className="btn-icon">{getIcon()}</span>}
      <span className="btn-text">{children}</span>
    </button>
  );
};
```

### 3. Manejo de Estado de Conexión

```typescript
// hooks/useConnectionStatus.ts
import { useState, useEffect } from 'react';

export const useConnectionStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);

      // Si estuvo offline, marcar para mostrar mensaje de reconexión
      if (wasOffline) {
        window.dispatchEvent(new CustomEvent('connection:restored'));
        setWasOffline(false);
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setWasOffline(true);
      window.dispatchEvent(new CustomEvent('connection:lost'));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [wasOffline]);

  return { isOnline, wasOffline };
};
```

### 4. Componente de Estado de Conexión

```typescript
// components/ConnectionStatus.tsx
import React, { useState, useEffect } from 'react';
import { useConnectionStatus } from '../hooks/useConnectionStatus';

export const ConnectionStatus: React.FC = () => {
  const { isOnline, wasOffline } = useConnectionStatus();
  const [showRestored, setShowRestored] = useState(false);

  useEffect(() => {
    if (isOnline && wasOffline) {
      setShowRestored(true);

      // Ocultar mensaje después de 3 segundos
      const timer = setTimeout(() => {
        setShowRestored(false);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [isOnline, wasOffline]);

  if (isOnline && !showRestored) return null;

  return (
    <div className={`connection-status ${isOnline ? 'online' : 'offline'}`}>
      {isOnline ? (
        showRestored && (
          <>
            <span className="status-icon">🌐</span>
            <span>Conexión restaurada</span>
          </>
        )
      ) : (
        <>
          <span className="status-icon">⚠️</span>
          <span>Sin conexión a internet</span>
        </>
      )}
    </div>
  );
};
```

---

## ⚠️ Manejo de Errores

### Interceptor de Errores

```typescript
// utils/error-handler.ts
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public originalError?: any,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export function handleApiError(error: any): ApiError {
  if (error instanceof ApiError) {
    return error;
  }

  // Error de red
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return new ApiError('Error de conexión. Verifica tu conexión a internet.');
  }

  // Error HTTP
  if (error.response) {
    const status = error.response.status;
    const message = error.response.data?.message || error.message;

    switch (status) {
      case 401:
        return new ApiError(
          'Sesión expirada. Por favor, inicia sesión nuevamente.',
          401,
        );
      case 403:
        return new ApiError(
          'No tienes permisos para realizar esta acción.',
          403,
        );
      case 404:
        return new ApiError('El recurso solicitado no fue encontrado.', 404);
      case 429:
        return new ApiError(
          'Demasiadas solicitudes. Intenta nuevamente más tarde.',
          429,
        );
      case 500:
        return new ApiError(
          'Error interno del servidor. Intenta nuevamente.',
          500,
        );
      default:
        return new ApiError(message || 'Error desconocido', status);
    }
  }

  return new ApiError(error.message || 'Error desconocido');
}

// Hook para manejo de errores
export function useErrorHandler() {
  const showError = (error: any) => {
    const apiError = handleApiError(error);

    // Aquí puedes integrar con tu sistema de notificaciones
    console.error('API Error:', apiError);

    // Ejemplo con alert (reemplazar con tu sistema de notificaciones)
    alert(apiError.message);
  };

  return { showError };
}
```

---

## 📝 Ejemplos Completos

### 1. Página de Login

```typescript
// pages/LoginPage.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useErrorHandler } from '../utils/error-handler';

const LoginPage: React.FC = () => {
  const [credentials, setCredentials] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);

  const { login, isAuthenticated, user } = useAuth();
  const { showError } = useErrorHandler();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirigir si ya está autenticado
  useEffect(() => {
    if (isAuthenticated && user) {
      const from = location.state?.from?.pathname || getDefaultRoute(user.role);
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, user, navigate, location]);

  const getDefaultRoute = (role: string): string => {
    switch (role) {
      case 'admin': return '/admin';
      case 'lab': return '/lab';
      case 'client': return '/client';
      default: return '/';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await login(credentials);
      // La redirección se maneja en el useEffect
    } catch (error) {
      showError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCredentials(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Iniciar Sesión
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            API INGEOCIMYC
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="sr-only">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={credentials.email}
              onChange={handleChange}
              className="relative block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Correo electrónico"
              disabled={loading}
            />
          </div>

          <div>
            <label htmlFor="password" className="sr-only">
              Contraseña
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              value={credentials.password}
              onChange={handleChange}
              className="relative block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Contraseña"
              disabled={loading}
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
```

### 2. Servicio de Proyectos

```typescript
// services/projects.service.ts
import apiClient from '../utils/api-client';

export interface Project {
  id: number;
  name: string;
  status: string;
  clientName: string;
  startDate: string;
  budget?: number;
}

export interface CreateProjectRequest {
  name: string;
  clientName: string;
  description?: string;
  budget?: number;
}

class ProjectsService {
  async getAll(): Promise<Project[]> {
    return apiClient.request<Project[]>('/projects');
  }

  async getById(id: number): Promise<Project> {
    return apiClient.request<Project>(`/projects/${id}`);
  }

  async create(project: CreateProjectRequest): Promise<Project> {
    return apiClient.request<Project>('/projects', {
      method: 'POST',
      body: JSON.stringify(project),
    });
  }

  async update(
    id: number,
    project: Partial<CreateProjectRequest>,
  ): Promise<Project> {
    return apiClient.request<Project>(`/projects/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(project),
    });
  }

  async delete(id: number): Promise<void> {
    await apiClient.request<void>(`/projects/${id}`, {
      method: 'DELETE',
    });
  }
}

const projectsService = new ProjectsService();
export default projectsService;
```

### 3. Hook de Token Expiration

```typescript
// hooks/useTokenExpiration.ts
import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import TokenManager from '../utils/token-manager';

export function useTokenExpiration() {
  const [timeUntilExpiration, setTimeUntilExpiration] = useState<number>(0);
  const { logout } = useAuth();

  useEffect(() => {
    const updateTimer = () => {
      const time = TokenManager.getTimeUntilExpiration();
      setTimeUntilExpiration(time);

      // Si queda menos de 5 minutos, mostrar advertencia
      if (time > 0 && time < 5 * 60 * 1000) {
        console.warn('Tu sesión expirará pronto');
      }

      // Si ya expiró, hacer logout
      if (time <= 0 && TokenManager.getToken()) {
        logout();
      }
    };

    // Actualizar cada minuto
    const interval = setInterval(updateTimer, 60000);
    updateTimer(); // Ejecutar inmediatamente

    return () => clearInterval(interval);
  }, [logout]);

  const formatTimeRemaining = (): string => {
    if (timeUntilExpiration <= 0) return 'Expirado';

    const hours = Math.floor(timeUntilExpiration / (1000 * 60 * 60));
    const minutes = Math.floor(
      (timeUntilExpiration % (1000 * 60 * 60)) / (1000 * 60),
    );

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  return {
    timeUntilExpiration,
    formatTimeRemaining,
    isExpiringSoon:
      timeUntilExpiration > 0 && timeUntilExpiration < 5 * 60 * 1000,
  };
}
```

---

## 🔧 Configuración por Entorno

### Variables de Entorno

```env
# .env.development
REACT_APP_API_URL=http://localhost:5050/api
REACT_APP_ENV=development

# .env.production
REACT_APP_API_URL=https://api-cuentas-zlut.onrender.com/api
REACT_APP_ENV=production
```

### Configuración Dinámica

```typescript
// config/api.config.ts
export const API_CONFIG = {
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5050/api',
  timeout: 10000,
  retryAttempts: 3,
  retryDelay: 1000,
};

// Para desarrollo local, puedes usar:
// const API_BASE_URL = 'http://localhost:5050/api';

// Para producción:
// const API_BASE_URL = 'https://api-cuentas-zlut.onrender.com/api';
```

---

## 📚 Resumen de Endpoints

### Autenticación

- `POST /api/auth/login` - Iniciar sesión
- `POST /api/auth/register` - Registrar usuario

### Por Rol

#### 🔓 Públicos (sin autenticación)

- `GET /api/services/*` - Servicios
- `POST /api/service-requests` - Crear solicitud

#### 👑 Solo Admin

- `GET/POST/PUT/DELETE /api/projects/*` - Proyectos
- `GET/POST/PUT/DELETE /api/gastos-mes/*` - Finanzas
- `GET /api/pdf/*` - PDFs
- `GET /api/resumen/*` - Resúmenes

#### 🧪 Admin + Lab

- `GET/POST/PUT /api/lab/apiques/*` - Apiques
- `GET/POST/PUT /api/lab/profiles/*` - Perfiles
- `DELETE /api/lab/profiles/*` - Solo admin puede eliminar

#### 👤 Admin + Client

- `GET /api/client/service-requests/*` - Solicitudes de cliente

---

## ⚡ Checklist de Implementación

- [ ] Configurar cliente HTTP base
- [ ] Implementar AuthContext
- [ ] Crear servicios de autenticación
- [ ] Configurar rutas protegidas
- [ ] Implementar manejo de errores
- [ ] Configurar interceptores de respuesta
- [ ] Testear expiración de tokens
- [ ] Verificar permisos por rol
- [ ] Implementar logout automático
- [ ] Configurar variables de entorno

---

## 🆘 Problemas Comunes

### 1. **Error 401 - Unauthorized**

```typescript
// Verificar que el token esté siendo enviado
const token = localStorage.getItem('accessToken');
console.log('Token:', token);

// Verificar formato del header
console.log('Authorization header:', `Bearer ${token}`);
```

### 2. **CORS Issues**

```typescript
// Asegúrate de incluir credentials si usas cookies
fetch(url, {
  credentials: 'include',
  // ... otras opciones
});
```

### 3. **Token Expiration**

```typescript
// Verificar expiración antes de hacer peticiones
if (!TokenManager.isTokenValid()) {
  // Redirigir a login
  authService.logout();
}
```

### 4. **Rutas de Desarrollo vs Producción**

```typescript
// Usar variables de entorno
const baseURL =
  process.env.NODE_ENV === 'production'
    ? 'https://api-cuentas-zlut.onrender.com/api'
    : 'http://localhost:5050/api';
```

---

## 🔗 Enlaces Útiles

- **API Base URL (Producción)**: https://api-cuentas-zlut.onrender.com/api
- **API Base URL (Desarrollo)**: http://localhost:5050/api
- **Documentación Swagger**: /api-docs
- **Health Check**: /api/health

---

## 🚀 Mejoras Recomendadas para el Sistema de Login

### 1. Sistema de Re-autenticación Modal

```typescript
// components/ReauthModal.tsx
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface ReauthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  reason: 'expiring' | 'expired' | 'security';
}

export const ReauthModal: React.FC<ReauthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  reason
}) => {
  const { user, login } = useAuth();
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getTitle = () => {
    switch (reason) {
      case 'expiring': return '🔄 Renovar Sesión';
      case 'expired': return '⏰ Sesión Expirada';
      case 'security': return '🔒 Verificación de Seguridad';
      default: return 'Autenticación Requerida';
    }
  };

  const getMessage = () => {
    switch (reason) {
      case 'expiring':
        return 'Tu sesión expirará pronto. Ingresa tu contraseña para continuar.';
      case 'expired':
        return 'Tu sesión ha expirado. Ingresa tu contraseña para acceder nuevamente.';
      case 'security':
        return 'Por seguridad, confirma tu contraseña para continuar.';
      default:
        return 'Ingresa tu contraseña para continuar.';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.email || !password) return;

    setIsLoading(true);
    setError(null);

    try {
      await login({ email: user.email, password }, true);
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error de autenticación');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="reauth-modal-overlay" onClick={onClose}>
      <div className="reauth-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{getTitle()}</h3>
          <button onClick={onClose} className="close-button">×</button>
        </div>

        <div className="modal-body">
          <p>{getMessage()}</p>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Usuario: <strong>{user?.email}</strong></label>
            </div>

            <div className="form-group">
              <label htmlFor="reauth-password">Contraseña:</label>
              <input
                type="password"
                id="reauth-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                autoFocus
                disabled={isLoading}
              />
            </div>

            {error && (
              <div className="error-message">{error}</div>
            )}

            <div className="modal-actions">
              <button
                type="submit"
                disabled={isLoading || !password}
                className="btn-primary"
              >
                {isLoading ? 'Verificando...' : 'Confirmar'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary"
                disabled={isLoading}
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
```

### 2. Sistema de Notificaciones Toast

```typescript
// contexts/NotificationContext.tsx
import React, { createContext, useContext, useState, useCallback } from 'react';

interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
  persistent?: boolean;
}

interface NotificationContextType {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({
  children
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = useCallback((notification: Omit<Notification, 'id'>) => {
    const id = `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newNotification: Notification = {
      ...notification,
      id,
      duration: notification.duration ?? 5000,
    };

    setNotifications(prev => [...prev, newNotification]);

    // Auto-remove after duration (unless persistent)
    if (!newNotification.persistent && newNotification.duration > 0) {
      setTimeout(() => {
        removeNotification(id);
      }, newNotification.duration);
    }
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  return (
    <NotificationContext.Provider value={{
      notifications,
      addNotification,
      removeNotification,
      clearAll,
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
```

### 3. Hook de Autenticación Avanzado

```typescript
// hooks/useAdvancedAuth.ts
import { useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import tokenManager from '../utils/token-manager';
import InactivityDetector from '../utils/inactivity-detector';

export const useAdvancedAuth = () => {
  const auth = useAuth();
  const { addNotification } = useNotifications();

  // Login con feedback mejorado
  const loginWithFeedback = useCallback(
    async (
      credentials: { email: string; password: string },
      rememberMe = false,
    ) => {
      try {
        await auth.login(credentials, rememberMe);

        addNotification({
          type: 'success',
          title: '¡Bienvenido!',
          message: `Has iniciado sesión como ${credentials.email}`,
          duration: 3000,
        });

        // Configurar detector de inactividad
        const inactivityDetector = new InactivityDetector(
          () => {
            addNotification({
              type: 'warning',
              title: 'Sesión inactiva',
              message: 'Tu sesión se cerrará pronto por inactividad',
              persistent: true,
            });
          },
          () => {
            logoutWithFeedback('Sesión cerrada por inactividad');
          },
        );

        return true;
      } catch (error) {
        addNotification({
          type: 'error',
          title: 'Error de autenticación',
          message: error instanceof Error ? error.message : 'Error desconocido',
          duration: 5000,
        });

        return false;
      }
    },
    [auth, addNotification],
  );

  // Logout con feedback
  const logoutWithFeedback = useCallback(
    (reason?: string) => {
      auth.logout();

      addNotification({
        type: 'info',
        title: 'Sesión cerrada',
        message: reason || 'Has cerrado sesión correctamente',
        duration: 3000,
      });
    },
    [auth, addNotification],
  );

  // Verificar sesión con notificaciones
  const checkSessionHealth = useCallback(() => {
    const token = tokenManager.getToken();
    const user = tokenManager.getUser();

    if (!token || !user) {
      if (auth.isAuthenticated) {
        logoutWithFeedback('Sesión inválida detectada');
      }
      return false;
    }

    // Verificar si expira pronto
    if (tokenManager.isTokenExpiringSoon()) {
      const timeToExpiry = tokenManager.getTimeToExpiry();

      addNotification({
        type: 'warning',
        title: '⏰ Sesión por expirar',
        message: `Tu sesión expirará en ${timeToExpiry} minutos`,
        persistent: true,
      });
    }

    return true;
  }, [auth, logoutWithFeedback, addNotification]);

  return {
    ...auth,
    loginWithFeedback,
    logoutWithFeedback,
    checkSessionHealth,
  };
};
```

### 4. Componente de Estado Global

```typescript
// components/GlobalAuthStatus.tsx
import React, { useEffect, useState } from 'react';
import { useAdvancedAuth } from '../hooks/useAdvancedAuth';
import { useConnectionStatus } from '../hooks/useConnectionStatus';
import { ReauthModal } from './ReauthModal';
import { SessionExpiryWarning } from './SessionExpiryWarning';
import { InactivityWarning } from './InactivityWarning';
import { ConnectionStatus } from './ConnectionStatus';

export const GlobalAuthStatus: React.FC = () => {
  const auth = useAdvancedAuth();
  const { isOnline } = useConnectionStatus();
  const [showReauthModal, setShowReauthModal] = useState(false);
  const [reauthReason, setReauthReason] = useState<'expiring' | 'expired' | 'security'>('expired');
  const [showInactivityWarning, setShowInactivityWarning] = useState(false);

  // Verificar sesión periódicamente
  useEffect(() => {
    if (!auth.isAuthenticated) return;

    const interval = setInterval(() => {
      const isHealthy = auth.checkSessionHealth();

      if (!isHealthy && auth.isAuthenticated) {
        setReauthReason('expired');
        setShowReauthModal(true);
      }
    }, 60000); // Cada minuto

    return () => clearInterval(interval);
  }, [auth]);

  // Escuchar eventos de sesión
  useEffect(() => {
    const handleSessionExpired = () => {
      setReauthReason('expired');
      setShowReauthModal(true);
    };

    const handleSessionExpiring = () => {
      setReauthReason('expiring');
      setShowReauthModal(true);
    };

    const handleInactivityWarning = () => {
      setShowInactivityWarning(true);
    };

    window.addEventListener('auth:expired', handleSessionExpired);
    window.addEventListener('auth:expiring', handleSessionExpiring);
    window.addEventListener('inactivity:warning', handleInactivityWarning);

    return () => {
      window.removeEventListener('auth:expired', handleSessionExpired);
      window.removeEventListener('auth:expiring', handleSessionExpiring);
      window.removeEventListener('inactivity:warning', handleInactivityWarning);
    };
  }, []);

  const handleReauthSuccess = () => {
    setShowReauthModal(false);
    setShowInactivityWarning(false);
  };

  const handleReauthCancel = () => {
    setShowReauthModal(false);
    auth.logoutWithFeedback('Autenticación cancelada');
  };

  return (
    <>
      <ConnectionStatus />

      {auth.isExpiringSoon && (
        <SessionExpiryWarning
          onExtendSession={async () => {
            setReauthReason('expiring');
            setShowReauthModal(true);
            return true;
          }}
          onLogout={() => auth.logoutWithFeedback('Sesión cerrada manualmente')}
        />
      )}

      <InactivityWarning
        isVisible={showInactivityWarning}
        onContinue={() => setShowInactivityWarning(false)}
        onLogout={() => auth.logoutWithFeedback('Sesión cerrada por inactividad')}
        timeRemaining={300} // 5 minutos
      />

      <ReauthModal
        isOpen={showReauthModal}
        onClose={handleReauthCancel}
        onSuccess={handleReauthSuccess}
        reason={reauthReason}
      />
    </>
  );
};
```

---

## 🛡️ Configuración de Seguridad Adicional

### 1. Content Security Policy (CSP)

```typescript
// utils/security-config.ts
export const setupSecurityHeaders = () => {
  // CSP para el frontend
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'", // Solo para desarrollo
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "connect-src 'self' https://api-cuentas-zlut.onrender.com",
    "font-src 'self'",
    "object-src 'none'",
    "media-src 'self'",
    "frame-src 'none'",
  ].join('; ');

  // Configurar meta tag si es necesario
  const meta = document.createElement('meta');
  meta.httpEquiv = 'Content-Security-Policy';
  meta.content = csp;
  document.head.appendChild(meta);
};
```

### 2. Validación de Input Mejorada

```typescript
// utils/input-validation.ts
export class InputValidator {
  static validateEmail(email: string): { isValid: boolean; error?: string } {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email) {
      return { isValid: false, error: 'El email es requerido' };
    }

    if (!emailRegex.test(email)) {
      return { isValid: false, error: 'Formato de email inválido' };
    }

    if (email.length > 254) {
      return { isValid: false, error: 'Email demasiado largo' };
    }

    return { isValid: true };
  }

  static validatePassword(password: string): {
    isValid: boolean;
    error?: string;
    strength?: string;
  } {
    if (!password) {
      return { isValid: false, error: 'La contraseña es requerida' };
    }

    if (password.length < 8) {
      return {
        isValid: false,
        error: 'La contraseña debe tener al menos 8 caracteres',
      };
    }

    if (password.length > 128) {
      return { isValid: false, error: 'La contraseña es demasiado larga' };
    }

    // Verificar fortaleza
    let strength = 'weak';
    const hasLower = /[a-z]/.test(password);
    const hasUpper = /[A-Z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    const strengthCount = [hasLower, hasUpper, hasNumber, hasSpecial].filter(
      Boolean,
    ).length;

    if (strengthCount >= 3 && password.length >= 12) {
      strength = 'strong';
    } else if (strengthCount >= 2 && password.length >= 10) {
      strength = 'medium';
    }

    return { isValid: true, strength };
  }

  static sanitizeInput(input: string): string {
    return input
      .trim()
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/[<>]/g, '');
  }
}
```

---

## 📊 Monitoreo y Analytics

### 1. Sistema de Logs de Autenticación

```typescript
// utils/auth-logger.ts
interface AuthEvent {
  type:
    | 'login'
    | 'logout'
    | 'token_expired'
    | 'session_extended'
    | 'failed_login';
  timestamp: number;
  userEmail?: string;
  userAgent: string;
  ip?: string;
  metadata?: Record<string, any>;
}

class AuthLogger {
  private readonly MAX_LOGS = 100;
  private readonly STORAGE_KEY = 'auth_logs';

  log(event: Omit<AuthEvent, 'timestamp' | 'userAgent'>): void {
    const authEvent: AuthEvent = {
      ...event,
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
    };

    const logs = this.getLogs();
    logs.push(authEvent);

    // Mantener solo los últimos MAX_LOGS
    if (logs.length > this.MAX_LOGS) {
      logs.splice(0, logs.length - this.MAX_LOGS);
    }

    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(logs));
    } catch (error) {
      console.warn('No se pudo guardar el log de autenticación:', error);
    }
  }

  getLogs(): AuthEvent[] {
    try {
      const logsStr = localStorage.getItem(this.STORAGE_KEY);
      return logsStr ? JSON.parse(logsStr) : [];
    } catch {
      return [];
    }
  }

  getRecentFailedLogins(minutes: number = 30): AuthEvent[] {
    const cutoff = Date.now() - minutes * 60 * 1000;
    return this.getLogs().filter(
      log => log.type === 'failed_login' && log.timestamp > cutoff,
    );
  }

  clearLogs(): void {
    localStorage.removeItem(this.STORAGE_KEY);
  }

  exportLogs(): string {
    const logs = this.getLogs();
    return JSON.stringify(logs, null, 2);
  }
}

const authLogger = new AuthLogger();
export default authLogger;
```

### 2. Hook de Métricas de Sesión

```typescript
// hooks/useSessionMetrics.ts
import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface SessionMetrics {
  sessionDuration: number; // en minutos
  loginCount: number;
  lastLoginTime: number;
  averageSessionDuration: number;
}

export const useSessionMetrics = () => {
  const { isAuthenticated } = useAuth();
  const [metrics, setMetrics] = useState<SessionMetrics>({
    sessionDuration: 0,
    loginCount: 0,
    lastLoginTime: 0,
    averageSessionDuration: 0,
  });

  useEffect(() => {
    if (!isAuthenticated) return;

    const sessionStart = Date.now();

    // Actualizar duración cada minuto
    const interval = setInterval(() => {
      const duration = Math.floor((Date.now() - sessionStart) / (60 * 1000));

      setMetrics(prev => ({
        ...prev,
        sessionDuration: duration,
      }));
    }, 60000);

    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const updateLoginMetrics = () => {
    const now = Date.now();
    const storedMetrics = localStorage.getItem('session_metrics');

    if (storedMetrics) {
      const parsed = JSON.parse(storedMetrics);
      const newMetrics = {
        loginCount: parsed.loginCount + 1,
        lastLoginTime: now,
        averageSessionDuration: parsed.averageSessionDuration, // Calcular promedio
        sessionDuration: 0,
      };

      localStorage.setItem('session_metrics', JSON.stringify(newMetrics));
      setMetrics(newMetrics);
    } else {
      const initialMetrics = {
        loginCount: 1,
        lastLoginTime: now,
        averageSessionDuration: 0,
        sessionDuration: 0,
      };

      localStorage.setItem('session_metrics', JSON.stringify(initialMetrics));
      setMetrics(initialMetrics);
    }
  };

  return { metrics, updateLoginMetrics };
};
```

---

## 🎨 Estilos CSS Recomendados

```css
/* styles/auth-components.css */

/* Modal de re-autenticación */
.reauth-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  backdrop-filter: blur(4px);
}

.reauth-modal {
  background: white;
  border-radius: 12px;
  padding: 0;
  max-width: 400px;
  width: 90%;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
  animation: modalSlideIn 0.3s ease;
}

@keyframes modalSlideIn {
  from {
    transform: translateY(-50px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.modal-header {
  padding: 20px 24px 16px;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h3 {
  margin: 0;
  color: #1f2937;
  font-size: 18px;
  font-weight: 600;
}

.close-button {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #6b7280;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  transition: all 0.2s;
}

.close-button:hover {
  background: #f3f4f6;
  color: #374151;
}

/* Estado de conexión */
.connection-status {
  position: fixed;
  top: 16px;
  right: 16px;
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  z-index: 9999;
  display: flex;
  align-items: center;
  gap: 8px;
  animation: slideInFromTop 0.3s ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.connection-status.offline {
  background: #fef2f2;
  color: #dc2626;
  border: 1px solid #fecaca;
}

.connection-status.online {
  background: #f0fdf4;
  color: #16a34a;
  border: 1px solid #bbf7d0;
}

@keyframes slideInFromTop {
  from {
    transform: translateY(-100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

/* Advertencias de sesión */
.session-expiry-warning {
  position: fixed;
  top: 70px;
  right: 16px;
  background: #fef3c7;
  border: 1px solid #f59e0b;
  border-radius: 8px;
  padding: 16px;
  max-width: 320px;
  z-index: 9998;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  animation: slideInFromRight 0.3s ease;
}

.session-expiry-warning h4 {
  margin: 0 0 8px 0;
  color: #92400e;
  font-size: 16px;
}

.session-expiry-warning p {
  margin: 0 0 16px 0;
  color: #92400e;
  font-size: 14px;
  line-height: 1.4;
}

.warning-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

@keyframes slideInFromRight {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

/* Botones inteligentes */
.smart-button {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  text-decoration: none;
  position: relative;
  overflow: hidden;
}

.smart-button:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.btn-primary {
  background: #3b82f6;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #2563eb;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
}

.btn-secondary {
  background: #6b7280;
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background: #4b5563;
}

.btn-loading {
  background: #9ca3af !important;
  color: white !important;
}

.btn-success {
  background: #10b981 !important;
  color: white !important;
}

.btn-error {
  background: #ef4444 !important;
  color: white !important;
}

.btn-icon {
  font-size: 16px;
}

/* Formulario de login mejorado */
.login-form-container {
  display: flex;
  min-height: 100vh;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.login-form {
  background: white;
  padding: 40px;
  border-radius: 16px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 400px;
}

.login-form h2 {
  text-align: center;
  margin-bottom: 32px;
  color: #1f2937;
  font-size: 28px;
  font-weight: 700;
}

.form-group {
  margin-bottom: 24px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  color: #374151;
  font-weight: 500;
  font-size: 14px;
}

.form-group input {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 16px;
  transition: all 0.2s;
  box-sizing: border-box;
}

.form-group input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.password-input {
  position: relative;
}

.password-toggle {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  font-size: 18px;
  padding: 4px;
}

.checkbox-group {
  display: flex;
  align-items: center;
  margin-bottom: 32px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  cursor: pointer;
  font-size: 14px;
  color: #4b5563;
}

.checkbox-label input[type='checkbox'] {
  margin-right: 8px;
  width: auto;
}

.submit-button {
  width: 100%;
  padding: 14px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.submit-button:hover:not(:disabled) {
  background: #2563eb;
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(59, 130, 246, 0.4);
}

.submit-button:disabled {
  background: #9ca3af;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top: 2px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.error-message {
  background: #fef2f2;
  color: #dc2626;
  padding: 12px 16px;
  border-radius: 8px;
  border: 1px solid #fecaca;
  margin-bottom: 24px;
  font-size: 14px;
  text-align: center;
}

.form-footer {
  text-align: center;
  margin-top: 24px;
}

.form-footer p {
  color: #6b7280;
  font-size: 14px;
  margin: 0;
}

.form-footer a {
  color: #3b82f6;
  text-decoration: none;
  font-weight: 500;
}

.form-footer a:hover {
  text-decoration: underline;
}

/* Responsive */
@media (max-width: 768px) {
  .login-form {
    padding: 24px;
    margin: 16px;
  }

  .reauth-modal {
    margin: 16px;
  }

  .session-expiry-warning,
  .connection-status {
    right: 16px;
    left: 16px;
    max-width: none;
  }
}
```

---

## 📋 Checklist de Implementación Completo

### ✅ Configuración Base

- [ ] Cliente HTTP configurado con interceptores
- [ ] Manejo de errores implementado
- [ ] Variables de entorno configuradas
- [ ] Tipos TypeScript definidos

### ✅ Autenticación Básica

- [ ] Context de autenticación implementado
- [ ] Servicios de login/logout creados
- [ ] Manejo de tokens JWT configurado
- [ ] Rutas protegidas implementadas

### ✅ Mejoras de Sesión

- [ ] Sistema "Recordarme" implementado
- [ ] Detector de múltiples pestañas
- [ ] Alertas de expiración de sesión
- [ ] Re-autenticación modal

### ✅ Seguridad Avanzada

- [ ] Detector de inactividad
- [ ] Validación de integridad de tokens
- [ ] Sistema de logs de autenticación
- [ ] CSP configurado

### ✅ Experiencia de Usuario

- [ ] Loading states inteligentes
- [ ] Notificaciones toast
- [ ] Estado de conexión
- [ ] Feedback visual mejorado

### ✅ Monitoreo

- [ ] Métricas de sesión
- [ ] Sistema de logs
- [ ] Alertas de seguridad
- [ ] Analytics de autenticación

---

## 🔧 Configuración de Producción

```typescript
// config/production.ts
export const productionConfig = {
  api: {
    baseURL: 'https://api-cuentas-zlut.onrender.com/api',
    timeout: 10000,
    retries: 3,
  },
  auth: {
    tokenKey: 'ingeocimyc_token',
    sessionWarningTime: 30, // minutos
    inactivityTimeout: 20, // minutos
    enableMultiTabDetection: true,
    enableInactivityDetection: true,
  },
  security: {
    enableCSP: true,
    enableLogging: true,
    maxFailedAttempts: 5,
    lockoutDuration: 15, // minutos
  },
  ui: {
    theme: 'default',
    animations: true,
    notifications: true,
  },
};
```

---

## 🎯 Roadmap de Mejoras Futuras

### Fase 1 (Inmediata)

1. **Implementar sistema "Recordarme"**
2. **Agregar alertas de expiración**
3. **Mejorar feedback visual del login**
4. **Implementar re-autenticación modal**

### Fase 2 (Corto plazo)

1. **Sistema de notificaciones toast**
2. **Detector de inactividad**
3. **Manejo de múltiples pestañas**
4. **Métricas de sesión**

### Fase 3 (Mediano plazo)

1. **SSO (Single Sign-On)**
2. **Autenticación 2FA**
3. **Refresh tokens automáticos**
4. **Dashboard de seguridad**

### Fase 4 (Largo plazo)

1. **Autenticación biométrica**
2. **OAuth2 con Google/Microsoft**
3. **Análisis de comportamiento**
4. **Compliance avanzado**

---

**¿Necesitas ayuda?** Revisa este README o consulta la documentación de la API en `/api-docs`.
