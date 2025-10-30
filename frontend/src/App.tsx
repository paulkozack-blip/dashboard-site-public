// App.tsx - ИСПРАВЛЕННАЯ ВЕРСИЯ
import React, { useState, useEffect, useCallback } from 'react';
import {
  HashRouter as Router,
  Routes,
  Route,
  Navigate,
  useNavigate,
} from 'react-router-dom';
import { apiService } from './services/api';
import { User } from './types';



import Dashboard from './components/Dashboard';
import Login from './pages/Login';
import Admin from './components/admin/Admin';

import './App.css';

interface AppState {
  currentUser: User | null;
  loading: boolean;
  error: string | null;
  authChecked: boolean;
}

interface PrivateRouteProps {
  children: React.ReactNode;
  currentUser: User | null;
  authChecked: boolean;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({
  children,
  currentUser,
  authChecked,
}) => {
  if (!authChecked) {
    return (
      <div className="app-loading">
        <div className="loading-spinner"></div>
        <p>Проверка авторизации...</p>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

interface PublicRouteProps {
  children: React.ReactNode;
  currentUser: User | null;
  authChecked: boolean;
}

const PublicRoute: React.FC<PublicRouteProps> = ({
  children,
  currentUser,
  authChecked,
}) => {
  if (!authChecked) {
    return (
      <div className="app-loading">
        <div className="loading-spinner"></div>
        <p>Проверка авторизации...</p>
      </div>
    );
  }

  if (currentUser) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

// Компонент для использования useNavigate внутри
const AppRoutes: React.FC<{ appState: AppState; onLogout: () => void }> = ({
  appState,
  onLogout,
}) => {
  const navigate = useNavigate();

  const handleNavigateToAdmin = useCallback(() => {
    navigate('/admin');
  }, [navigate]);

  const handleNavigateToDashboard = useCallback(() => {
    navigate('/dashboard');
  }, [navigate]);

  return (
    <Routes>
      <Route
        path="/login"
        element={
          <PublicRoute
            currentUser={appState.currentUser}
            authChecked={appState.authChecked}
          >
            <Login />
          </PublicRoute>
        }
      />

      <Route
        path="/admin"
        element={
          <PrivateRoute
            currentUser={appState.currentUser}
            authChecked={appState.authChecked}
          >
            <Admin
              currentUser={appState.currentUser}
              onLogout={onLogout}
              onNavigateToDashboard={handleNavigateToDashboard}
            />
          </PrivateRoute>
        }
      />

      <Route
        path="/dashboard"
        element={
          <PrivateRoute
            currentUser={appState.currentUser}
            authChecked={appState.authChecked}
          >
            <Dashboard
              currentUser={appState.currentUser}
              onLogout={onLogout}
              onNavigateToAdmin={handleNavigateToAdmin}
            />
          </PrivateRoute>
        }
      />

      <Route
        path="/"
        element={
          appState.authChecked ? (
            appState.currentUser ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Navigate to="/login" replace />
            )
          ) : (
            <div className="app-loading">
              <div className="loading-spinner"></div>
              <p>Загрузка приложения...</p>
            </div>
          )
        }
      />

      <Route
        path="*"
        element={
          <div className="app-404">
            <h1>404</h1>
            <p>Страница не найдена</p>
            <button onClick={() => navigate('/')}>На главную</button>
          </div>
        }
      />
    </Routes>
  );
};

const App: React.FC = () => {
  console.log(`🚀 [App] Инициализация приложения`);

  const [appState, setAppState] = useState<AppState>({
    currentUser: null,
    loading: false,
    error: null,
    authChecked: false,
  });

  /**
   * Проверяет текущую авторизацию пользователя - ВЫЗЫВАЕМ ТОЛЬКО ОДИН РАЗ
   */
  const checkAuth = useCallback(async (): Promise<void> => {
    console.log(`🔐 [App] Проверка авторизации`);

    try {
      const token = localStorage.getItem('authToken');

      if (!token) {
        console.log(`ℹ️ [App] Токен не найден`);
        setAppState((prev) => ({ ...prev, authChecked: true }));
        return;
      }

      const user = await apiService.getMe();
      console.log(`✅ [App] Пользователь авторизован:`, user.username);

      setAppState((prev) => ({
        ...prev,
        currentUser: user,
        authChecked: true,
        error: null,
      }));
    } catch (error) {
      console.warn(`⚠️ [App] Ошибка проверки авторизации:`, error);
      localStorage.removeItem('authToken');

      setAppState((prev) => ({
        ...prev,
        currentUser: null,
        authChecked: true,
        error: null,
      }));
    }
  }, []);

  const handleLogout = useCallback((): void => {
    console.log(`🚪 [App] Выход из системы`);
    localStorage.removeItem('authToken');

    setAppState((prev) => ({
      ...prev,
      currentUser: null,
      error: null,
    }));
  }, []);

  // ЕДИНСТВЕННЫЙ useEffect - вызывается только при монтировании
  useEffect(() => {
    console.log(`🔄 [App] Инициализация - проверяем авторизацию один раз`);
    checkAuth();
  }, [checkAuth]);

  console.log(`🎯 [App] Состояние рендера:`, {
    authChecked: appState.authChecked,
    isLoggedIn: !!appState.currentUser,
    username: appState.currentUser?.username || 'Не авторизован',
  });

  return (
    <div className="app">
      <Router>
        <div className="app-container">
          <main className="app-main">
            <AppRoutes appState={appState} onLogout={handleLogout} />
          </main>

          {appState.error && (
            <div className="app-error-toast">
              <div className="error-content">
                <span className="error-icon">⚠️</span>
                <span className="error-message">{appState.error}</span>
                <button
                  onClick={() =>
                    setAppState((prev) => ({ ...prev, error: null }))
                  }
                  className="error-close"
                >
                  ✕
                </button>
              </div>
            </div>
          )}
        </div>
      </Router>
    </div>
  );
};

export default App;
