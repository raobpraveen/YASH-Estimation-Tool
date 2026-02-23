# IT/Software Project Estimator - PRD

## Original Problem Statement
Build an IT/Software Project estimator tool with comprehensive features for:
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

### Cost Calculation
- Calculate costs based on average monthly salary for a resource's skill and proficiency
- Add percentage-based "Overheads" cost configurable per base location
- Add percentage-based "Profit Margin" (default 35%) to determine final selling price
- **Selling Price Formula**: `(Base Cost + Overheads) / (1 - (Profit Margin / 100))`
- **Average Selling Price per MM** displayed for onsite and offshore resources

### Logistics Costs (Traveling Resources)
- **Travel Required toggle** per skill row to indicate if resource needs travel logistics
- Calculated at wave level for resources with `travel_required=true`
- **Formulas**:
  - Per-diems, Accommodation, Conveyance: `Traveling MM × Daily Rate × Days`
  - Air Fare, Visa & Medical: `Number of Traveling Resources × Rate × Number of Trips`
- Editable rates per wave

### Review & Approval Workflow
- **Status Flow**: Draft → In Review → Approved/Rejected
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
- **Inline grid editing** for Skill, Level, and Location with auto salary lookup
- Summary cards with **Avg. Selling Price per MM**
- **6 summary cards**: Total MM, Onsite MM (with avg), Offshore MM (with avg), Onsite Avg $/MM, Offshore Avg $/MM, Selling Price
- View Summary shows avg selling price per MM for onsite and offshore separately
- **Profit margin badge** displayed per wave in View Summary

### Dashboard Analytics
- Total Projects count
- Total Revenue (sum of all project selling prices)
- Approved/In Review counts
- Projects by Status pie chart
- Revenue Trend line chart
- Top Customers by Revenue bar chart
- Recent Notifications panel

---

## What's Been Implemented

### December 22, 2025 - Iteration 7 Features

#### Inline Grid Editing (COMPLETE)
- [x] Excel-like dropdowns for Skill, Level, and Location in resource grid
- [x] Auto salary lookup when Skill/Level/Location changes via `lookupSalary()` function
- [x] Updates `avg_monthly_salary`, `skill_name`, `base_location_name`, `overhead_percentage` on change

#### Multi-Select Fields (COMPLETE)
- [x] Technology(s) - multi-select with badge tags and X to remove
- [x] Project Type(s) - multi-select with badge tags and X to remove
- [x] Project Location(s) - multi-select with badge tags and X to remove

#### Read-Only Mode Enhancement (COMPLETE)
- [x] Projects with "In Review" status are read-only
- [x] Projects with "Approved" status are read-only
- [x] Older versions are read-only
- [x] All inputs, toggles, buttons disabled in read-only mode
- [x] Delete button hidden in read-only mode

#### Version Notes Mandatory (COMPLETE)
- [x] Version Notes field present in project header
- [x] Validation: cannot save existing project without version notes
- [x] Error toast shown when version notes empty

#### KPI Cards Enhancement (COMPLETE)
- [x] Onsite Avg. $/MM card with amber border
- [x] Offshore Avg. $/MM card with blue border
- [x] Shows calculated average based on salary cost and profit margin

#### View Summary Enhancement (COMPLETE)
- [x] Profit margin badge per wave (e.g., "Profit: 35%")
- [x] Onsite MM with Avg price/MM
- [x] Offshore MM with Avg price/MM

#### Compare Versions Enhancement (COMPLETE)
- [x] Version Notes displayed for each version being compared
- [x] "Onsite Selling Price" row with diff calculation
- [x] "Offshore Selling Price" row with diff calculation

### Previous Implementation

#### Master Data Pages (COMPLETE)
- [x] Dashboard with analytics (charts, metrics, notifications)
- [x] Customers management page
- [x] Technologies management page
- [x] Project Types management page
- [x] Base Locations management page (with overhead %)
- [x] Skills management page (unique records, Technology first column)
- [x] Proficiency Rates management page (unique key validation, Technology first column)

#### Project Estimator (COMPLETE)
- [x] Profit Margin slider (default 35%)
- [x] Wave management (Add/Delete waves)
- [x] Dynamic columns based on wave duration
- [x] Editable phase names per column
- [x] Resource allocation with custom salary override
- [x] **Onsite toggle** (amber ON/OFF)
- [x] **Travel Required toggle** (purple YES/NO) with formula tooltip
- [x] Logistics configuration per wave
- [x] **Batch Update Logistics** for wave-level settings
- [x] Real-time cost calculations
- [x] Logistics breakdown table
- [x] Export to Excel
- [x] **Responsive buttons** (visible at 100% zoom)

#### Review & Approval Workflow (COMPLETE)
- [x] Status badge display (Draft/In Review/Approved/Rejected)
- [x] Submit for Review button with email input dialog
- [x] Approve/Reject buttons for reviewers
- [x] Approval comments input
- [x] In-app notifications system

#### Version Management (COMPLETE)
- [x] Unique project numbers (PRJ-0001 format)
- [x] Version tracking (v1, v2, v3...)
- [x] **Expandable version history** in Projects list
- [x] Clone project (resets status to draft)
- [x] New Version (same project number, increment version)
- [x] Compare Versions page

---

## Technical Architecture

### Backend (FastAPI)
- Unique validation for Skills (name + technology_id)
- Unique validation for Proficiency Rates (skill_id + base_location_id + proficiency_level)
- Project supports `technology_ids[]`, `project_type_ids[]`, `project_locations[]` arrays
- Clone resets status to draft and clears approval fields
- Submit for review sets status to "in_review"

### Frontend (React)
- Shadcn UI components
- Tailwind CSS styling
- recharts library for charts
- XLSX library for Excel export
- React Router for navigation
- TooltipProvider for formula tooltips
- Multi-select implemented via badge array pattern

### Database (MongoDB)
- Collections: customers, technologies, project_types, base_locations, skills, proficiency_rates, projects, notifications

---

## Key Data Models

### Project
```javascript
{
  id: string,
  project_number: string,  // PRJ-0001
  version: int,
  version_notes: string,   // Notes for this version (mandatory on update)
  is_latest_version: boolean,
  project_locations: [string],  // Multiple ISO codes
  technology_ids: [string],     // Multiple technology IDs
  technology_names: [string],
  project_type_ids: [string],   // Multiple project type IDs
  project_type_names: [string],
  status: string,          // draft, in_review, approved, rejected
  approver_email: string,
  waves: [WaveObject],
}
```

### Skill
```javascript
{
  id: string,
  name: string,
  technology_id: string,
  technology_name: string,
}
// Unique: name + technology_id
```

### ProficiencyRate
```javascript
{
  id: string,
  skill_id: string,
  base_location_id: string,
  proficiency_level: string,
  avg_monthly_salary: float,
}
// Unique: skill_id + base_location_id + proficiency_level
```

---

## Prioritized Backlog

### P0 - High Priority (ALL COMPLETE)
- [x] Multi-select Technology and Project Type
- [x] Inline grid editing (Excel-like dropdowns)
- [x] Read-only mode for "In Review" projects
- [x] Version Notes mandatory validation
- [x] KPI cards with Onsite/Offshore Avg $/MM
- [x] View Summary with profit margin per wave
- [x] Compare Versions with version notes and selling prices
- [x] Total Cost column in grid (Salary Cost + Overhead)
- [x] Excel upload for Skills and Proficiency Rates
- [x] JWT-based user authentication (login/register)
- [x] Project templates (save as template, create from template)

### P1 - Medium Priority
- [ ] Email notifications (SendGrid/Resend integration)
- [x] Advanced dashboard filters (date range, customer filter) - COMPLETE
- [x] Export to Excel Enhancement - reflect complex grid structure with Overhead, Total Cost, Selling Price, and all KPIs
- [x] Inline editing for Proficiency Rates - COMPLETE

### P2 - Low Priority
- [ ] Export to PDF
- [x] User authentication - COMPLETE (JWT-based)
- [ ] Multi-currency support
- [x] Role-based access control - COMPLETE (Admin, Approver, User roles)

### Refactoring Tasks
- [x] Break down `ProjectEstimator.js` into smaller components:
  - `/app/frontend/src/components/estimator/KPICards.js` - Summary KPI cards
  - `/app/frontend/src/components/estimator/WaveSummary.js` - Wave summary card
  - `/app/frontend/src/components/estimator/LogisticsBreakdown.js` - Logistics table
  - `/app/frontend/src/components/estimator/ResourceGrid.js` - Resource allocation grid
  - `/app/frontend/src/components/estimator/SummaryDialog.js` - View Summary modal

---

## December 22, 2025 - Iteration 8 Features

### JWT Authentication (COMPLETE)
- [x] Login page with Login/Register tabs
- [x] JWT token-based authentication (HS256, 24hr expiration)
- [x] User session persisted in localStorage
- [x] Protected routes redirect to login when not authenticated
- [x] User info and Sign Out button in sidebar
- [x] API endpoints: `/auth/register`, `/auth/login`, `/auth/me`

### Grid Total Cost Column (COMPLETE)
- [x] Added "Total Cost" column between Overhead and Selling Price
- [x] Calculation: Salary Cost + Overhead
- [x] Gray background to distinguish from Selling Price (green)
- [x] Excel export updated to include Total Cost column

### Excel Upload for Master Data (COMPLETE)
- [x] Skills page: Template download + Upload Excel buttons
- [x] Proficiency Rates page: Template download + Upload Excel buttons
- [x] Template columns match screen columns
- [x] Duplicate records skipped during upload
- [x] Success toast with "X added, Y skipped" message

### Project Templates (COMPLETE)
- [x] "Save as Template" button (bookmark icon) on each project
- [x] Template name input dialog
- [x] "From Template" button in Projects header
- [x] Template dropdown with wave count
- [x] Template badge (green) shown on template projects
- [x] Projects created from template show "(from template)" in name
- [x] New project number assigned, status reset to draft
- [x] API endpoints: `/templates`, `/save-as-template`, `/create-from-template`, `/remove-template`

---

## Test Coverage
- Test reports: `/app/test_reports/iteration_9.json`
- All iteration 9 features tested and verified working:
  - Admin Login, Dashboard KPIs/Charts/Filters
  - User Management (CRUD, RBAC)
  - Proficiency Rates inline editing
- Backend: 93% pass rate (14/15 tests)
- Frontend: 100% pass rate (All 11 features verified via Playwright)

---

## February 23, 2026 - Iteration 9 Features

### Role-Based Access Control (COMPLETE)
- [x] User model with `role` field (admin, approver, user)
- [x] User Management page only visible to admins
- [x] Backend APIs protected with admin role checks
- [x] Conditional navigation in sidebar based on role

### User Management (COMPLETE)
- [x] List all users with Name, Email, Role badges, Status
- [x] Create new user (Full Name, Email, Password, Role)
- [x] Edit user (change name, email, role, active status)
- [x] Delete user (with confirmation)
- [x] Reset password functionality
- [x] API endpoints: GET/POST/PUT/DELETE `/api/users`

### Dashboard Filters (COMPLETE)
- [x] Toggle Filters button in dashboard header
- [x] Date From / Date To date pickers
- [x] Customer dropdown with "All Customers" option
- [x] Apply and Clear buttons
- [x] Fixed Select component empty value issue

### Inline Editing for Proficiency Rates (COMPLETE)
- [x] Edit button (pencil icon) per row
- [x] Click edit shows inline input field for salary
- [x] Save (checkmark) and Cancel (X) buttons
- [x] PUT /api/proficiency-rates/{id} endpoint
- [x] Real-time data refresh after save

### Branding (COMPLETE)
- [x] YASH Technologies logo on login page
- [x] YASH Technologies logo in sidebar
- [x] Footer with "© 2026 YASH Technologies"

---

## Notes
- Currency is always USD
- Travel Required is SEPARATE from Onsite
- Logistics only calculated for resources with travel_required=true
- Email notifications planned for future (currently in-app only)
- All projects default to "draft" status
- Clone resets status to draft
- Old versions, approved projects, and in_review projects are display-only
- Version notes mandatory when updating existing projects (not for new projects)
