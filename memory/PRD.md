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

### Cost Calculation
- Calculate costs based on average monthly salary for a resource's skill and proficiency
- Add percentage-based "Overheads" cost configurable per base location
- Add percentage-based "Profit Margin" (default 35%) to determine final selling price
- **Row Selling Price Formula**: `(Salary Cost + Overhead) / (1 - Profit Margin %)`
- **Wave Selling Price** = Sum of all row selling prices + Logistics Selling Price Markup
- **Total Selling Price** = Sum of all wave selling prices
- **Onsite/Offshore Selling Price** split by `is_onsite` flag
- **Avg $/MM** = Selling Price / Man-Months for each category
- **Nego Buffer NOT included** in Average $/MM calculations

### Logistics Costs (Traveling Resources)
- **Travel Required toggle** per skill row
- Calculated at wave level for resources with `travel_required=true`
- Formulas: Per-diems/Accommodation/Conveyance per MM, Flights/Visa per resource per trip

### Review & Approval Workflow
- Status Flow: Draft -> In Review -> Approved/Rejected
- Submit for Review with approver selection
- In-app + email notifications for all workflow events
- Read-only mode for approved/in-review projects

### Version Management
- Unique project numbers (PRJ-0001), version tracking (v1, v2, v3)
- Version notes mandatory on update
- Clone projects, Compare versions side-by-side

### Project Estimator
- Multiple locations, technologies, project types via multi-select
- **Sales Manager** dropdown for project assignment
- Inline grid editing with auto salary lookup
- 6 summary KPI cards
- Excel export with all fields including Sales Manager

### Dashboard Analytics
- Total Projects, Total Value of Estimations, Approved, In Review counts
- **Value by Status breakdown** (Draft, In Review, Approved, Rejected values)
- **Multi-select filters**: Date range, Customer, Project Type, Location, Sales Manager
- Projects by Status pie chart, Estimation Value Trend line chart
- Top Customers by Value, By Technology, By Project Type, By Location, By Sales Manager charts
- **Sales Manager Performance Leaderboard** with approval rates
- Recent Notifications panel

---

## Technical Architecture

### Backend (FastAPI)
- server.py: All routes, models, business logic
- JWT Authentication (HS256, 24hr expiration)
- MongoDB via motor (async)
- SMTP email integration (configurable)

### Frontend (React)
- Shadcn UI components, Tailwind CSS
- recharts for charts, XLSX for Excel
- React Router, Context API
- **Shared calculations utility**: `/src/utils/calculations.js`

### Database (MongoDB)
- Collections: customers, technologies, project_types, base_locations, skills, proficiency_rates, projects, notifications, audit_logs, sales_managers, users

---

## Prioritized Backlog

### P0 - ALL COMPLETE

### P1 - ALL COMPLETE
- [x] Sales Manager CRUD + Estimator integration
- [x] Dashboard KPIs (Technology, Project Type, Location, Sales Manager)
- [x] Notification Bell with unread count
- [x] Dashboard multi-select filters (Project Type, Location, Sales Manager)
- [x] Value by Status breakdown on dashboard
- [x] Sales Manager Leaderboard
- [x] Excel export includes Sales Manager
- [x] Shared financial calculation utility extracted

### P2 - Low Priority
- [ ] User Profile - Custom Theme (upload background image)
- [ ] Export to PDF
- [ ] Multi-currency support
- [ ] SMTP configuration for email notifications

---

## Test Coverage
- Iteration 13: `/app/test_reports/iteration_13.json` - Sales Manager CRUD, Dashboard KPIs, Notification Bell (100% pass)
- Iteration 14: `/app/test_reports/iteration_14.json` - Value by Status, Leaderboard, Multi-select filters, Excel exports, Shared calcs (100% pass)

---

## Notes
- Currency is always USD
- SMTP not configured - emails skipped with warning
- Sales Manager dropdown shows only active managers
- Leaderboard only displays when sales_manager_leaderboard has data
- Financial calcs centralized in `/src/utils/calculations.js`, used by ProjectSummary; ProjectEstimator still uses local functions (same logic)
