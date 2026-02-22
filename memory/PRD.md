# IT/Software Project Estimator - PRD

## Original Problem Statement
Build an IT/Software Project estimator tool with comprehensive features for:
- Skills management with technology and proficiency levels
- Cost calculation based on monthly salaries, overheads, and profit margins
- Wave-based project estimation
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
- **Approver can edit and create new version** with their changes
- In-app notifications for all approval events

### Version Management
- Unique project numbers (PRJ-0001, PRJ-0002, etc.)
- Version tracking (v1, v2, v3, etc.)
- **Expandable version history** in Projects list
- **Old versions are read-only** (display mode only)
- **Version Notes** field to capture comments for each version
- Clone projects with new project number
- Compare Versions feature for side-by-side comparison

### Project Estimator
- **Multiple project locations** from dropdown list
- Summary cards with **Avg. Selling Price per MM**
- **5 summary cards**: Total MM, Onsite MM (with avg), Offshore MM (with avg), Avg Price/MM, Selling Price
- View Summary shows avg selling price per MM for onsite and offshore separately

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

### December 2025 - Complete Feature Set

#### Master Data Pages (COMPLETE)
- [x] Dashboard with analytics (charts, metrics, notifications)
- [x] Customers management page
- [x] Technologies management page
- [x] Project Types management page
- [x] Base Locations management page (with overhead %)
- [x] Skills management page (unique records, Technology first column)
- [x] Proficiency Rates management page (unique key validation, Technology first column)

#### Project Estimator (COMPLETE)
- [x] **Multiple project locations** with add/remove badges
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
- [x] **5 Summary cards** with Avg Selling Price/MM
- [x] **Version Notes** field for each version
- [x] View Summary with avg price/MM for onsite/offshore
- [x] Export to Excel
- [x] **Responsive buttons** (visible at 100% zoom)

#### Review & Approval Workflow (COMPLETE)
- [x] Status badge display (Draft/In Review/Approved/Rejected)
- [x] Submit for Review button with email input dialog
- [x] Approve/Reject buttons for reviewers
- [x] Approval comments input
- [x] In-app notifications system
- [x] **Approved projects are read-only**

#### Version Management (COMPLETE)
- [x] Unique project numbers (PRJ-0001 format)
- [x] Version tracking (v1, v2, v3...)
- [x] **Expandable version history** in Projects list
- [x] **Old versions are read-only** with badge
- [x] **Version Notes** for each version
- [x] Clone project (resets status to draft)
- [x] New Version (same project number, increment version)
- [x] Compare Versions page

---

## Technical Architecture

### Backend (FastAPI)
- Unique validation for Skills (name + technology_id)
- Unique validation for Proficiency Rates (skill_id + base_location_id + proficiency_level)
- Project supports project_locations array
- Clone resets status to draft and clears approval fields

### Frontend (React)
- Shadcn UI components
- Tailwind CSS styling
- recharts library for charts
- XLSX library for Excel export
- React Router for navigation
- TooltipProvider for formula tooltips

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
  version_notes: string,   // Notes for this version
  is_latest_version: boolean,
  project_locations: [string],  // Multiple ISO codes
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

### P0 - High Priority (COMPLETE)
- [x] Skills unique validation + Technology first column
- [x] Proficiency Rates unique validation + Technology first column
- [x] Multiple project locations
- [x] Old versions read-only
- [x] Approved projects read-only
- [x] Version Notes field
- [x] Save button visibility at 100% zoom
- [x] Avg selling price per MM in View Summary
- [x] Avg selling price per MM in summary cards

### P1 - Medium Priority
- [ ] Email notifications (SendGrid/Resend integration)
- [ ] Project templates (save as template, create from template)
- [ ] Advanced dashboard filters (date range, customer filter)

### P2 - Low Priority
- [ ] Export to PDF
- [ ] User authentication
- [ ] Multi-currency support
- [ ] Role-based access control

---

## Test Coverage
- Test reports: `/app/test_reports/iteration_6.json`
- All 13 features tested and verified working
- Backend: 100% pass rate
- Frontend: 100% pass rate

---

## Notes
- Currency is always USD
- Travel Required is SEPARATE from Onsite
- Logistics only calculated for resources with travel_required=true
- Email notifications planned for future (currently in-app only)
- All projects default to "draft" status
- Clone resets status to draft
- Old versions and approved projects are display-only
