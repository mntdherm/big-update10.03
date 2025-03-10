import React, { useEffect } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import VendorProfile from './pages/VendorProfile';
import VendorDashboard from './pages/VendorDashboard';
import VendorCalendar from './pages/VendorCalendar';
import VendorOffers from './pages/VendorOffers';
import VendorSettings from './pages/VendorSettings';
import CustomerDashboard from './pages/CustomerDashboard';
import SearchResults from './pages/SearchResults';
import AdminDashboard from './pages/AdminDashboard';
import NotFound from './pages/NotFound';
import EmailVerified from './pages/EmailVerified';
import { routes } from './routes';
import ProtectedRoute from './components/ProtectedRoute';
import CustomerLayout from './pages/customer/Layout';
import CustomerProfile from './pages/customer/Profile';
import CustomerAppointments from './pages/customer/Appointments';
import CustomerCoins from './pages/customer/Coins';
import ActionHandler from './pages/auth/ActionHandler';
import Navbar from './components/Navbar';
import { AuthProvider } from './contexts/AuthContext';
import { SupportProvider } from './contexts/SupportContext';
import { trackPageView } from './lib/analytics';
import AnalyticsTracker from './components/AnalyticsTracker';
import ErrorBoundary from './components/ErrorBoundary';

function App() {
  // Set up logging for uncaught errors
  useEffect(() => {
    const handleGlobalError = (event: ErrorEvent) => {
      // Error is already reported by ErrorBoundary for React components
      // This catches non-React errors
      console.error('Global error:', event.error);
      // Prevent default browser error handling
      event.preventDefault();
    };

    window.addEventListener('error', handleGlobalError);
    return () => window.removeEventListener('error', handleGlobalError);
  }, []);

  return (
    <ErrorBoundary componentName="App">
      <AuthProvider>
        <SupportProvider>
          <AnalyticsTracker>
            <Routes>
              <Route path={routes.HOME} element={
                <ErrorBoundary componentName="HomePage">
                  <>
                    <Navbar />
                    <Home />
                  </>
                </ErrorBoundary>
              } />
              <Route path={routes.LOGIN} element={
                <ErrorBoundary componentName="LoginPage">
                  <>
                    <Navbar />
                    <Login />
                  </>
                </ErrorBoundary>
              } />
              <Route path={routes.REGISTER} element={
                <ErrorBoundary componentName="RegisterPage">
                  <>
                    <Navbar />
                    <Register />
                  </>
                </ErrorBoundary>
              } />
              <Route path={routes.EMAIL_VERIFIED} element={
                <ErrorBoundary componentName="EmailVerifiedPage">
                  <>
                    <Navbar />
                    <EmailVerified />
                  </>
                </ErrorBoundary>
              } />
              <Route path={routes.VENDOR_PROFILE} element={
                <ErrorBoundary componentName="VendorProfilePage">
                  <>
                    <Navbar />
                    <VendorProfile />
                  </>
                </ErrorBoundary>
              } />
              <Route path={routes.VENDOR_DASHBOARD} element={
                <ErrorBoundary componentName="VendorDashboardPage">
                  <ProtectedRoute role="vendor">
                    <Navbar />
                    <VendorDashboard />
                  </ProtectedRoute>
                </ErrorBoundary>
              } />
              <Route path={routes.VENDOR_CALENDAR} element={
                <ErrorBoundary componentName="VendorCalendarPage">
                  <ProtectedRoute role="vendor">
                    <Navbar />
                    <VendorCalendar />
                  </ProtectedRoute>
                </ErrorBoundary>
              } />
              <Route path={routes.VENDOR_OFFERS} element={
                <ErrorBoundary componentName="VendorOffersPage">
                  <ProtectedRoute role="vendor">
                    <Navbar />
                    <VendorOffers />
                  </ProtectedRoute>
                </ErrorBoundary>
              } />
              <Route path={routes.VENDOR_SETTINGS} element={
                <ErrorBoundary componentName="VendorSettingsPage">
                  <ProtectedRoute role="vendor">
                    <Navbar />
                    <VendorSettings />
                  </ProtectedRoute>
                </ErrorBoundary>
              } />
              <Route path={routes.CUSTOMER_DASHBOARD} element={
                <ErrorBoundary componentName="CustomerDashboardPage">
                  <ProtectedRoute role="customer">
                    <Navbar />
                    <CustomerDashboard />
                  </ProtectedRoute>
                </ErrorBoundary>
              } />
              <Route path={routes.CUSTOMER_BASE} element={
                                <ErrorBoundary componentName="CustomerLayoutPage">
                  <ProtectedRoute role="customer">
                    <Navbar />
                    <CustomerLayout />
                  </ProtectedRoute>
                </ErrorBoundary>
              }>
                <Route path={routes.CUSTOMER_PROFILE} element={
                  <ErrorBoundary componentName="CustomerProfilePage">
                    <CustomerProfile />
                  </ErrorBoundary>
                } />
                <Route path={routes.CUSTOMER_APPOINTMENTS} element={
                  <ErrorBoundary componentName="CustomerAppointmentsPage">
                    <CustomerAppointments />
                  </ErrorBoundary>
                } />
                <Route path={routes.CUSTOMER_COINS} element={
                  <ErrorBoundary componentName="CustomerCoinsPage">
                    <CustomerCoins />
                  </ErrorBoundary>
                } />
              </Route>
              <Route path={routes.SEARCH_RESULTS} element={
                <ErrorBoundary componentName="SearchResultsPage">
                  <>
                    <Navbar />
                    <SearchResults />
                  </>
                </ErrorBoundary>
              } />
              <Route path={routes.ADMIN_DASHBOARD} element={
                <ErrorBoundary componentName="AdminDashboardPage">
                  <ProtectedRoute role="admin">
                    <Navbar />
                    <AdminDashboard />
                  </ProtectedRoute>
                </ErrorBoundary>
              } />
              <Route path={routes.AUTH_ACTION} element={
                <ErrorBoundary componentName="ActionHandlerPage">
                  <ActionHandler />
                </ErrorBoundary>
              } />
              <Route path="*" element={
                <ErrorBoundary componentName="NotFoundPage">
                  <>
                    <Navbar />
                    <NotFound />
                  </>
                </ErrorBoundary>
              } />
            </Routes>
          </AnalyticsTracker>
        </SupportProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
