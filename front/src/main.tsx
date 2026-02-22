import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store';
import App from './App.tsx';
import Login from './components/login.tsx';
import './index.css';

// Auth status helper.
const isAuthenticated = () => {
  return localStorage.getItem('isAuthenticated') === 'true';
};

// Auth layout: performs a global auth check on navigation.
const AuthLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect unauthenticated users to /login (preserve destination).
    if (!isAuthenticated() && !location.pathname.includes('/login')) {
      navigate('/login', {
        replace: true,
        state: { from: location.pathname }, // Store the original target path for post-login redirect.
      });
    }
  }, [location, navigate]);

  return <Outlet />;
};

// Protected route wrapper.
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();

  if (!isAuthenticated()) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
};

// Public route wrapper: authenticated users are redirected to /app.
const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  if (isAuthenticated()) {
    return <Navigate to="/app" replace />;
  }

  return <>{children}</>;
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <Routes>
          <Route element={<AuthLayout />}>
            <Route path="/" element={<Navigate to="/login" replace />} />

            <Route
              path="/app"
              element={
                <ProtectedRoute>
                  <App />
                </ProtectedRoute>
              }
            />

            <Route
              path="/login"
              element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              }
            />

            <Route path="*" element={<Navigate to="/login" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </Provider>
  </React.StrictMode>
);
