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
- Test reports: `/app/test_reports/iteration_12.json`
- All iteration 12 calculation fixes tested and verified:
  - Logistics Config Persistence
  - Row Selling Price = (Salary + Overhead) / (1 - margin)
  - Wave Selling Price = Sum(Row SP) + Logistics SP
  - Total Selling Price = Sum(Wave SP)
  - Onsite/Offshore based on is_onsite indicator
  - Avg $/MM calculations correct
- Backend: 100% pass rate (9/9 tests)
- Frontend: 100% pass rate (all UI values match calculations)

---

## February 23, 2026 - Iteration 12 Bug Fixes

### Logistics Persistence Bug (FIXED)
- [x] Added `logistics_config` field to backend `ProjectWave` model
- [x] Logistics values now persist after save and page reload
- [x] Each wave stores its own logistics configuration

### Selling Price Calculation Fixes (FIXED)
- [x] Row Selling Price = (Salary Cost + Overhead) / 0.65 (at 35% margin)
- [x] Wave Selling Price = Sum of all row selling prices + logistics markup
- [x] Total Selling Price = Sum of all wave selling prices
- [x] Onsite Selling Price = Sum of row SP where is_onsite=true + logistics
- [x] Offshore Selling Price = Sum of row SP where is_onsite=false
- [x] Avg $/MM = Selling Price / MM for each category

---

## February 23, 2026 - Iteration 11 Features

### Project Archiving (COMPLETE)
- [x] Archive button on each project in Projects list
- [x] POST `/api/projects/{id}/archive` sets is_archived=true
- [x] POST `/api/projects/{id}/unarchive` restores project  
- [x] GET `/api/projects/archived` returns archived projects list
- [x] Active Projects tab and Archived tab in Projects page
- [x] Archived tab shows projects with Restore and Delete buttons
- [x] Success toast messages for archive/unarchive operations

### Collapsible Sidebar (COMPLETE)
- [x] Toggle button in sidebar (ChevronLeft/ChevronRight icon)
- [x] Sidebar collapses from 256px to 64px
- [x] Icons only visible when collapsed
- [x] Full menu labels visible when expanded
- [x] User info and footer hidden when collapsed

### Apply Skill for All Months (COMPLETE)
- [x] "Default Effort" input field in Add Resource dialog
- [x] If default_mm is provided, applies to all months when adding resource
- [x] Calculator icon button in resource grid Actions column
- [x] Click prompts user for value, then applies to all months
- [x] Toast shows "Applied X MM to all N months"

### Bug Fixes (COMPLETE)
- [x] Selling Price Calculation: Overhead applied ONLY to salary, NOT to logistics
- [x] Avg $/MM Display: Nego buffer NOT included in average selling price per MM
- [x] Final Price card correctly includes nego buffer

---

## February 23, 2026 - Iteration 10 Features

### New Branding (COMPLETE)
- [x] New YASH Technologies logo + YASH EstiPro logo side-by-side
- [x] Login page shows both logos horizontally
- [x] Sidebar shows both logos
- [x] "Project Cost Estimator" subtitle (removed "Project Management")

### Dashboard Filters Fix (COMPLETE)
- [x] Date From filter works (ISO string comparison)
- [x] Date To filter works
- [x] Customer dropdown filter works
- [x] Filters update KPIs and charts

### Projects List Filters (COMPLETE)
- [x] Toggle Filters button
- [x] Customer Name search input
- [x] Project Name/Description search input
- [x] Created By dropdown (populated from users)
- [x] Date From/To date pickers
- [x] Clear Filters button

### Audit Fields (COMPLETE)
- [x] `created_by_id` - User ID who created the project
- [x] `created_by_name` - User name who created the project
- [x] `created_by_email` - User email who created the project
- [x] "Created" column in Projects table showing user + date
- [x] Clone and create-from-template sets current user as owner

### Access Control (COMPLETE)
- [x] Non-owner users see "View" button (eye icon)
- [x] Admin users can edit any project
- [x] Project creator can edit their own projects
- [x] Delete button only visible to owner/admin

---

## February 23, 2026 - Iteration 13 Bug Fixes

### Cost to Company Calculation Fix (COMPLETE)
- [x] Cost to Company now correctly excludes logistics
- [x] Formula: Cost to Company = Total Salary Cost + Total Overhead (no logistics)
- [x] Updated in wave summary and overall project summary
- [x] Excel export updated with correct Cost to Company values

### KPI Card Reordering (COMPLETE)
- [x] Onsite/Offshore breakdown row now appears BEFORE Total Selling Price/Final Price row
- [x] New order: Row 1 (MM cards), Row 2 (Onsite/Offshore breakdown), Row 3 (Selling Price/Final Price)

### Profit Calculation Fix (COMPLETE)
- [x] Profit formula corrected: (Onsite Selling Price + Offshore Selling Price) - Cost to Company
- [x] Updated in View Summary dialog - Overall Project Summary section
- [x] Excel export updated with correct Profit values

### Excel Export Enhancement (COMPLETE)
- [x] Added Resources Price per wave
- [x] Added Onsite/Offshore Selling Price per wave
- [x] Added Profit per wave
- [x] Added Total Resources Price in overall summary
- [x] Added Total Profit in overall summary

### Project Summary Page Fix (COMPLETE)
- [x] Rewritten calculation logic to match ProjectEstimator.js
- [x] Cost to Company now excludes logistics
- [x] Profit calculation corrected
- [x] Added all missing fields (Resources Price, Onsite/Offshore Selling Prices)
- [x] Excel export updated with all fields

---

## February 23, 2026 - Iteration 14: Sidebar & Audit Log Features

### Enhanced Collapsible Sidebar (COMPLETE)
- [x] Hover-to-expand: Sidebar auto-expands on hover when collapsed
- [x] Keyboard shortcut: Ctrl+B to toggle sidebar
- [x] Remember preference: Collapse state saved to localStorage
- [x] Tooltips: Show nav item names on hover when collapsed
- [x] Grouped navigation: Main, Master Data, Admin, Settings sections

### Full Audit Log Feature (COMPLETE)
- [x] New `audit_logs` MongoDB collection
- [x] Audit tracking for all project operations:
  - Project create/update/delete
  - Clone and archive/unarchive
  - Status changes (submit, approve, reject)
  - Version creation
  - Field-level change tracking
- [x] New Audit Log page for admins (/audit-logs)
  - Summary statistics (total logs, recent activity, top action, most active user)
  - Filterable table (by action, entity type, user, date range)
  - Expandable rows showing changes and metadata
- [x] Audit Trail section on Project Summary page
  - Shows project-specific audit history
  - Collapsible section with timeline view
- [x] Backend API endpoints:
  - GET /api/audit-logs - List all logs with filters
  - GET /api/audit-logs/project/{id} - Project-specific logs
  - GET /api/audit-logs/summary - Admin statistics

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
