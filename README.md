# MERN Finals 2025 — Project Documentation

## Overview
- Full-stack application using React + Vite (frontend) and Express + TypeScript (backend) with MongoDB.
- Supports user and admin flows, account settings UI, and an Admin Users Management dashboard.
- Authentication uses JWT. Access control uses `auth` and `admin` middleware.
- **Security**: Public registration cannot create admin accounts. Admin accounts can only be created by existing admins.

## Tech Stack
- Frontend: React 18, Vite 5, MUI v6, React Router 6, SweetAlert2
- Backend: Express 5, TypeScript, Mongoose 8, bcrypt, jsonwebtoken
- Database: MongoDB

## Setup
- Prerequisites:
  - Node.js 18+ and npm
  - MongoDB running locally or a connection string
- Environment:
  - Create `backend/.env` with:
    - `MONGODB_URI=mongodb://localhost:27017/mern-finals-2025`
    - `JWT_SECRET=your_secret_here`
- Install dependencies:
  - Backend: `cd backend && npm install`
  - Frontend: `cd frontend && npm install`

## Running
- Backend dev: `cd backend && npm run dev`
- Frontend dev: `cd frontend && npm run dev` (served at `http://localhost:5173` or nearby port)

## Project Structure
- Frontend key files:
  - Routing: `frontend/src/App.tsx` — routes for `/`, `/register`, `/admin`, `/admin/dashboard`, `/admin/settings`, `/admin/users`, `/user`, `/user/dashboard`, `/user/settings`.
  - Pages:
    - Login: `frontend/src/pages/LoginPage.tsx`
    - Register: `frontend/src/pages/RegisterPage.tsx`
    - Admin: `frontend/src/pages/AdminPage.tsx`
    - User: `frontend/src/pages/UserPage.tsx`
  - Components:
    - Header: `frontend/src/components/Header.tsx`
    - Admin Table: `frontend/src/components/AdminTable.tsx`
    - User Table (items): `frontend/src/components/UserTable.tsx`
    - Users Management: `frontend/src/components/UsersTable.tsx`
  - API helper: `frontend/src/api.ts`
- Backend key files:
  - Server: `backend/src/server.ts`
  - DB config: `backend/src/config/db.ts`
  - Models: `backend/src/models/User.ts`, `backend/src/models/Quote.ts`
  - Middleware: `backend/src/middleware/auth.ts`, `backend/src/middleware/roleMiddleware.ts`
  - Routes: `backend/src/routes/authRoutes.ts`, `backend/src/routes/adminRoutes.ts`, `backend/src/routes/quoteRoutes.ts`
  - Controllers: `backend/src/controllers/authController.ts`, `backend/src/controllers/admin/*`
  - Security: Admin user creation endpoints, enhanced role validation

## Authentication
- Login returns JWT and role flag with user info: `backend/src/controllers/authController.ts:33`.
- JWT attached to `Authorization: Bearer <token>` in the frontend via `setToken` (`frontend/src/api.ts`).
- `auth` middleware validates token and attaches `req.user`: `backend/src/middleware/auth.ts:7–18`.
- `admin` middleware restricts privileged endpoints: `backend/src/middleware/admin.ts:4–9`.

## Account Status Rules
- Users have `enabled` flag (`backend/src/models/User.ts:7–14`).
- Login rejects disabled accounts with 403: `backend/src/controllers/authController.ts:24–27`.

## 🔒 Security Features
- **Admin Account Protection**: Public registration cannot create admin accounts
- **Role Enforcement**: All public signups are forced to student role
- **Admin-Only Endpoints**: Secure admin user creation and promotion endpoints
- **Audit Logging**: All admin-related activities are logged with IP and user context
- **403 Protection**: Consistent forbidden responses for unauthorized access
- **Input Validation**: Backend rejects any admin role assignment attempts during registration

## 📋 Admin Management
- Admin accounts can only be created by existing administrators
- Use `/api/admin/create-admin` endpoint for admin user creation
- Use `/api/admin/promote-admin/:userId` endpoint to promote existing users
- All admin operations require authentication and admin role verification
- Admin can toggle status in Users Management; UI and backend update together.

## Frontend Routing
- Top-level routes: `frontend/src/App.tsx:16–21`.
- User:
  - `/user` redirects to `/user/dashboard`: `frontend/src/pages/UserPage.tsx:74–78`.
  - Sidebar highlights active tab; Settings navigates to `/user/settings`, Dashboard to `/user/dashboard`:
    - Buttons: `frontend/src/pages/UserPage.tsx:155–160`, `frontend/src/pages/UserPage.tsx:172–177`.
  - Content area renders dashboard or account settings based on path: `frontend/src/pages/UserPage.tsx:181–236`.
- Admin:
  - `/admin` redirects to `/admin/dashboard`: `frontend/src/pages/AdminPage.tsx:33–37`.
  - Sidebar includes Dashboard, Settings, Manage Users with highlight: `frontend/src/pages/AdminPage.tsx:99–127`.
  - Content area toggles between dashboard, settings, or users: `frontend/src/pages/AdminPage.tsx:145–160`.

## Account Settings UI (User & Admin)
- Design requirements implemented:
  - Minimal, spacious cards with `#FFFFFF` backgrounds, `#E5E7EB` borders, subtle shadow.
  - Soft background `#F7F8FA` when viewing settings.
  - Headings `#111827`, labels `#374151`, placeholder `#9CA3AF`.
  - Inputs 48–52px height, smooth rounded corners.
  - Full-width black buttons (`#000`) with hover `#111`, border radius 12.
- Behavior:
  - Email field disabled with hint “Email cannot be changed”.
  - Names update the sidebar only after clicking “Update Profile”.
- User implementation:
  - State separation (display vs draft) to require button click: `frontend/src/pages/UserPage.tsx:33–39`, `frontend/src/pages/UserPage.tsx:80–92`.
  - Sidebar uses derived `fullName` from display state: `frontend/src/pages/UserPage.tsx:55–63`, `frontend/src/pages/UserPage.tsx:145–150`.
- Admin implementation mirrors user: `frontend/src/pages/AdminPage.tsx:39–54`, `frontend/src/pages/AdminPage.tsx:57–83`, `frontend/src/pages/AdminPage.tsx:83–90`.

## SweetAlert Error Handling
- Wrong current password during change shows SweetAlert toast with red styling:
  - User: `frontend/src/pages/UserPage.tsx:94–118`
  - Admin: `frontend/src/pages/AdminPage.tsx:83–107`
- Other errors show banner via `SuccessMessage`.

## Admin — Users Management
- Path: `/admin/users` with sidebar highlighting.
- Table (AWS/GCP IAM style): `frontend/src/components/UsersTable.tsx`.
  - Columns: row `#`, masked email (User ID), masked name, status (green check or red block), main access key, control.
  - Status toggling updates backend and UI: `frontend/src/components/UsersTable.tsx:91–94` and status cell click `frontend/src/components/UsersTable.tsx:64–74`.
  - Control buttons:
    - View (clipboard): opens modal with details.
    - Manage (gear): role selection (Admin/User only), access key regeneration, and full-name edit.
    - No delete icon or functionality.
  - Create user modal supports name, email, password, and role: `frontend/src/components/UsersTable.tsx:136–182`.
- Backend endpoints: `backend/src/routes/userRoutes.ts`
  - List users: `GET /api/users` → `userController.listUsers`
  - View one: `GET /api/users/:id` → `userController.getUser`
  - Create: `POST /api/users` → `userController.createUser`
  - Update status: `PUT /api/users/:id/status` → `userController.updateStatus`
  - Update role: `PUT /api/users/:id/role` → `userController.updateRole`
  - Regenerate access key: `PUT /api/users/:id/access-key` → `userController.regenerateAccessKey`
  - Admin edit profile (username): `PUT /api/users/:id/profile` → `userController.updateProfileAdmin`

## Backend API — Auth
- Routes: `backend/src/routes/authRoutes.ts:6–9`
  - `POST /api/auth/register` — create user with `username`, `email`, `password`, `isAdmin`.
  - `POST /api/auth/login` — returns `{ token, isAdmin, username, email }`.
  - `PUT /api/auth/profile` (auth required) — update current user `username`.
  - `PUT /api/auth/password` (auth required) — change current user password with `{ currentPassword, newPassword }`.
- Controllers: `backend/src/controllers/authController.ts`
  - Registration and login logic with bcrypt and JWT.
  - Disabled accounts blocked at login: `backend/src/controllers/authController.ts:24–27`.

## Data Model — User
- Fields: `username`, `email`, `password`, `isAdmin`, `enabled`, `accessKey` (`backend/src/models/User.ts:7–14`).
- Defaults: `isAdmin=false`, `enabled=true`, `accessKey` randomized at creation/regeneration.

## Frontend UX Notes
- Name source:
  - At login, backend returns `username` and `email`; values are stored:
    - `frontend/src/pages/LoginPage.tsx:30–36`
  - Sidebar uses stored `username` and only changes after “Update Profile”.
- Navigation:
  - User: `/user/dashboard` and `/user/settings` (redirect from `/user`).
  - Admin: `/admin/dashboard`, `/admin/settings`, `/admin/users` (redirect from `/admin`).

## Security & Access Control
- JWT is required for protected routes.
- Admin-only routes enforced by `admin` middleware.
- Never exposes passwords in responses; uses bcrypt for hashing.

## Testing & Verification
- Start backend and frontend; verify:
  - Login and role-based navigation.
  - Account settings update name only on button click.
  - Password change shows SweetAlert on wrong current password.
  - Admin Users Management:
    - Status toggle blocks/permits login.
    - Role change reflects in UI and backend.
    - Access key regeneration updates display.
    - Create user appears in list and can login if enabled.

## Role-Based Functionality
- Student
  - Pages: Dashboard, Settings, Clearance Slip, Requirements, Progress, Certificate.
  - Profile: Updates via `PUT /api/auth/profile` (display name only). Student info persisted via `PUT /api/student/profile`.
  - Start Clearance: `POST /api/clearance/start` creates a `ClearanceRequest` for the active/open term (backend/src/controllers/clearanceController.ts:17).
  - Timeline: `GET /api/clearance/timeline` shows department statuses computed from MongoDB (backend/src/controllers/clearanceController.ts:40).
  - Requirements: Upload flags saved in `StudentProfile` for Valid ID, Adviser Form, Organization Form (backend/src/models/StudentProfile.ts:1). Frontend fetches and displays completion state.
  - Certificate: `GET /api/clearance/certificate` returns a generated PDF placeholder.

- Officer (Signatory)
  - Pages: Pending, Review & Sign, Remarks, Settings.
  - Pending List: `GET /api/signatory/pending` lists students with department status summaries (backend/src/controllers/signatory/signatoryController.ts:8).
  - Approve: `POST /api/signatory/approve` marks the next pending department status approved; stamps `signedBy/signedAt` and updates final status when all are approved (backend/src/controllers/signatory/signatoryController.ts:67).
  - Remarks/Reject: `POST /api/signatory/remarks` marks the next pending department status rejected with remarks (backend/src/controllers/signatory/remarksController.ts:7).
  - Access Control: guarded by `auth` + `officer` middleware (backend/src/middlewares/roleMiddleware.ts:12; backend/src/routes/signatoryRoutes.ts:9–11).

- College Dean
  - Pages: Final Approval, Department Approvals, Settings.
  - Final-Ready: `GET /api/dean/final-ready` lists students whose departments are all approved and `finalStatus` is pending (backend/src/controllers/dean/deanController.ts:1; backend/src/routes/deanRoutes.ts:8).
  - Department-Pending: `GET /api/dean/department-pending` lists students with any department still pending or rejected (backend/src/controllers/dean/deanController.ts:38).
  - Final Approval: `POST /api/dean/final-approval` approves final clearance when eligible; sets `finalStatus` and `finalApprovalDate` (backend/src/controllers/dean/deanController.ts:86).
  - Access Control: guarded by `auth` + `dean` middleware (backend/src/middlewares/roleMiddleware.ts:18).

- Admin
  - Pages: Dashboard, Settings, Users, Departments, Requirements, Terms, Records.
  - Users Management: `GET/POST/PUT /api/admin/users` with status, role, access key, and profile management (backend/src/controllers/admin/userManagementController.ts:1; backend/src/routes/adminRoutes.ts:6–15).
  - Departments: `POST /api/admin/departments` to create or update department metadata (backend/src/controllers/admin/userManagementController.ts:83).
  - Requirements: `POST /api/admin/requirements` to define per-department requirements (backend/src/controllers/admin/userManagementController.ts:92).
  - Terms: `POST /api/admin/terms` to configure academic terms (backend/src/controllers/admin/userManagementController.ts:100).
  - Clearance Stats: `GET /api/admin/clearance-stats` summarizes requests by status (backend/src/controllers/admin/userManagementController.ts:107).

## Future Enhancements
- Add pagination and sorting to Users Management.
- Add audits for status/role changes.
- Add dedicated profile fields (first/last name) if desired.
