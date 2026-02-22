# IT/Software Project Estimator - PRD

## Original Problem Statement
Build an IT/Software Project estimator tool with comprehensive features for:
- Skills management with technology and proficiency levels
- Cost calculation based on monthly salaries, overheads, and profit margins
- Wave-based project estimation
- Logistics costs for onsite/traveling resources
- Master data management
- Summary and export capabilities

## Core Requirements

### Skills Management
- Maintain skills with technology and proficiency levels (Junior, Mid, Senior, Lead, Architect, Project Management, Delivery)

### Cost Calculation
- Calculate costs based on average monthly salary for a resource's skill and proficiency
- Add percentage-based "Overheads" cost configurable per base location (e.g., UAE: 30%)
- Add percentage-based "Profit Margin" (default 35%) to determine final selling price
- **Selling Price Formula**: `(Base Cost + Overheads) / (1 - (Profit Margin / 100))`

### Logistics Costs (Traveling Resources)
- **Travel Required toggle** per skill row to indicate if resource needs travel logistics
- Calculated at wave level for resources with `travel_required=true`
- **Formulas:**
  - Per-diems, Accommodation, Conveyance: `Traveling MM × Daily Rate × Days`
  - Air Fare, Visa & Medical: `Number of Traveling Resources × Rate × Number of Trips`
- Editable rates per wave

### Version Management
- Unique project numbers (PRJ-0001, PRJ-0002, etc.)
- Version tracking (v1, v2, v3, etc.)
- Clone projects with new project number
- Create new versions with same project number
- **Compare Versions** feature for side-by-side comparison

### Estimator Header Data
- Customer Name (from Customer Master)
- Project Location (list of countries)
- Technology (from Technology Master)
- Project Type (from Project Type Master)

### Estimator Structure
- Wave-based estimation with multiple waves per project
- Each wave has its own duration (months) and skill allocation
- Dynamic columns matching wave duration in months
- Phase names editable per column
- Custom salary override per resource/estimation
- **Onsite toggle** per resource (indicates work location)
- **Travel Required toggle** per resource (controls logistics calculation)

### Master Data Management
- **Customers**: Name, Location, City, Industry Vertical, Sub Industry Vertical
- **Technologies**: List of technologies
- **Base Locations**: Location name and overhead percentage
- **Project Types**: List of project types
- **Skills**: Name, linked technology
- **Proficiency Rates**: Skill, proficiency level, monthly salary, base location

---

## What's Been Implemented

### December 2025 - Full MVP + Travel Required Feature

#### Master Data Pages (COMPLETE)
- [x] Dashboard with overview
- [x] Customers management page
- [x] Technologies management page
- [x] Project Types management page
- [x] Base Locations management page (with overhead %)
- [x] Skills management page (linked to technologies)
- [x] Proficiency Rates management page (skill + proficiency + location + salary)

#### Project Estimator (COMPLETE)
- [x] Project header form (Customer, Name, Location, Technology, Type, Description)
- [x] Profit Margin slider (default 35%)
- [x] Wave management (Add/Delete waves)
- [x] Dynamic columns based on wave duration (months)
- [x] Editable phase names per column
- [x] Resource allocation per wave (select skill/proficiency)
- [x] **Custom salary override** when adding resource
- [x] **Onsite toggle** (amber ON/OFF) for location indicator
- [x] **Travel Required toggle** (purple YES/NO) for logistics calculation
- [x] Logistics defaults per wave (editable via dialog)
- [x] **Batch Update Logistics** button for wave-level settings
- [x] Phase effort allocation inputs
- [x] Real-time calculations:
  - Total Man-Months
  - Traveling MM (resources with travel_required=true)
  - Base Cost (salary * MM + logistics)
  - OH Cost (Base Cost * overhead %)
  - Selling Price: `Cost to Company / (1 - Profit Margin %)`
- [x] Logistics breakdown table (only shows when traveling resources exist)
- [x] Wave summary cards with Traveling resources count
- [x] View Summary dialog with project-wide breakdown
- [x] Export to Excel functionality
- [x] Save Project functionality

#### Version Management (COMPLETE)
- [x] **Unique project numbers** (PRJ-0001 format)
- [x] **Version tracking** (v1, v2, v3...)
- [x] **Clone project** - creates copy with new project number
- [x] **New Version** - increments version, same project number
- [x] **Edit project** - updates without creating new version
- [x] **Compare Versions** - side-by-side comparison of two versions

#### Saved Projects Page (COMPLETE)
- [x] List with Project #, Name, Customer, Version, Resources, Man-Months, Selling Price
- [x] **Summary button** - links to dedicated summary page
- [x] **Compare button** - links to version comparison page
- [x] **Edit button** - opens project in estimator
- [x] **Clone button** - clones project
- [x] Delete functionality

#### Compare Versions Page (NEW - COMPLETE)
- [x] Version selectors (left: baseline, right: compare)
- [x] Side-by-side comparison table
- [x] Metrics: Total MM, Onsite MM, Offshore MM, Traveling Resources, Logistics, Selling Price
- [x] Change indicators with percentages
- [x] Wave comparison section

---

## Technical Architecture

### Backend (FastAPI)
- `/api/customers` - CRUD
- `/api/technologies` - CRUD
- `/api/project-types` - CRUD
- `/api/base-locations` - CRUD
- `/api/skills` - CRUD
- `/api/proficiency-rates` - CRUD
- `/api/projects` - CRUD with wave support
- `/api/projects/{id}/clone` - Clone project
- `/api/projects/{id}/new-version` - Create new version
- `/api/projects/{id}/versions` - Get all versions

### Frontend (React)
- Shadcn UI components
- Tailwind CSS styling
- XLSX library for Excel export
- React Router for navigation

### Database (MongoDB)
- Collections: customers, technologies, project_types, base_locations, skills, proficiency_rates, projects

---

## Key Data Models

### Project
```javascript
{
  id: string,
  project_number: string,  // PRJ-0001
  version: number,         // 1, 2, 3...
  is_latest_version: boolean,
  parent_project_id: string,
  name: string,
  customer_id: string,
  customer_name: string,
  profit_margin_percentage: number,
  waves: [WaveObject],
  ...
}
```

### Wave Grid Allocation
```javascript
{
  id: string,
  skill_id: string,
  avg_monthly_salary: number,  // Can override master rate
  original_monthly_salary: number,
  is_onsite: boolean,          // Work location indicator
  travel_required: boolean,    // Controls logistics calculation
  phase_allocations: {},
  ...
}
```

### Wave Logistics Config (wave level)
```javascript
{
  per_diem_daily: number,
  per_diem_days: number,
  accommodation_daily: number,
  accommodation_days: number,
  local_conveyance_daily: number,
  local_conveyance_days: number,
  flight_cost_per_trip: number,
  visa_medical_per_trip: number,
  num_trips: number,
  contingency_percentage: number
}
```

---

## Prioritized Backlog

### P0 - High Priority (COMPLETE)
- [x] Travel Required toggle per skill row
- [x] Logistics calculations at wave level for traveling resources
- [x] Compare Versions feature

### P1 - Medium Priority
- [ ] Batch update logistics for all traveling resources in wave (UI exists, enhance UX)
- [ ] Project templates (save as template, create from template)
- [ ] Dashboard analytics (total projects, revenue, charts)

### P2 - Low Priority
- [ ] Export to PDF
- [ ] Email estimate to customer
- [ ] User authentication
- [ ] Multi-currency support

### Future Enhancements
- [ ] Integration with external systems
- [ ] Approval workflow
- [ ] Resource availability tracking

---

## Test Data Available
- **Customers**: Saif Al Ghurair (UAE)
- **Technologies**: SAP S/4HANA, SAP SF, PMO
- **Base Locations**: UAE (30%), India (30%), KSA (20%), Egypt (25%), Qatar (20%)
- **Skills**: Finance (SAP S/4HANA), Project Manager (PMO), Delivery Manager (PMO)
- **Test Projects**: PRJ-0001, PRJ-0002, PRJ-0003 (TravelRequired test)

---

## Notes
- Currency is always USD
- Travel Required is SEPARATE from Onsite (can be set independently)
- Logistics only calculated for resources with travel_required=true
- Compare Versions includes Traveling Resources metric
- Wave-based structure fully supports multiple waves per project
- Legacy projects (without project_number) are supported
- Print styles optimized for A4 layout

---

## Test Coverage
- Backend tests: `/app/backend/tests/test_travel_required.py`
- Test reports: `/app/test_reports/iteration_4.json`
