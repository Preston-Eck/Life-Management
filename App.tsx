import React, { Component, ReactNode, ErrorInfo, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AppProvider, useAppStore } from './store/AppContext';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { TaskList } from './components/TaskList';
import { TaskDetail } from './components/TaskDetail';
import { AssetList } from './components/AssetList';
import { AssetDetail } from './components/AssetDetail';
import { PeopleList } from './components/People';
import { ShoppingList } from './components/Shopping';
import { CommentsInbox } from './components/CommentsInbox';
import { GoogleIntegrationModal } from './components/GoogleIntegration';
import { AdminDashboard } from './components/AdminDashboard';
import { Login } from './components/Login';
import { Onboarding } from './components/Onboarding';

// Global Error Listener Component
const GlobalErrorListener = () => {
    const { logError } = useAppStore();

    useEffect(() => {
        const handleError = (event: ErrorEvent) => {
            logError(event.message, event.error?.stack);
        };

        const handleRejection = (event: PromiseRejectionEvent) => {
            logError(`Unhandled Promise Rejection: ${event.reason}`, event.reason?.stack);
        };

        window.addEventListener('error', handleError);
        window.addEventListener('unhandledrejection', handleRejection);

        return () => {
            window.removeEventListener('error', handleError);
            window.removeEventListener('unhandledrejection', handleRejection);
        };
    }, [logError]);

    return null;
};

// React Error Boundary
interface ErrorBoundaryProps {
    children: ReactNode;
    logError: (msg: string, stack?: string, comp?: string) => void;
}

interface ErrorBoundaryState {
    hasError: boolean;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    public state: ErrorBoundaryState = { hasError: false };

    static getDerivedStateFromError(_: any): ErrorBoundaryState {
        return { hasError: true };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        this.props.logError(error.message, error.stack, errorInfo.componentStack);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-slate-950 flex items-center justify-center p-8">
                    <div className="bg-slate-900 border border-red-900/50 p-6 rounded-xl max-w-lg text-center">
                        <h1 className="text-2xl font-bold text-red-500 mb-2">Something went wrong</h1>
                        <p className="text-slate-400 mb-4">Our engineers (and AI) have been notified.</p>
                        <button onClick={() => window.location.reload()} className="bg-indigo-600 px-4 py-2 rounded text-white font-bold hover:bg-indigo-700">Reload Application</button>
                    </div>
                </div>
            );
        }
        return this.props.children;
    }
}

// Wrapper to inject logger into Boundary
const AppWithErrorBoundary: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { logError } = useAppStore();
    return (
        <ErrorBoundary logError={logError}>
            <GlobalErrorListener />
            {children}
        </ErrorBoundary>
    );
}

const AuthGuard: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { isAuthenticated, currentUser } = useAppStore();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Login />;
  }

  // Redirect new users to onboarding if they haven't completed it
  if (!currentUser.hasCompletedOnboarding && location.pathname !== '/onboarding') {
      return <Navigate to="/onboarding" replace />;
  }
  
  // If user has completed onboarding but tries to access it again, redirect home
  if (currentUser.hasCompletedOnboarding && location.pathname === '/onboarding') {
      return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <AppProvider>
      <AppWithErrorBoundary>
        <Router>
          <AuthGuard>
            <Routes>
                {/* Onboarding Route - No Layout */}
                <Route path="/onboarding" element={<Onboarding />} />
                
                {/* Main App Routes - Wrapped in Layout */}
                <Route path="*" element={
                    <Layout>
                        <Routes>
                            <Route path="/" element={<Dashboard />} />
                            <Route path="/inbox" element={<CommentsInbox />} />
                            <Route path="/tasks" element={<TaskList />} />
                            <Route path="/tasks/:taskId" element={<TaskDetail />} />
                            <Route path="/assets" element={<AssetList />} />
                            <Route path="/assets/:assetId" element={<AssetDetail />} />
                            <Route path="/people" element={<PeopleList />} />
                            <Route path="/shopping" element={<ShoppingList />} />
                            <Route path="/admin" element={<AdminDashboard />} />
                            <Route path="/google-sync" element={
                                <div className="flex items-center justify-center h-full">
                                    <GoogleIntegrationModal onClose={() => window.history.back()} />
                                </div>
                            } />
                            <Route path="/library" element={
                            <div className="text-center mt-20 text-slate-500">
                                <h2 className="text-2xl font-bold mb-2">Library Module</h2>
                                <p>Personal development and reading goals tracking coming soon.</p>
                            </div>
                            } />
                        </Routes>
                    </Layout>
                } />
            </Routes>
          </AuthGuard>
        </Router>
      </AppWithErrorBoundary>
    </AppProvider>
  );
};

export default App;