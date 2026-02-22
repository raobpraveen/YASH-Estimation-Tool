# IT/Software Project Estimator - PRD

## Original Problem Statement
Build an IT/Software Project estimator tool with comprehensive features for:
- Skills management with technology and proficiency levels
- Cost calculation based on monthly salaries, overheads, and profit margins
- Wave-based project estimation
- Logistics costs for onsite resources
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

### Logistics Costs (Onsite Resources)
- Per-diems: default $50/day
- Accommodation: default $80/day
- Local conveyance: default $20/day for 21 days
- Visa & insurance: combined field
- Flights: based on user-entered rate and number of trips

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

### Master Data Management
- **Customers**: Name, Location, City, Industry Vertical, Sub Industry Vertical
- **Technologies**: List of technologies
- **Base Locations**: Location name and overhead percentage
- **Project Types**: List of project types
- **Skills**: Name, linked technology
- **Proficiency Rates**: Skill, proficiency level, monthly salary, base location

---

## What's Been Implemented

### December 2025 - Full MVP Completion

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
- [x] Onsite/Offshore toggle with automatic logistics application
- [x] Logistics defaults per wave (editable via dialog)
- [x] Phase effort allocation inputs
- [x] Real-time calculations:
  - Total Man-Months
  - Base Cost (salary * MM + logistics)
  - OH Cost (Base Cost * overhead %)
  - Selling Price: `Cost to Company / (1 - Profit Margin %)`
- [x] Wave summary cards
- [x] View Summary dialog with project-wide breakdown
- [x] Export to Excel functionality
- [x] Save Project functionality

#### Saved Projects Page (COMPLETE)
- [x] List all saved projects with resource count and selling price
- [x] View project details dialog showing waves and resources
- [x] Delete project functionality
- [x] Correct calculation display for wave-based structure

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

### Frontend (React)
- Shadcn UI components
- Tailwind CSS styling
- XLSX library for Excel export

### Database (MongoDB)
- Collections: customers, technologies, project_types, base_locations, skills, proficiency_rates, projects

---

## Prioritized Backlog

### P0 - High Priority
- [ ] Project Summary Screen (standalone page with print-friendly layout)

### P1 - Medium Priority
- [ ] Edit existing project estimates
- [ ] Clone project functionality
- [ ] Version history for projects

### P2 - Low Priority
- [ ] Export to PDF
- [ ] Email estimate to customer
- [ ] Dashboard analytics (total projects, revenue estimates)

### Future Enhancements
- [ ] Refactor ProjectEstimator.js into smaller components
- [ ] Authentication and user management
- [ ] Multi-currency support
- [ ] Integration with external systems

---

## Test Data Available
- **Customer**: Saif Al Ghurair (UAE)
- **Technologies**: SAP S/4HANA, SAP SF, PMO
- **Base Locations**: UAE (30%), India (30%), KSA (20%), Egypt (25%), Qatar (20%)
- **Skills**: Finance (SAP S/4HANA), Project Manager (PMO), Delivery Manager (PMO)
- **Proficiency Rates**: Various combinations available

---

## Notes
- Currency is always USD
- All calculations verified with testing agent
- Wave-based structure fully supports multiple waves per project
