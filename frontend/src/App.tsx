/**
 * Main application component with routing configuration
 * Defines all application routes for authentication and role-based pages
 */

import { Routes, Route, useLocation } from "react-router-dom";
// @ts-ignore
import RegisterPage from "./pages/auth/RegisterPage";
import RoleSelection from "./pages/auth/RoleSelection";
import SuperAdminLogin from "./pages/auth/SuperAdminLogin";
import RequestInstitutionAccess from "./pages/public/RequestInstitutionAccess";
import VerifyInstitution from "./pages/public/VerifyInstitution";
import HowItWorks from "./pages/public/HowItWorks";
import AdminPage from "./pages/admin/AdminPage";
import StudentPage from "./pages/student/StudentPage";
import OfficerPage from "./pages/officer/OfficerPage";
import DeanPage from "./pages/dean/DeanPage";
import RoleLayout from "./components/layout/RoleLayout";
import SuperAdminPage from "./pages/superadmin/SuperAdminPage";
import HomePage from "./pages/public/HomePage";
import LandingPage from "./pages/public/LandingPage";
import ArchivedOrganizationsPage from "./pages/public/ArchivedOrganizationsPage";
import StreamPage from "./pages/stream/StreamPage";
import RequirementDetailsPage from "./pages/stream/RequirementDetailsPage";
import TodoPage from "./pages/todo/TodoPage";
import ToReviewPage from "./pages/officer/ToReviewPage";
import InstitutionUsersPage from "./pages/superadmin/InstitutionUsersPage";
import FAQPage from "./pages/FAQPage";
import Header from "./components/layout/Header";
import GlobalAnnouncements from "./components/GlobalAnnouncements";
import Box from "@mui/material/Box";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import PublicRoute from "./components/auth/PublicRoute";

import { LoadingProvider } from "./contexts/LoadingContext";
import { GlobalLoader } from "./components/layout/GlobalLoader";

export default function App() {
  const location = useLocation();

  // Hide header for authenticated role-based pages, home page, and landings
  const showHeader = !(
    location.pathname === "/" ||
    location.pathname.startsWith("/student") ||
    location.pathname.startsWith("/admin") ||
    location.pathname.startsWith("/officer") ||
    location.pathname.startsWith("/dean") ||
    location.pathname.startsWith("/super-admin") ||
    location.pathname.startsWith("/organization") ||
    location.pathname === "/home" ||
    location.pathname === "/archived-organizations" ||
    location.pathname === "/faqs" ||
    location.pathname === "/role-selection" ||
    location.pathname === "/super-admin/login"
  );

  return (
    <LoadingProvider>
      <GlobalLoader />
      {showHeader && <Header />}
      <Box sx={{ pt: showHeader ? 7 : 0 }}>
        {showHeader && <GlobalAnnouncements />}
        <Routes>

          {/* Public authentication routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
          <Route path="/login" element={<PublicRoute><RegisterPage /></PublicRoute>} />
          <Route path="/role-selection" element={<PublicRoute><RoleSelection /></PublicRoute>} />
          <Route path="/super-admin/login" element={<PublicRoute><SuperAdminLogin /></PublicRoute>} />

          {/* Public institution request routes */}
          <Route path="/request-institution-access" element={<RequestInstitutionAccess />} />
          <Route path="/verify-institution/:token" element={<VerifyInstitution />} />
          <Route path="/how-it-works" element={<HowItWorks />} />

          {/* Admin routes - persistent layout */}
          <Route element={<ProtectedRoute allowedRoles={['admin']}><RoleLayout /></ProtectedRoute>}>
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/admin/dashboard" element={<AdminPage />} />
            <Route path="/admin/settings" element={<AdminPage />} />
            <Route path="/admin/users" element={<AdminPage />} />
            <Route path="/admin/organizations" element={<AdminPage />} />
            <Route path="/admin/terms" element={<AdminPage />} />
            <Route path="/admin/quotes" element={<AdminPage />} />
            <Route path="/admin/records" element={<AdminPage />} />
          </Route>

          {/* Student routes - persistent layout */}
          <Route element={<ProtectedRoute allowedRoles={['student', 'officer']}><RoleLayout /></ProtectedRoute>}>
            <Route path="/student" element={<StudentPage />} />
            <Route path="/student/dashboard" element={<StudentPage />} />
            <Route path="/student/leaderboard" element={<StudentPage />} />
            <Route path="/student/settings" element={<StudentPage />} />
            <Route path="/student/slip" element={<StudentPage />} />
            <Route path="/student/todo" element={<StudentPage />} />
            <Route path="/student/requirements" element={<StudentPage />} />
            <Route path="/student/progress" element={<StudentPage />} />
            <Route path="/student/certificate" element={<StudentPage />} />
            <Route path="/officer/to-review" element={<ToReviewPage />} />
          </Route>

          {/* Officer/Signatory routes */}
          <Route element={<ProtectedRoute allowedRoles={['officer']}><RoleLayout /></ProtectedRoute>}>
            <Route path="/officer" element={<OfficerPage />} />
            <Route path="/officer/todo" element={<OfficerPage />} />
            <Route path="/officer/pending" element={<OfficerPage />} />
            <Route path="/officer/review" element={<OfficerPage />} />
            <Route path="/officer/remarks" element={<OfficerPage />} />
            <Route path="/officer/settings" element={<OfficerPage />} />
          </Route>

          {/* Dean routes - persistent layout */}
          <Route element={<ProtectedRoute allowedRoles={['dean']}><RoleLayout /></ProtectedRoute>}>
            <Route path="/dean/*" element={<DeanPage />} />
          </Route>

          {/* Super Admin routes - persistent layout */}
          <Route element={<ProtectedRoute allowedRoles={['super_admin']}><RoleLayout /></ProtectedRoute>}>
            <Route path="/super-admin" element={<SuperAdminPage />} />
            <Route path="/super-admin/dashboard" element={<SuperAdminPage />} />
            <Route path="/super-admin/settings" element={<SuperAdminPage />} />
            <Route path="/super-admin/institution-requests" element={<SuperAdminPage />} />
            <Route path="/super-admin/institution-monitoring" element={<SuperAdminPage />} />
            <Route path="/super-admin/institution-monitoring/:institutionId" element={<InstitutionUsersPage />} />
            <Route path="/super-admin/system-analytics" element={<SuperAdminPage />} />
            <Route path="/super-admin/announcements" element={<SuperAdminPage />} />
          </Route>
          <Route element={<ProtectedRoute><RoleLayout /></ProtectedRoute>}>
            <Route path="/home" element={<HomePage />} />
            <Route path="/archived-organizations" element={<ArchivedOrganizationsPage />} />
            <Route path="/organization/:orgId" element={<StreamPage />} />
            <Route path="/organization/:orgId/requirement/:reqId" element={<RequirementDetailsPage />} />
            <Route path="/faqs" element={<FAQPage />} />
          </Route>
        </Routes>
      </Box>
    </LoadingProvider>
  );
}
