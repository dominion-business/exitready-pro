import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import LoginForm from './components/LoginForm';
import ProtectedRoute from './components/ProtectedRoute';
import Dashboard from './pages/Dashboard';
import BusinessProfile from './pages/BusinessProfile';
import ValuationCalculator from './pages/ValuationCalculator';
import ValuationDashboard from './pages/ValuationDashboard';
import Layout from './components/Layout';
import GapAnalysis from './pages/GapAnalysis';

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
                  <Dashboard />
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
          
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
