import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './hooks/useAuth';
import { Login, Dashboard, Inventory, ConcentrateurDetail, MapView, Actions } from './pages';
import { Scan, NewAction, MyActions, MobileProfil } from './pages/mobile';
import { StockMagasin, ReceptionCartons, TransfertBO } from './pages/magasin';
import { StockBO, PoseConcentrateur, DeposeConcentrateur } from './pages/bo';
import { FileAttente, TestConcentrateur } from './pages/labo';
import { Loading, ConnectionStatus, InstallPrompt } from './components/common';
import { ReactNode } from 'react';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: string[];
}

function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return <Loading fullScreen text="Chargement..." />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Vérifier le rôle si des rôles autorisés sont spécifiés
  if (allowedRoles && allowedRoles.length > 0) {
    const hasAccess = allowedRoles.includes(user.role) || user.role === 'admin';
    if (!hasAccess) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return <>{children}</>;
}

function PublicRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return <Loading fullScreen text="Chargement..." />;
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/inventaire"
        element={
          <ProtectedRoute>
            <Inventory />
          </ProtectedRoute>
        }
      />
      <Route
        path="/concentrateurs/:numeroSerie"
        element={
          <ProtectedRoute>
            <ConcentrateurDetail />
          </ProtectedRoute>
        }
      />
      <Route
        path="/map"
        element={
          <ProtectedRoute>
            <MapView />
          </ProtectedRoute>
        }
      />
      <Route
        path="/actions"
        element={
          <ProtectedRoute>
            <Actions />
          </ProtectedRoute>
        }
      />
      {/* Mobile Routes */}
      <Route
        path="/mobile/scan"
        element={
          <ProtectedRoute>
            <Scan />
          </ProtectedRoute>
        }
      />
      <Route
        path="/mobile/action/new"
        element={
          <ProtectedRoute>
            <NewAction />
          </ProtectedRoute>
        }
      />
      <Route
        path="/mobile/actions"
        element={
          <ProtectedRoute>
            <MyActions />
          </ProtectedRoute>
        }
      />
      <Route
        path="/mobile/profil"
        element={
          <ProtectedRoute>
            <MobileProfil />
          </ProtectedRoute>
        }
      />
      {/* Magasin Routes - admin et magasin uniquement */}
      <Route
        path="/magasin/stock"
        element={
          <ProtectedRoute allowedRoles={['magasin']}>
            <StockMagasin />
          </ProtectedRoute>
        }
      />
      <Route
        path="/magasin/reception"
        element={
          <ProtectedRoute allowedRoles={['magasin']}>
            <ReceptionCartons />
          </ProtectedRoute>
        }
      />
      <Route
        path="/magasin/transfert"
        element={
          <ProtectedRoute allowedRoles={['magasin']}>
            <TransfertBO />
          </ProtectedRoute>
        }
      />
      {/* BO Routes - admin, bo et agent_terrain */}
      <Route
        path="/bo/stock"
        element={
          <ProtectedRoute allowedRoles={['bo', 'agent_terrain']}>
            <StockBO />
          </ProtectedRoute>
        }
      />
      <Route
        path="/bo/pose"
        element={
          <ProtectedRoute allowedRoles={['bo', 'agent_terrain']}>
            <PoseConcentrateur />
          </ProtectedRoute>
        }
      />
      <Route
        path="/bo/depose"
        element={
          <ProtectedRoute allowedRoles={['bo', 'agent_terrain']}>
            <DeposeConcentrateur />
          </ProtectedRoute>
        }
      />
      {/* Labo Routes - admin et labo uniquement */}
      <Route
        path="/labo/file-attente"
        element={
          <ProtectedRoute allowedRoles={['labo']}>
            <FileAttente />
          </ProtectedRoute>
        }
      />
      <Route
        path="/labo/test"
        element={
          <ProtectedRoute allowedRoles={['labo']}>
            <TestConcentrateur />
          </ProtectedRoute>
        }
      />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ConnectionStatus />
        <AppRoutes />
        <InstallPrompt />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
