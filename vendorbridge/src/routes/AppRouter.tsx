import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout, AuthLayout } from '../layouts/AppLayout';

// Pages
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import ForgotPasswordPage from '../pages/ForgotPasswordPage';
import DashboardPage from '../pages/DashboardPage';
import VendorsPage from '../pages/VendorsPage';
import RFQsPage from '../pages/RFQsPage';
import CreateRFQPage from '../pages/CreateRFQPage';
import QuotationsPage from '../pages/QuotationsPage';
import QuotationComparisonPage from '../pages/QuotationComparisonPage';
import ApprovalsPage from '../pages/ApprovalsPage';
import PurchaseOrdersPage from '../pages/PurchaseOrdersPage';
import InvoicesPage from '../pages/InvoicesPage';
import ActivityLogsPage from '../pages/ActivityLogsPage';
import ReportsPage from '../pages/ReportsPage';
import ProfilePage from '../pages/ProfilePage';
import SettingsPage from '../pages/SettingsPage';

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Auth routes */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        </Route>

        {/* Protected app routes */}
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/vendors" element={<VendorsPage />} />
          <Route path="/rfqs" element={<RFQsPage />} />
          <Route path="/rfqs/create" element={<CreateRFQPage />} />
          <Route path="/quotations" element={<QuotationsPage />} />
          <Route path="/quotations/compare" element={<QuotationComparisonPage />} />
          <Route path="/approvals" element={<ApprovalsPage />} />
          <Route path="/purchase-orders" element={<PurchaseOrdersPage />} />
          <Route path="/invoices" element={<InvoicesPage />} />
          <Route path="/activity-logs" element={<ActivityLogsPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>

        {/* Redirect root */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
