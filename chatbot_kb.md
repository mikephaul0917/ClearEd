# Chatbot Knowledge Base: E-Clearance (ClearEd)

This document serves as the primary knowledge source for the ClearEd chatbot. It contains structured information about system functions, user workflows, and troubleshooting.

---

## 1. System Overview
**ClearEd** is a web-based E-Clearance system that digitizes the traditionally paper-based student clearance process. It allows institutions to manage clearances through organizations (departments/offices) and track student progress in real-time.

**Core Terminology:**
- **Term:** An academic period (e.g., Semester 1, 2024-2025).
- **Organization:** A department or office (e.g., Library, Finance) that sets requirements.
- **Requirement:** A specific task or document a student must fulfill (e.g., "Return borrowed books").
- **Clearance Request:** A student's application to be cleared for a specific organization in a specific term.

---

## 2. User Roles & Capabilities

### Student
- **Join Organizations:** Use a unique Join Code provided by the institution.
- **Start Clearance:** Initiate the digital workflow for a specific semester.
- **Submit Proof:** Upload files, fill out forms, or answer polls to fulfill requirements.
- **Track Progress:** View real-time status (Pending, Turned In, Approved, or Returned).
- **Download Certificates:** Obtain digital proof of clearance once fully approved.

### Officer (Staff)
- **Manage Requirements:** Create and edit what students need to do to be cleared.
- **Review Submissions:** View uploaded files and verify student work.
- **Return for Revision:** Mark a submission as "Returned" if it needs correction.
- **Bulk Approval:** Use the "Return" button in the submissions tab to approve multiple students at once.

### Admin / Dean
- **Term Management:** Set up academic years and semesters.
- **Institutional Oversight:** Monitor the clearance progress of all students.
- **Final Approval:** Grant the overall dean-level sign-off once all departments have cleared a student.

---

## 3. Frequently Asked Questions (FAQs)

### General
- **Q: What is ClearEd?**
  - A: It's a platform that eliminates long lines and paper forms by allowing you to complete your institutional clearance digitally.
- **Q: Is my data safe?**
  - A: Yes. All data is encrypted and protected by role-based access control. ClearEd uses secure JWT authentication and Bcrypt hashing for password security.

### Student Process
- **Q: How do I submit my requirement?**
  - A: Navigate to your organization, click on the requirement, and use the "Add or Create" button to upload your proof. Then click "Mark as done" or "Hand in."
- **Q: What does "Returned" mean?**
  - A: If your status is "Returned," your officer found an issue with your submission. Check the private comments for feedback and resubmit your work.
- **Q: How do I share a link to a requirement?**
  - A: Open the requirement details, click the ellipsis (three dots) icon at the top right, and select "Copy link."

### Officer Process
- **Q: How do I approve students in bulk?**
  - A: Go to the "Member submission" tab of a requirement, select the students using the checkboxes, and click the "Return" button. This signifies you are "returning" the approved task to the students.

---

## 4. Troubleshooting Guide

### "No Active Term Found"
- **Problem:** Users cannot start clearance because the system says there is no active term.
- **Solution:** An Institutional Admin must go to the "Terms" or "Academic Years" section and ensure a term is created and marked as "Active."

### "Access Denied" or "Forbidden"
- **Problem:** A student or officer cannot view a page.
- **Solution:** Ensure you are an active member/officer of that specific organization. Students must join via a code, and officers must be invited or assigned by an admin.

### Login Issues
- **Problem:** Cannot log in with a Gmail account.
- **Solution:** Ensure your institution allows Google OAuth. If not, you must use the email and password provided during registration or by your administrator.

---

## 5. Quick Reference for Chatbot Logic
- **If the user asks about the status of their clearance:** Advise them to check their "Dashboard" or "Timeline" within the specific organization.
- **If the user asks how to join an org:** Instructions: Sidebar -> Browse Organizations -> Join with Code.
- **If an officer asks how to delete a requirement:** Requirements in the "Requirement Details" view are protected; deletions must follow institutional data retention policies (the "Delete" option is purposefully restricted in some views).
