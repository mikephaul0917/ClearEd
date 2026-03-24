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
import SuperAdminPage from "./pages/superadmin/SuperAdminPage";
import HomePage from "./pages/public/HomePage";
import ArchivedOrganizationsPage from "./pages/public/ArchivedOrganizationsPage";
import StreamPage from "./pages/stream/StreamPage";
import RequirementDetailsPage from "./pages/stream/RequirementDetailsPage";
import TodoPage from "./pages/todo/TodoPage";
import ToReviewPage from "./pages/officer/ToReviewPage";
import InstitutionUsersPage from "./pages/superadmin/InstitutionUsersPage";
import Header from "./components/layout/Header";
import GlobalAnnouncements from "./components/GlobalAnnouncements";
import Box from "@mui/material/Box";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import PublicRoute from "./components/auth/PublicRoute";

import { LoadingProvider } from "./contexts/LoadingContext";
import { GlobalLoader } from "./components/layout/GlobalLoader";

export default function App() {
  const location = useLocation();

  // Hide header for authenticated role-based pages and home page (they have their own navigation)
  const showHeader = !(location.pathname.startsWith("/student") ||
    location.pathname.startsWith("/admin") ||
    location.pathname.startsWith("/officer") ||
    location.pathname.startsWith("/dean") ||
    location.pathname.startsWith("/super-admin") ||
    location.pathname.startsWith("/organization") ||
    location.pathname === "/home" ||
    location.pathname === "/archived-organizations" ||
    location.pathname === "/role-selection" ||
    location.pathname === "/super-admin/login");

  return (
    <LoadingProvider>
      <GlobalLoader />
      {showHeader && <Header />}
      <Box sx={{ pt: showHeader ? 7 : 0 }}>
        {showHeader && <GlobalAnnouncements />}
        <Routes>

          {/* Public authentication routes */}
          <Route path="/" element={<PublicRoute><RegisterPage /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
          <Route path="/login" element={<PublicRoute><RegisterPage /></PublicRoute>} />
          <Route path="/role-selection" element={<PublicRoute><RoleSelection /></PublicRoute>} />
          <Route path="/super-admin/login" element={<PublicRoute><SuperAdminLogin /></PublicRoute>} />

          {/* Public institution request routes */}
          <Route path="/request-institution-access" element={<RequestInstitutionAccess />} />
          <Route path="/verify-institution/:token" element={<VerifyInstitution />} />
          <Route path="/how-it-works" element={<HowItWorks />} />

          {/* Admin routes - all handled by AdminPage component with internal routing */}
          <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><AdminPage /></ProtectedRoute>} />
          <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={['admin']}><AdminPage /></ProtectedRoute>} />
          <Route path="/admin/settings" element={<ProtectedRoute allowedRoles={['admin']}><AdminPage /></ProtectedRoute>} />
          <Route path="/admin/users" element={<ProtectedRoute allowedRoles={['admin']}><AdminPage /></ProtectedRoute>} />
          <Route path="/admin/organizations" element={<ProtectedRoute allowedRoles={['admin']}><AdminPage /></ProtectedRoute>} />

          <Route path="/admin/terms" element={<ProtectedRoute allowedRoles={['admin']}><AdminPage /></ProtectedRoute>} />
          <Route path="/admin/quotes" element={<ProtectedRoute allowedRoles={['admin']}><AdminPage /></ProtectedRoute>} />
          <Route path="/admin/records" element={<ProtectedRoute allowedRoles={['admin']}><AdminPage /></ProtectedRoute>} />

          {/* Student routes - all handled by StudentPage component with internal routing (now tracking Officers as well!) */}
          <Route path="/student" element={<ProtectedRoute allowedRoles={['student', 'officer']}><StudentPage /></ProtectedRoute>} />
          <Route path="/student/dashboard" element={<ProtectedRoute allowedRoles={['student', 'officer']}><StudentPage /></ProtectedRoute>} />
          <Route path="/student/leaderboard" element={<ProtectedRoute allowedRoles={['student', 'officer']}><StudentPage /></ProtectedRoute>} />
          <Route path="/student/settings" element={<ProtectedRoute allowedRoles={['student', 'officer']}><StudentPage /></ProtectedRoute>} />
          <Route path="/student/slip" element={<ProtectedRoute allowedRoles={['student', 'officer']}><StudentPage /></ProtectedRoute>} />
          <Route path="/student/todo" element={<ProtectedRoute allowedRoles={['student', 'officer']}><StudentPage /></ProtectedRoute>} />
          <Route path="/student/requirements" element={<ProtectedRoute allowedRoles={['student', 'officer']}><StudentPage /></ProtectedRoute>} />
          <Route path="/student/progress" element={<ProtectedRoute allowedRoles={['student', 'officer']}><StudentPage /></ProtectedRoute>} />
          <Route path="/student/certificate" element={<ProtectedRoute allowedRoles={['student', 'officer']}><StudentPage /></ProtectedRoute>} />

          {/* Officer/Signatory routes - all handled by OfficerPage component with internal routing */}
          <Route path="/officer" element={<ProtectedRoute allowedRoles={['officer']}><OfficerPage /></ProtectedRoute>} />
          <Route path="/officer/todo" element={<ProtectedRoute allowedRoles={['officer']}><OfficerPage /></ProtectedRoute>} />
          <Route path="/officer/pending" element={<ProtectedRoute allowedRoles={['officer']}><OfficerPage /></ProtectedRoute>} />
          <Route path="/officer/review" element={<ProtectedRoute allowedRoles={['officer']}><OfficerPage /></ProtectedRoute>} />
          <Route path="/officer/remarks" element={<ProtectedRoute allowedRoles={['officer']}><OfficerPage /></ProtectedRoute>} />
          <Route path="/officer/settings" element={<ProtectedRoute allowedRoles={['officer']}><OfficerPage /></ProtectedRoute>} />
          <Route path="/officer/to-review" element={<ProtectedRoute allowedRoles={['officer']}><ToReviewPage /></ProtectedRoute>} />

          {/* Dean routes - all handled by DeanPage component with internal routing */}
          <Route path="/dean" element={<ProtectedRoute allowedRoles={['dean']}><DeanPage /></ProtectedRoute>} />
          <Route path="/dean/approvals" element={<ProtectedRoute allowedRoles={['dean']}><DeanPage /></ProtectedRoute>} />
          <Route path="/dean/settings" element={<ProtectedRoute allowedRoles={['dean']}><DeanPage /></ProtectedRoute>} />

          {/* Super Admin routes - all handled by SuperAdminPage component with internal routing */}
          <Route path="/super-admin" element={<ProtectedRoute allowedRoles={['super_admin']}><SuperAdminPage /></ProtectedRoute>} />
          <Route path="/super-admin/dashboard" element={<ProtectedRoute allowedRoles={['super_admin']}><SuperAdminPage /></ProtectedRoute>} />
          <Route path="/super-admin/settings" element={<ProtectedRoute allowedRoles={['super_admin']}><SuperAdminPage /></ProtectedRoute>} />
          <Route path="/super-admin/institution-requests" element={<ProtectedRoute allowedRoles={['super_admin']}><SuperAdminPage /></ProtectedRoute>} />
          <Route path="/super-admin/institution-monitoring" element={<ProtectedRoute allowedRoles={['super_admin']}><SuperAdminPage /></ProtectedRoute>} />
          <Route path="/super-admin/institution-monitoring/:institutionId" element={<ProtectedRoute allowedRoles={['super_admin']}><InstitutionUsersPage /></ProtectedRoute>} />
          <Route path="/super-admin/system-analytics" element={<ProtectedRoute allowedRoles={['super_admin']}><SuperAdminPage /></ProtectedRoute>} />
          <Route path="/super-admin/announcements" element={<ProtectedRoute allowedRoles={['super_admin']}><SuperAdminPage /></ProtectedRoute>} />
          <Route path="/home" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
          <Route path="/archived-organizations" element={<ProtectedRoute><ArchivedOrganizationsPage /></ProtectedRoute>} />
          <Route path="/organization/:orgId" element={<ProtectedRoute><StreamPage /></ProtectedRoute>} />
          <Route path="/organization/:orgId/requirement/:reqId" element={<ProtectedRoute><RequirementDetailsPage /></ProtectedRoute>} />
        </Routes>
      </Box>
    </LoadingProvider>
  );
}
