# E-Clearance (ClearEd) System Documentation

## I. SYSTEM OVERVIEW & DESIGN

### 1.1 Problem Definition & Scope
**Problem Statement:**
Traditional student clearance processes in educational institutions are predominantly manual and paper-based. This leads to extreme inefficiencies, high administrative overhead, student frustration due to long physical queues, and a significant risk of data loss or fraud through physical signature forgery.

**Defined Scope:**
*   **In Scope:** 
    *   Centralized digital student portal for clearance requests.
    *   Role-based dashboards for Students, Officers, Admins, and Super Admins.
    *   Digital requirement submission (file uploads, links, forms, polls).
    *   Automated email notification system for status updates.
    *   Comprehensive audit logging for all administrative actions.
    *   Institutional management for scalability across multiple schools.
*   **Out of Scope:**
    *   Direct integration with institutional banking/payment gateways (currently handled via proof-of-payment uploads).
    *   Physical barcode/QR scanning hardware integration for physical ID verification (mobile-first digital verification is used).

**Measurable Objectives:**
*   Reduce average student clearance processing time by 75% compared to paper methods.
*   Eliminate 100% of physical paper waste related to clearance signatures.
*   Provide 24/7 real-time tracking of clearance progress for all stakeholders.

**Target Users:**
*   **Students:** Need a simple, mobile-friendly interface to track and fulfill requirements.
*   **Officers:** Need efficient bulk-review tools and a clear queue of pending tasks.
*   **Admins/Deans:** Need high-level oversight of institutional progress and final approval authority.
*   **Super Admins:** Need cross-institution configuration and system maintenance tools.

---

### 1.2 System Architecture & Design
**System Architecture:**
The system utilizes a **Client-Server Architecture** with a decoupled frontend and backend.
`[Diagram: Layered System Architecture showing React Frontend -> Express API -> MongoDB]`

**Component breakdown:**
*   **Frontend (React/Vite):** Handles state management, UI rendering, and client-side routing.
*   **Backend (Node.js/Express):** Manages business logic, authentication, and database orchestration.
*   **Data Layer (MongoDB):** Persistent storage with indexed collections for high-speed retrieval.
*   **Services Layer:** Independent modules for Notifications (SMTP), Audit Logging, and Onboarding.

**Data Flow:**
1.  **Request:** Student initiates a clearance request in a specific organization.
2.  **Mapping:** System aggregates all active requirements for that organization.
3.  **Action:** Student uploads/submits proof for a requirement.
4.  **Review:** Officer reviews the submission.
5.  **Finalization:** Once all requirements are approved, the request moves to the Dean for final sign-off.

**Design Patterns:**
*   **MVC (Model-View-Controller):** Segregates data structure, business logic, and UI (Backend logic).
*   **Repository Pattern:** Decouples data access from business logic via specialized controller functions.
*   **Stateless Authentication:** Utilizes JWT to allow the system to scale horizontally without session affinity.

---

### 1.3 Technology Stack & Tools
**Programming Languages:**
*   **TypeScript:** Used universally across frontend and backend to ensure type safety and reduce runtime errors.

**Frameworks & Libraries:**
*   **Frontend:** React.js (Component-driven UI), Vite (Build tool), Material UI (Component library).
*   **Backend:** Express.js (REST API framework).
*   **Database:** MongoDB with Mongoose (ODM).
*   **Security:** JSON Web Tokens (JWT), Bcrypt (Password hashing).

**Rationale for Technology Choice:**
*   **React over Vue:** Selected for its vast ecosystem, robust hook-based state management, and better support for the "Bento" design system components.
*   **MongoDB over PostgreSQL:** The flexible schema of MongoDB allows for rapid iteration of requirement types (files, polls, forms) without complex migrations.

---

### 1.4 Usability & Interface Design
**Description of UI Design:**
The system uses a **Bento-box inspired layout** characterized by modular, clean containers, premium typography (Google Sans), and a focus on visual clarity.
`[Screenshot: Student Dashboard showing the Bento-style layout]`

**Key Usability Principles:**
*   **Simplicity:** Minimalist headers and intuitive navigation bars.
*   **Accessibility:** High contrast ratios for text and support for keyboard navigation.
*   **Mobile-First:** A fully responsive layout that ensures students can fulfill requirements entirely from their smartphones.

**User Flow:**
1.  Landing Page -> 2. Login/SSO -> 3. Dashboard -> 4. Organization View -> 5. Requirement Submission -> 6. Success Feedback.
`[Diagram: User Navigation Flowchart]`

---

## II. COMPUTATIONAL MODEL

### 2.1 Data Modeling & Representation
**Entity-Relationship:**
`[Diagram: Entity-Relationship Diagram (ERD) showing mappings between User, Org, Requirement, and Submission]`

**Key Entities:**
*   **User:** Root account with RBAC (Role-Based Access Control).
*   **ClearanceRequest:** The primary state-tracking entity for a student's term clearance.
*   **ClearanceRequirement:** Defines what a student needs to provide (e.g., "Library Clearance").
*   **ClearanceSubmission:** Contains the student's actual proof (files, answers).

**Normalization:**
The system uses a **Referential Design** for core relationships (e.g., `ClearanceSubmission` references `ClearanceRequestID`) to ensure data integrity. However, some denormalization (e.g., storing student names in audit logs) is used to optimize read performance for administrative dashboards.

---

### 2.2 Computational Logic & Processing
**End-to-End Walkthrough (Requirement Lifecycle):**
1.  **Input:** Student uploads a file (PDF) to a "Finance" requirement.
2.  **Processing:** 
    *   Server validates file type and size.
    *   File is stored, and a `ClearanceSubmission` record is created with `status: 'pending'`.
    *   Audit service logs the activity.
3.  **Output:** Officer sees the submission in their "To Review" queue.

**Key Computations:**
*   **Completion Algorithm:** Overall status is calculated dynamically by checking if `count(ApprovedRequirements) == count(RequiredItems)`.
*   **Status Aggregation:** The `getTimeline` API aggregates submissions and requirements into a single data array for the frontend.

---

### 2.3 Scalability & Performance Considerations
**Performance Bottlenecks Identified:**
*   **Large Log Tables:** Audit logs can grow to millions of rows.
*   **Concurrent Uploads:** High volume of file uploads during finals week.

**Optimization Strategies:**
*   **Indexing:** Database queries are optimized with indexes on `userId`, `organizationId`, and `status`.
*   **Stateless Scaling:** JWT authentication allows multiple Node.js instances to handle requests without a shared session store.

---

### 2.4 Data Validation & Error Handling
**Validation:**
*   **Client-side:** Immediate feedback using Zod and React Hook Form.
*   **Server-side:** Strict Mongoose schema validation and custom Express middleware.

**Error Handling:**
*   Generic user-facing messages (e.g., "Something went wrong, please try again") combined with detailed internal logging for developers.
*   **Edge Cases:** Handling of "Late Submissions" via term-expiry logic in `termScheduler.ts`.

---

## III. ALGORITHM MODEL

### 3.1 Algorithm Selection & Justification
**Core Algorithms:**
1.  **Bcrypt (Security):** Optimized for password hashing with adaptive salt and cost factors. 
2.  **Timsort (Sorting):** Standard JavaScript sort logic used for maintaining the order of clearance requirements.
3.  **B-Tree (Database Search):** MongoDB's underlying indexing algorithm, chosen for O(log n) lookup speeds.

---

### 3.2 Algorithm Design & Correctness
**Pseudocode for Status Calculation:**
```text
FUNCTION calculateOverallStatus(requestId):
    requirements = fetchAllRequirementsForOrg(requestId.orgId)
    submissions = fetchAllSubmissionsForRequest(requestId)
    
    FOR EACH req IN requirements:
        IF findSubmission(submissions, req.id).status != 'approved':
            RETURN 'in_progress'
            
    RETURN 'completed'
```
**Justification of Correctness:**
The algorithm ensures that "Cleared" status is only granted if every requirement in the configuration is verified as "Approved" by an officer.

---

### 3.3 Complexity Analysis
*   **Time Complexity:** 
    *   Search/Login: **O(log n)** due to B-Tree indexing on email.
    *   Dashboard Aggregation: **O(n)** where n is the number of requirements.
*   **Space Complexity:** **O(1)** for session handling due to stateless JWT.

---

## IV. FRAMEWORK & IMPLEMENTATION

### 4.1 Framework Appropriateness & Integration
**Framework Choice:**
*   **React:** Chosen for its virtual DOM diffing (Reconciliation), which provides a high-performance experience for dynamic progress bars and status updates.
*   **Express:** Chosen for its event-driven, non-blocking I/O model, essential for a multi-tenant institutional system.

**Built-in Features:**
*   Utilizes **Mongoose Middlewares** for automatic audit logging on every `.save()` operation.
*   Leverages **Express Middleware** for consistent role checking across hundreds of routes.

**Integration Challenges:**
*   **Challenge:** Syncing sidebar state when an organization is created.
*   **Solution:** Implemented a custom event listener (`refresh-sidebar`) to coordinate across React contexts.
