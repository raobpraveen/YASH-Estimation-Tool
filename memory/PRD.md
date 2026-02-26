# IT/Software Project Estimator - PRD

## Original Problem Statement
Build an IT/Software Project estimator tool named "YASH EstPro" with comprehensive features for:
- Skills management with technology and proficiency levels
- Cost calculation based on monthly salaries, overheads, and profit margins
- Wave-based project estimation with Excel-like inline grid editing
- Logistics costs for traveling resources
- Master data management
- Review and approval workflow
- Dashboard analytics
- Version management with comparison
- Summary and export capabilities

## Core Requirements

### Skills Management
- Maintain skills with technology and proficiency levels
- **Unique records only**: Same skill name + technology combination not allowed
- **Technology as first column** in the table

### Proficiency Rates
- **Unique key combination**: Technology + Skill + Base Location + Proficiency Level
- **Technology as first column** in the table

### Cost Calculation (Updated Feb 23, 2026)
- Calculate costs based on average monthly salary for a resource's skill and proficiency
- Add percentage-based "Overheads" cost configurable per base location
- Add percentage-based "Profit Margin" (default 35%) to determine final selling price
- **Row Selling Price Formula**: `(Salary Cost + Overhead) / (1 - Profit Margin %)`
- **Wave Selling Price** = Sum of all row selling prices + Logistics Selling Price Markup
- **Total Selling Price** = Sum of all wave selling prices
- **Onsite Selling Price** = Sum of row selling prices where `is_onsite=true` + logistics markup
- **Offshore Selling Price** = Sum of row selling prices where `is_onsite=false`
- **Avg $/MM** = Selling Price / Man-Months for each category (onsite/offshore)
- **Nego Buffer NOT included** in Average $/MM calculations

### Logistics Costs (Traveling Resources)
- **Travel Required toggle** per skill row to indicate if resource needs travel logistics
- Calculated at wave level for resources with `travel_required=true`
- **Logistics Config Persists** - Values saved per wave and restored on project load
- **Formulas**:
  - Per-diems, Accommodation, Conveyance: `Traveling MM x Daily Rate x Days`
  - Air Fare, Visa & Medical: `Number of Traveling Resources x Rate x Number of Trips`
- Editable rates per wave

### Review & Approval Workflow
- **Status Flow**: Draft -> In Review -> Approved/Rejected
- Submit for Review with approver email
- Approver can Approve or Reject with comments
- **Approved projects are read-only** - must clone to make changes
- **In Review projects are read-only** - cannot be edited during review
- **Approver can edit and create new version** with their changes
- In-app notifications for all approval events

### Version Management
- Unique project numbers (PRJ-0001, PRJ-0002, etc.)
- Version tracking (v1, v2, v3, etc.)
- **Expandable version history** in Projects list
- **Old versions are read-only** (display mode only)
- **Version Notes** field to capture comments for each version
- **Version Notes mandatory** when updating existing projects
- Clone projects with new project number
- Compare Versions feature for side-by-side comparison with version notes and selling price breakdown

### Project Estimator
- **Multiple project locations** from dropdown list
- **Multiple technologies** via multi-select badges
- **Multiple project types** via multi-select badges
- **Sales Manager** dropdown for project assignment
- **Inline grid editing** for Skill, Level, and Location with auto salary lookup
- Summary cards with **Avg. Selling Price per MM**
- **6 summary cards**: Total MM, Onsite MM (with avg), Offshore MM (with avg), Onsite Avg $/MM, Offshore Avg $/MM, Selling Price
- View Summary shows avg selling price per MM for onsite and offshore separately
- **Profit margin badge** displayed per wave in View Summary

### Dashboard Analytics
- Total Projects count
- Total Value of Estimations (sum of all project selling prices)
- Approved/In Review counts
- Projects by Status pie chart
- Estimation Value Trend line chart
- Top Customers by Value bar chart
- **By Technology** bar chart KPI
- **By Project Type** bar chart KPI
- **By Project Location** bar chart KPI
- **By Sales Manager** bar chart KPI
- Recent Notifications panel
- Filterable by date range and customer

---

## What's Been Implemented

### February 26, 2026 - Iteration 13: New Features

#### Sales Manager CRUD (COMPLETE)
- [x] New `sales_managers` MongoDB collection
- [x] Backend endpoints: POST, GET, GET/{id}, PUT/{id}, DELETE/{id}
- [x] Active/Inactive status with `is_active` flag
- [x] Full CRUD UI page at `/sales-managers`
- [x] Fields: Name, Email, Phone, Department, Active status

#### Sales Manager on Estimator (COMPLETE)
- [x] Sales Manager dropdown in Project Information section
- [x] Fetches only active sales managers
- [x] Persists `sales_manager_id` and `sales_manager_name` with project
- [x] Resets on new project creation

#### Dashboard Revamp (COMPLETE)
- [x] Renamed "Total Revenue" to "Total Value of Estimations"
- [x] Removed "Create New Estimate" button from header
- [x] Added "By Technology" KPI chart
- [x] Added "By Project Type" KPI chart
- [x] Added "By Project Location" KPI chart
- [x] Added "By Sales Manager" KPI chart
- [x] Renamed "Revenue Trend" to "Estimation Value Trend"
- [x] Renamed "Top Customers by Revenue" to "Top Customers by Value"

#### Notification Bell (COMPLETE)
- [x] Bell icon in top-right header corner
- [x] Unread count badge (red circle with number)
- [x] Popover dropdown with notification list
- [x] Color-coded notification types (approved=green, rejected=red, review=amber)
- [x] "Mark all read" button
- [x] 30-second polling for real-time updates

#### Email Notifications (BACKEND READY)
- [x] SMTP email sending logic in backend
- [x] Email templates for: Project Submitted, Approved, Rejected
- [x] Integrated into submit/approve/reject workflow endpoints
- [x] Graceful skip when SMTP not configured (logs warning)
- [ ] SMTP credentials not yet provided by user

### Previous Implementation (Complete)

#### Master Data Pages (COMPLETE)
- [x] Dashboard with analytics
- [x] Customers, Technologies, Project Types, Base Locations
- [x] Skills management (unique records, Technology first column)
- [x] Proficiency Rates management
- [x] Sales Managers management

#### Project Estimator (COMPLETE)
- [x] Profit Margin slider, Wave management, Dynamic columns
- [x] Resource allocation with inline grid editing
- [x] Onsite toggle, Travel Required toggle
- [x] Logistics configuration per wave
- [x] Real-time cost calculations
- [x] Export to Excel, Excel upload for grid data

#### Review & Approval Workflow (COMPLETE)
- [x] Status badges, Submit for Review, Approve/Reject
- [x] Approver selection dropdown
- [x] In-app notification system

#### Version Management (COMPLETE)
- [x] Project numbers, version tracking, expandable history
- [x] Clone, New Version, Compare Versions

#### Authentication & Authorization (COMPLETE)
- [x] JWT authentication, Role-based access (Admin/Approver/User)
- [x] Protected routes, User management for admins

#### Project Templates (COMPLETE)
- [x] Save as Template, Create from Template

#### Project Archiving (COMPLETE)
- [x] Archive/Unarchive, Active/Archived tabs

#### Collapsible Sidebar (COMPLETE)
- [x] Toggle, Hover-to-expand, Keyboard shortcut (Ctrl+B)
- [x] Grouped navigation, State persisted in localStorage

#### Audit Log System (COMPLETE)
- [x] Full audit trail for all project operations
- [x] Admin Audit Log page, Project-specific audit history

---

## Technical Architecture

### Backend (FastAPI)
- server.py: All routes, models, and business logic
- JWT Authentication with HS256
- MongoDB via motor (async)
- SMTP email integration (configurable)

### Frontend (React)
- Shadcn UI components, Tailwind CSS
- recharts for charts, XLSX for Excel
- React Router, Context API

### Database (MongoDB)
- Collections: customers, technologies, project_types, base_locations, skills, proficiency_rates, projects, notifications, audit_logs, sales_managers, users

---

## Prioritized Backlog

### P0 - ALL COMPLETE

### P1 - Medium Priority
- [x] Sales Manager entity with CRUD and Estimator integration - COMPLETE
- [x] Dashboard KPIs (Technology, Project Type, Location, Sales Manager) - COMPLETE
- [x] Notification Bell with unread count - COMPLETE
- [ ] Export to Excel Enhancement - verify Sales Manager included
- [ ] Sidebar hover-to-expand visual verification

### P2 - Low Priority
- [ ] User Profile - Custom Theme (upload background image)
- [ ] Export to PDF
- [ ] Multi-currency support
- [ ] SMTP configuration for email notifications

### Refactoring
- [ ] Extract financial calculation logic from ProjectEstimator.js and ProjectSummary.js into shared utility

---

## Test Coverage
- Test reports: `/app/test_reports/iteration_13.json`
- Backend: 100% pass rate (21/21 tests)
- Frontend: 100% pass rate (all UI features verified)

---

## Notes
- Currency is always USD
- SMTP not configured - emails skipped with warning
- All projects default to "draft" status
- Sales Manager dropdown only shows active managers
