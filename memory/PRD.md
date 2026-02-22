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
- Summary and export capabilities

## Core Requirements

### Skills Management
- Maintain skills with technology and proficiency levels (Junior, Mid, Senior, Lead, Architect, Project Management, Delivery)

### Cost Calculation
- Calculate costs based on average monthly salary for a resource's skill and proficiency
- Add percentage-based "Overheads" cost configurable per base location
- Add percentage-based "Profit Margin" (default 35%) to determine final selling price
- **Selling Price Formula**: `(Base Cost + Overheads) / (1 - (Profit Margin / 100))`

### Logistics Costs (Traveling Resources)
- **Travel Required toggle** per skill row to indicate if resource needs travel logistics
- Calculated at wave level for resources with `travel_required=true`
- **Formulas (visible in tooltip on hover)**:
  - Per-diems, Accommodation, Conveyance: `Traveling MM × Daily Rate × Days`
  - Air Fare, Visa & Medical: `Number of Traveling Resources × Rate × Number of Trips`
- Editable rates per wave

### Review & Approval Workflow (NEW)
- **Status Flow**: Draft → In Review → Approved/Rejected
- Submit for Review with approver email
- Approver can Approve or Reject with comments
- Approver can edit and create new version with changes
- In-app notifications for all approval events

### Version Management
- Unique project numbers (PRJ-0001, PRJ-0002, etc.)
- Version tracking (v1, v2, v3, etc.)
- **Expandable version history** in Projects list
- Clone projects with new project number
- Create new versions with same project number
- **Compare Versions** feature for side-by-side comparison

### Dashboard Analytics (NEW)
- Total Projects count
- Total Revenue (sum of all project selling prices)
- Approved/In Review counts
- Projects by Status pie chart
- Revenue Trend line chart
- Top Customers by Revenue bar chart
- Recent Notifications panel

---

## What's Been Implemented

### December 2025 - Full MVP + Complete Feature Set

#### Master Data Pages (COMPLETE)
- [x] Dashboard with analytics (charts, metrics, notifications)
- [x] Customers management page
- [x] Technologies management page
- [x] Project Types management page
- [x] Base Locations management page (with overhead %)
- [x] Skills management page (linked to technologies)
- [x] Proficiency Rates management page

#### Project Estimator (COMPLETE)
- [x] Project header form (Customer, Name, Location, Technology, Type, Description)
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
- [x] Logistics breakdown table (shows when traveling resources exist)
- [x] Wave summary with Traveling resources count
- [x] View Summary dialog
- [x] Export to Excel

#### Review & Approval Workflow (COMPLETE)
- [x] Status badge display (Draft/In Review/Approved/Rejected)
- [x] Submit for Review button with email input dialog
- [x] Approve/Reject buttons for reviewers
- [x] Approval comments input
- [x] In-app notifications system
- [x] Notification panel in Dashboard

#### Version Management (COMPLETE)
- [x] Unique project numbers (PRJ-0001 format)
- [x] Version tracking (v1, v2, v3...)
- [x] **Expandable version history** in Projects list
- [x] Clone project (new project number)
- [x] New Version (same project number, increment version)
- [x] Edit project (update without new version)
- [x] Compare Versions page

#### Dashboard (COMPLETE)
- [x] Total Projects card
- [x] Total Revenue card
- [x] Approved/In Review count cards
- [x] Projects by Status pie chart (recharts)
- [x] Revenue Trend line chart (recharts)
- [x] Top Customers by Revenue bar chart (recharts)
- [x] Recent Notifications panel
- [x] Quick Actions buttons

---

## Technical Architecture

### Backend (FastAPI)
- `/api/customers`, `/api/technologies`, `/api/project-types`, `/api/base-locations`, `/api/skills`, `/api/proficiency-rates` - CRUD
- `/api/projects` - CRUD with wave support
- `/api/projects/{id}/clone` - Clone project
- `/api/projects/{id}/versions` - Get all versions
- `/api/projects/{id}/submit-for-review` - Submit for approval
- `/api/projects/{id}/approve` - Approve project
- `/api/projects/{id}/reject` - Reject project
- `/api/notifications` - Get/manage notifications
- `/api/dashboard/analytics` - Get dashboard data

### Frontend (React)
- Shadcn UI components
- Tailwind CSS styling
- recharts library for charts
- XLSX library for Excel export
- React Router for navigation

### Database (MongoDB)
- Collections: customers, technologies, project_types, base_locations, skills, proficiency_rates, projects, notifications

---

## Key Data Models

### Project
```javascript
{
  id: string,
  project_number: string,  // PRJ-0001
  version: number,         // 1, 2, 3...
  is_latest_version: boolean,
  name: string,
  status: string,          // draft, in_review, approved, rejected
  approver_email: string,
  approval_comments: string,
  waves: [WaveObject],
  ...
}
```

### Wave Grid Allocation
```javascript
{
  id: string,
  skill_id: string,
  avg_monthly_salary: number,
  is_onsite: boolean,          // Work location indicator
  travel_required: boolean,    // Controls logistics calculation
  phase_allocations: {},
  ...
}
```

### Notification
```javascript
{
  id: string,
  user_email: string,
  type: string,      // review_request, approved, rejected
  title: string,
  message: string,
  project_id: string,
  project_number: string,
  is_read: boolean,
  created_at: datetime
}
```

---

## Prioritized Backlog

### P0 - High Priority (COMPLETE)
- [x] Travel Required toggle per skill row
- [x] Logistics calculations at wave level
- [x] Compare Versions feature
- [x] Expandable version history
- [x] Review & Approval workflow
- [x] Dashboard analytics
- [x] Formula tooltip on Travel toggle

### P1 - Medium Priority
- [ ] Email notifications (SendGrid/Resend integration)
- [ ] Project templates (save as template, create from template)
- [ ] Advanced dashboard filters (date range, customer filter)

### P2 - Low Priority
- [ ] Export to PDF
- [ ] User authentication
- [ ] Multi-currency support
- [ ] Role-based access control

### Future Enhancements
- [ ] Integration with external systems
- [ ] Multi-level approval workflow
- [ ] Resource availability tracking
- [ ] Mobile responsive improvements

---

## Test Coverage
- Test files: `/app/backend/tests/test_new_features.py`
- Test reports: `/app/test_reports/iteration_5.json`
- All 12 new features tested and verified working

---

## Notes
- Currency is always USD
- Travel Required is SEPARATE from Onsite
- Logistics only calculated for resources with travel_required=true
- Email notifications planned for future (currently in-app only)
- All projects default to "draft" status
- Approver can edit and create new versions
