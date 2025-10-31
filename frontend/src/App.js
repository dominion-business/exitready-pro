import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import LoginForm from './components/LoginForm';
import ProtectedRoute from './components/ProtectedRoute';
import EnhancedDashboard from './pages/EnhancedDashboard';
import BusinessProfile from './pages/BusinessProfile';
import ValuationCalculator from './pages/ValuationCalculator';
import ValuationDashboard from './pages/ValuationDashboard';
import Layout from './components/Layout';
import GapAnalysis from './pages/GapAnalysis';
import ExitStrategyQuiz from './pages/ExitStrategyQuiz';
import ExitStrategyResults from './pages/ExitStrategyResults';
import TaskManager from './pages/TaskManager';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginForm />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Layout>
                  <EnhancedDashboard />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/valuation-dashboard"
            element={
              <ProtectedRoute>
                <Layout>
                  <ValuationDashboard />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/business-profile"
            element={
              <ProtectedRoute>
                <Layout>
                  <BusinessProfile />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/valuation"
            element={
              <ProtectedRoute>
                <Layout>
                  <ValuationCalculator />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/gap-analysis"
            element={
              <ProtectedRoute>
                <Layout>
                  <GapAnalysis />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/exit-strategy-quiz"
            element={
              <ProtectedRoute>
                <Layout>
                  <ExitStrategyQuiz />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/exit-strategy-results"
            element={
              <ProtectedRoute>
                <Layout>
                  <ExitStrategyResults />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/task-manager"
            element={
              <ProtectedRoute>
                <Layout>
                  <TaskManager />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
