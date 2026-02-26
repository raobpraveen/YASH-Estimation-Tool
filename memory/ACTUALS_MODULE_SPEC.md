# Actuals Tracking & Profitability Module — Design Spec

## Status: PLANNED (Not yet implemented)
## Created: Feb 26, 2026

---

## Overview
Track actual resource deployments against approved estimates, measure project profitability in real-time, and provide month-on-month progressive forecasts.

---

## Phase 1 — Foundation

### 1. Multi-Role User Management
- Allow multiple roles per user (Admin, Approver, Project Manager, Delivery Manager)
- New roles: "project_manager", "delivery_manager"
- User management UI updated for multi-select role assignment
- RBAC updated across all endpoints

### 2. Business Group & Business Unit Master Data
- **Hierarchical**: Business Group > Business Unit (Delivery Unit)
- Business Group CRUD: name, code, description, is_active
- Business Unit CRUD: name, code, business_group_id (FK), description, is_active
- Sidebar navigation entries under Master Data

### 3. Resource Master
- Fields: Name, Employee ID, Email, BG/BU assignment, Base Location, Skill, Proficiency Level
- **Salary History**: Array of {amount, effective_from, effective_to} — supports mid-project appraisals
- Current salary = latest entry where today is between effective_from and effective_to
- Resource status: Active / Inactive / On Bench

### 4. Add BG/BU to Project
- Business Group + Business Unit dropdowns on Estimator page
- Saved with project data

---

## Phase 2 — Actuals Tracking Core

### 5. Actuals Tab on Project
- New "Actuals" tab on approved projects (alongside existing Summary/Audit tabs)
- Monthly entry grid per wave
- Only accessible by Project Manager, Delivery Manager, Admin roles

### 6. Resource Deployment (Actuals Grid)
- Each row links to an estimated skill row (or flagged as "Unplanned")
- Fields per actual row:
  - Linked Estimated Row ID
  - Resource (from Resource Master)
  - Actual Base Location (auto from Resource Master)
  - Actual Overhead % (auto-fetched from Base Location master)
  - Actual Monthly Salary (auto from Resource Master salary history based on month)
  - Monthly Allocation: month-by-month actual MM (0, 0.5, 1.0)
  - Deployment Period: start_date, end_date
  - Status: Active / Replaced / Released
  - Business Unit (from Resource Master)

### 7. Resource Change History
- When replacing a resource mid-project:
  - Original row status → "Replaced", end_date set
  - New row created, linked to same estimated skill row, start_date set
  - Full change history preserved with timestamps and user who made the change
- UI shows timeline: "John (UAE, $8K) → Ahmed (Egypt, $6K) from Month 4"

### 8. Unplanned Resources
- PM can add actual rows not mapped to any estimated row
- Flagged as "Unplanned" with visual indicator (orange badge)
- Counted separately in variance analysis

### 9. Contract Price Editor
- Editable selling price field on project actuals page
- Change log: [{old_value, new_value, changed_by, changed_at, reason}]
- Default = approved estimate selling price

---

## Phase 3 — Analytics & Forecasting

### 10. Project Profitability View
| Metric | Formula |
|---|---|
| Estimated Cost | From approved estimate (salary + overhead) |
| Actual Cost to Date | Sum(Actual Salary × Actual MM) + Sum(Actual Overhead) per month |
| Contract Value | Current selling price (may be edited) |
| Estimated Profit | Contract Value - Estimated Cost |
| Actual Profit to Date | Contract Value (prorated to current month) - Actual Cost to Date |
| Cost Variance | Actual Cost - Estimated Cost (red if positive = over budget) |
| Forecast at Completion (EAC) | Actual Cost to Date + Estimate to Complete |
| Estimate to Complete (ETC) | Remaining months × current actual burn rate |

### 11. Month-on-Month Progressive Forecast Chart
- **Blue line**: Estimated cumulative cost (planned burn from approved estimate)
- **Green line (Optimistic)**: Actual cost to date + remaining months at original estimated rates
- **Red line (Realistic)**: Actual cost to date + remaining months at current actual burn rate
- Visual threshold alerts when actual exceeds estimate by >5%, >10%

### 12. Resource Utilization Tracking
- Per resource: % of total available time allocated to projects
- Utilization = (Total allocated MM across all projects / Total available MM) × 100
- Dashboard view: utilization heatmap by BG/BU
- Drill-down to see which projects a resource is assigned to

### 13. Bench Forecasting
- Identify resources not assigned to any current or future project
- Forecast bench based on project end dates
- "Upcoming Available" report: resources becoming free in next 1/2/3 months
- Filter by BG, BU, Skill, Location

---

## Data Model Summary

### New Collections
- `business_groups`: {name, code, description, is_active}
- `business_units`: {name, code, business_group_id, description, is_active}
- `resources`: {name, employee_id, email, business_group_id, business_unit_id, base_location, skill_id, proficiency_level, salary_history: [{amount, effective_from, effective_to}], status}
- `project_actuals`: {project_id, wave_id, month, entries: [{estimated_row_id, resource_id, actual_location, actual_overhead_pct, actual_salary, actual_mm, status, is_unplanned}]}
- `contract_price_log`: {project_id, old_value, new_value, changed_by, changed_at, reason}

### Modified Collections
- `users`: roles field changed from string to array of strings
- `projects`: added business_group_id, business_unit_id, contract_value

---

## Key Design Decisions
- Overhead % always auto-fetched from Base Location master (not editable per resource)
- Salary uses Resource Master salary history with effective dates (supports mid-project appraisals)
- Actuals entry is monthly-based
- Forecasting shows both optimistic (original rates) and realistic (actual burn rate) lines
- Only PM, DM, Admin roles can enter actuals
