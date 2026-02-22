from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict
import uuid
from datetime import datetime, timezone


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")


# Models for Customers
class Customer(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    location: str  # ISO country code
    location_name: str
    city: str = ""
    industry_vertical: str = ""
    sub_industry_vertical: str = ""
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class CustomerCreate(BaseModel):
    name: str
    location: str
    location_name: str
    city: str = ""
    industry_vertical: str = ""
    sub_industry_vertical: str = ""


# Models for Technologies
class Technology(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: Optional[str] = ""
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class TechnologyCreate(BaseModel):
    name: str
    description: Optional[str] = ""


# Models for Project Types
class ProjectType(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ProjectTypeCreate(BaseModel):
    name: str


# Models for Base Locations
class BaseLocation(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    overhead_percentage: float
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class BaseLocationCreate(BaseModel):
    name: str
    overhead_percentage: float


# Models for Skills
class Skill(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    technology_id: str
    technology_name: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class SkillCreate(BaseModel):
    name: str
    technology_id: str
    technology_name: str


# Models for Proficiency Rates
class ProficiencyRate(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    skill_id: str
    skill_name: str
    technology_id: str
    technology_name: str
    base_location_id: str
    base_location_name: str
    proficiency_level: str
    avg_monthly_salary: float
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ProficiencyRateCreate(BaseModel):
    skill_id: str
    skill_name: str
    technology_id: str
    technology_name: str
    base_location_id: str
    base_location_name: str
    proficiency_level: str
    avg_monthly_salary: float


# Models for Wave Grid Allocation
class WaveGridAllocation(BaseModel):
    id: str = ""
    skill_id: str
    skill_name: str
    proficiency_level: str
    avg_monthly_salary: float  # Can be overridden per estimation
    original_monthly_salary: float = 0  # Original rate from master
    base_location_id: str
    base_location_name: str
    overhead_percentage: float
    is_onsite: bool = False
    travel_required: bool = False  # Indicates if travel logistics apply
    phase_allocations: Dict[str, float] = {}
    # Logistics costs - editable per resource (legacy fields, now calculated at wave level)
    per_diem_daily: float = 50
    per_diem_days: int = 30
    accommodation_daily: float = 80
    accommodation_days: int = 30
    local_conveyance_daily: float = 20
    local_conveyance_days: int = 21
    flight_cost_per_trip: float = 0
    visa_insurance_per_trip: float = 0
    num_trips: int = 0


# Models for Project Waves
class ProjectWave(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    duration_months: float
    phase_names: List[str] = []  # User-defined phase names per month/column
    logistics_defaults: Dict[str, float] = {}  # Default logistics for wave
    grid_allocations: List[WaveGridAllocation] = []


# Models for Projects
class Project(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    project_number: str = ""  # Unique project number like PRJ-0001
    version: int = 1  # Version number for tracking changes
    version_notes: str = ""  # Notes for this version
    name: str
    customer_id: str = ""
    customer_name: str = ""
    project_location: str = ""  # ISO country code (legacy single location)
    project_location_name: str = ""
    project_locations: List[str] = []  # Multiple ISO country codes
    project_location_names: List[str] = []  # Multiple location names
    technology_id: str = ""
    technology_name: str = ""
    project_type_id: str = ""
    project_type_name: str = ""
    description: Optional[str] = ""
    profit_margin_percentage: float = 35.0
    waves: List[ProjectWave] = []
    is_latest_version: bool = True  # Flag to identify latest version
    parent_project_id: str = ""  # For version tracking - links to original project
    # Approval workflow fields
    status: str = "draft"  # draft, in_review, approved, rejected
    approver_email: str = ""
    approval_comments: str = ""
    submitted_at: Optional[str] = None
    approved_at: Optional[str] = None
    submitted_by: str = ""
    approved_by: str = ""
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ProjectCreate(BaseModel):
    name: str
    customer_id: str = ""
    customer_name: str = ""
    project_location: str = ""
    project_location_name: str = ""
    project_locations: List[str] = []
    project_location_names: List[str] = []
    technology_id: str = ""
    technology_name: str = ""
    project_type_id: str = ""
    project_type_name: str = ""
    description: Optional[str] = ""
    profit_margin_percentage: float = 35.0
    waves: Optional[List[Dict]] = None
    status: str = "draft"
    approver_email: str = ""

class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    customer_id: Optional[str] = None
    customer_name: Optional[str] = None
    project_location: Optional[str] = None
    project_location_name: Optional[str] = None
    project_locations: Optional[List[str]] = None
    project_location_names: Optional[List[str]] = None
    technology_id: Optional[str] = None
    technology_name: Optional[str] = None
    project_type_id: Optional[str] = None
    project_type_name: Optional[str] = None
    description: Optional[str] = None
    profit_margin_percentage: Optional[float] = None
    waves: Optional[List[Dict]] = None
    version_notes: Optional[str] = None
    status: Optional[str] = None
    approver_email: Optional[str] = None
    approval_comments: Optional[str] = None

# Notification model
class Notification(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_email: str  # Who receives the notification
    type: str  # review_request, approved, rejected, revision_needed
    title: str
    message: str
    project_id: str
    project_number: str
    is_read: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


# Customers Routes
@api_router.post("/customers", response_model=Customer)
async def create_customer(input: CustomerCreate):
    customer_obj = Customer(**input.model_dump())
    doc = customer_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.customers.insert_one(doc)
    return customer_obj

@api_router.get("/customers", response_model=List[Customer])
async def get_customers():
    customers = await db.customers.find({}, {"_id": 0}).to_list(1000)
    for customer in customers:
        if isinstance(customer['created_at'], str):
            customer['created_at'] = datetime.fromisoformat(customer['created_at'])
    return customers

@api_router.delete("/customers/{customer_id}")
async def delete_customer(customer_id: str):
    result = await db.customers.delete_one({"id": customer_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Customer not found")
    return {"message": "Customer deleted successfully"}


# Technologies Routes
@api_router.post("/technologies", response_model=Technology)
async def create_technology(input: TechnologyCreate):
    tech_obj = Technology(**input.model_dump())
    doc = tech_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.technologies.insert_one(doc)
    return tech_obj

@api_router.get("/technologies", response_model=List[Technology])
async def get_technologies():
    technologies = await db.technologies.find({}, {"_id": 0}).to_list(1000)
    for tech in technologies:
        if isinstance(tech['created_at'], str):
            tech['created_at'] = datetime.fromisoformat(tech['created_at'])
    return technologies

@api_router.delete("/technologies/{tech_id}")
async def delete_technology(tech_id: str):
    result = await db.technologies.delete_one({"id": tech_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Technology not found")
    return {"message": "Technology deleted successfully"}


# Project Types Routes
@api_router.post("/project-types", response_model=ProjectType)
async def create_project_type(input: ProjectTypeCreate):
    type_obj = ProjectType(**input.model_dump())
    doc = type_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.project_types.insert_one(doc)
    return type_obj

@api_router.get("/project-types", response_model=List[ProjectType])
async def get_project_types():
    types = await db.project_types.find({}, {"_id": 0}).to_list(1000)
    for ptype in types:
        if isinstance(ptype['created_at'], str):
            ptype['created_at'] = datetime.fromisoformat(ptype['created_at'])
    return types

@api_router.delete("/project-types/{type_id}")
async def delete_project_type(type_id: str):
    result = await db.project_types.delete_one({"id": type_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Project type not found")
    return {"message": "Project type deleted successfully"}


# Base Locations Routes
@api_router.post("/base-locations", response_model=BaseLocation)
async def create_base_location(input: BaseLocationCreate):
    location_obj = BaseLocation(**input.model_dump())
    doc = location_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.base_locations.insert_one(doc)
    return location_obj

@api_router.get("/base-locations", response_model=List[BaseLocation])
async def get_base_locations():
    locations = await db.base_locations.find({}, {"_id": 0}).to_list(1000)
    for location in locations:
        if isinstance(location['created_at'], str):
            location['created_at'] = datetime.fromisoformat(location['created_at'])
    return locations

@api_router.delete("/base-locations/{location_id}")
async def delete_base_location(location_id: str):
    result = await db.base_locations.delete_one({"id": location_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Base location not found")
    return {"message": "Base location deleted successfully"}


# Skills Routes
@api_router.post("/skills", response_model=Skill)
async def create_skill(input: SkillCreate):
    # Check for duplicate: same skill name + technology combination
    existing = await db.skills.find_one({
        "name": input.name,
        "technology_id": input.technology_id
    }, {"_id": 0})
    if existing:
        raise HTTPException(
            status_code=400, 
            detail=f"Skill '{input.name}' already exists for this technology"
        )
    
    skill_obj = Skill(**input.model_dump())
    doc = skill_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.skills.insert_one(doc)
    return skill_obj

@api_router.get("/skills", response_model=List[Skill])
async def get_skills():
    skills = await db.skills.find({}, {"_id": 0}).to_list(1000)
    for skill in skills:
        if isinstance(skill['created_at'], str):
            skill['created_at'] = datetime.fromisoformat(skill['created_at'])
    return skills

@api_router.delete("/skills/{skill_id}")
async def delete_skill(skill_id: str):
    result = await db.skills.delete_one({"id": skill_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Skill not found")
    await db.proficiency_rates.delete_many({"skill_id": skill_id})
    return {"message": "Skill deleted successfully"}


# Proficiency Rates Routes
@api_router.post("/proficiency-rates", response_model=ProficiencyRate)
async def create_proficiency_rate(input: ProficiencyRateCreate):
    # Check for duplicate: Technology + Skill + Base Location + Proficiency Level
    existing = await db.proficiency_rates.find_one({
        "skill_id": input.skill_id,
        "base_location_id": input.base_location_id,
        "proficiency_level": input.proficiency_level
    }, {"_id": 0})
    if existing:
        raise HTTPException(
            status_code=400, 
            detail=f"Rate already exists for this Skill, Location, and Proficiency Level combination"
        )
    
    rate_obj = ProficiencyRate(**input.model_dump())
    doc = rate_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.proficiency_rates.insert_one(doc)
    return rate_obj

@api_router.get("/proficiency-rates", response_model=List[ProficiencyRate])
async def get_proficiency_rates():
    rates = await db.proficiency_rates.find({}, {"_id": 0}).to_list(1000)
    for rate in rates:
        if isinstance(rate['created_at'], str):
            rate['created_at'] = datetime.fromisoformat(rate['created_at'])
    return rates

@api_router.delete("/proficiency-rates/{rate_id}")
async def delete_proficiency_rate(rate_id: str):
    result = await db.proficiency_rates.delete_one({"id": rate_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Proficiency rate not found")
    return {"message": "Proficiency rate deleted successfully"}


# Projects Routes
async def generate_project_number():
    """Generate a unique project number like PRJ-0001"""
    last_project = await db.projects.find_one(
        {"project_number": {"$regex": "^PRJ-"}},
        {"project_number": 1},
        sort=[("project_number", -1)]
    )
    if last_project and last_project.get("project_number"):
        try:
            last_num = int(last_project["project_number"].split("-")[1])
            return f"PRJ-{str(last_num + 1).zfill(4)}"
        except (ValueError, IndexError):
            pass
    return "PRJ-0001"

@api_router.post("/projects", response_model=Project)
async def create_project(input: ProjectCreate):
    project_number = await generate_project_number()
    project_data = input.model_dump()
    project_data["project_number"] = project_number
    project_data["version"] = 1
    project_data["is_latest_version"] = True
    # Ensure waves is a list (can be None from input)
    if project_data.get("waves") is None:
        project_data["waves"] = []
    project_obj = Project(**project_data)
    doc = project_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    doc['updated_at'] = doc['updated_at'].isoformat()
    await db.projects.insert_one(doc)
    return project_obj

@api_router.get("/projects", response_model=List[Project])
async def get_projects(latest_only: bool = True):
    # Handle legacy data: show projects where is_latest_version is True OR not set
    if latest_only:
        query = {"$or": [{"is_latest_version": True}, {"is_latest_version": {"$exists": False}}]}
    else:
        query = {}
    projects = await db.projects.find(query, {"_id": 0}).to_list(1000)
    for project in projects:
        if isinstance(project.get('created_at'), str):
            project['created_at'] = datetime.fromisoformat(project['created_at'])
        if isinstance(project.get('updated_at'), str):
            project['updated_at'] = datetime.fromisoformat(project['updated_at'])
    return projects

@api_router.get("/projects/{project_id}", response_model=Project)
async def get_project(project_id: str):
    project = await db.projects.find_one({"id": project_id}, {"_id": 0})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    if isinstance(project.get('created_at'), str):
        project['created_at'] = datetime.fromisoformat(project['created_at'])
    if isinstance(project.get('updated_at'), str):
        project['updated_at'] = datetime.fromisoformat(project['updated_at'])
    return project

@api_router.get("/projects/{project_id}/versions", response_model=List[Project])
async def get_project_versions(project_id: str):
    """Get all versions of a project"""
    project = await db.projects.find_one({"id": project_id}, {"_id": 0})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Find the root project number
    project_number = project.get("project_number", "")
    if not project_number:
        return [project]
    
    # Get all versions with same project number
    versions = await db.projects.find(
        {"project_number": project_number},
        {"_id": 0}
    ).sort("version", -1).to_list(100)
    
    for v in versions:
        if isinstance(v.get('created_at'), str):
            v['created_at'] = datetime.fromisoformat(v['created_at'])
        if isinstance(v.get('updated_at'), str):
            v['updated_at'] = datetime.fromisoformat(v['updated_at'])
    return versions

@api_router.put("/projects/{project_id}", response_model=Project)
async def update_project(project_id: str, input: ProjectUpdate):
    existing = await db.projects.find_one({"id": project_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Project not found")
    
    update_data = input.model_dump(exclude_unset=True)
    update_data['updated_at'] = datetime.now(timezone.utc).isoformat()
    
    await db.projects.update_one({"id": project_id}, {"$set": update_data})
    
    updated = await db.projects.find_one({"id": project_id}, {"_id": 0})
    if isinstance(updated.get('created_at'), str):
        updated['created_at'] = datetime.fromisoformat(updated['created_at'])
    if isinstance(updated.get('updated_at'), str):
        updated['updated_at'] = datetime.fromisoformat(updated['updated_at'])
    return updated

@api_router.post("/projects/{project_id}/new-version", response_model=Project)
async def create_new_version(project_id: str, input: ProjectUpdate):
    """Create a new version of an existing project"""
    existing = await db.projects.find_one({"id": project_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Mark current as not latest
    await db.projects.update_one(
        {"id": project_id},
        {"$set": {"is_latest_version": False, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    # Get current max version for this project number
    project_number = existing.get("project_number", "")
    max_version = await db.projects.find_one(
        {"project_number": project_number},
        {"version": 1},
        sort=[("version", -1)]
    )
    new_version = (max_version.get("version", 1) if max_version else 1) + 1
    
    # Create new version
    new_project_data = {**existing}
    new_project_data["id"] = str(uuid.uuid4())
    new_project_data["version"] = new_version
    new_project_data["is_latest_version"] = True
    new_project_data["parent_project_id"] = project_id
    new_project_data["created_at"] = datetime.now(timezone.utc)
    new_project_data["updated_at"] = datetime.now(timezone.utc)
    
    # Apply updates
    update_data = input.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        if value is not None:
            new_project_data[key] = value
    
    project_obj = Project(**new_project_data)
    doc = project_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    doc['updated_at'] = doc['updated_at'].isoformat()
    await db.projects.insert_one(doc)
    return project_obj

@api_router.post("/projects/{project_id}/clone", response_model=Project)
async def clone_project(project_id: str):
    """Clone a project as a new project with new project number"""
    existing = await db.projects.find_one({"id": project_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Generate new project number
    new_project_number = await generate_project_number()
    
    # Create cloned project
    cloned_data = {**existing}
    cloned_data["id"] = str(uuid.uuid4())
    cloned_data["project_number"] = new_project_number
    cloned_data["version"] = 1
    cloned_data["is_latest_version"] = True
    cloned_data["parent_project_id"] = ""
    cloned_data["name"] = f"{existing.get('name', 'Project')} (Copy)"
    cloned_data["created_at"] = datetime.now(timezone.utc)
    cloned_data["updated_at"] = datetime.now(timezone.utc)
    
    project_obj = Project(**cloned_data)
    doc = project_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    doc['updated_at'] = doc['updated_at'].isoformat()
    await db.projects.insert_one(doc)
    return project_obj

@api_router.delete("/projects/{project_id}")
async def delete_project(project_id: str):
    result = await db.projects.delete_one({"id": project_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Project not found")
    return {"message": "Project deleted successfully"}


# Submit project for review
@api_router.post("/projects/{project_id}/submit-for-review")
async def submit_for_review(project_id: str, approver_email: str):
    project = await db.projects.find_one({"id": project_id}, {"_id": 0})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    if not approver_email:
        raise HTTPException(status_code=400, detail="Approver email is required")
    
    update_data = {
        "status": "in_review",
        "approver_email": approver_email,
        "submitted_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.projects.update_one({"id": project_id}, {"$set": update_data})
    
    # Create notification for approver
    notification = Notification(
        user_email=approver_email,
        type="review_request",
        title="New Project Review Request",
        message=f"Project {project.get('project_number', '')} '{project.get('name', '')}' has been submitted for your review.",
        project_id=project_id,
        project_number=project.get("project_number", "")
    )
    notif_doc = notification.model_dump()
    notif_doc['created_at'] = notif_doc['created_at'].isoformat()
    await db.notifications.insert_one(notif_doc)
    
    return {"message": "Project submitted for review", "status": "in_review"}


# Approve project
@api_router.post("/projects/{project_id}/approve")
async def approve_project(project_id: str, comments: str = ""):
    project = await db.projects.find_one({"id": project_id}, {"_id": 0})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    update_data = {
        "status": "approved",
        "approval_comments": comments,
        "approved_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.projects.update_one({"id": project_id}, {"$set": update_data})
    
    # Create notification for submitter (using customer name as placeholder)
    notification = Notification(
        user_email=project.get("approver_email", ""),
        type="approved",
        title="Project Approved",
        message=f"Project {project.get('project_number', '')} '{project.get('name', '')}' has been approved.",
        project_id=project_id,
        project_number=project.get("project_number", "")
    )
    notif_doc = notification.model_dump()
    notif_doc['created_at'] = notif_doc['created_at'].isoformat()
    await db.notifications.insert_one(notif_doc)
    
    return {"message": "Project approved", "status": "approved"}


# Reject project
@api_router.post("/projects/{project_id}/reject")
async def reject_project(project_id: str, comments: str = ""):
    project = await db.projects.find_one({"id": project_id}, {"_id": 0})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    update_data = {
        "status": "rejected",
        "approval_comments": comments,
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.projects.update_one({"id": project_id}, {"$set": update_data})
    
    # Create notification
    notification = Notification(
        user_email=project.get("approver_email", ""),
        type="rejected",
        title="Project Rejected",
        message=f"Project {project.get('project_number', '')} '{project.get('name', '')}' has been rejected. Comments: {comments}",
        project_id=project_id,
        project_number=project.get("project_number", "")
    )
    notif_doc = notification.model_dump()
    notif_doc['created_at'] = notif_doc['created_at'].isoformat()
    await db.notifications.insert_one(notif_doc)
    
    return {"message": "Project rejected", "status": "rejected"}


# Notifications endpoints
@api_router.get("/notifications")
async def get_notifications(user_email: str = None, unread_only: bool = False):
    query = {}
    if user_email:
        query["user_email"] = user_email
    if unread_only:
        query["is_read"] = False
    
    notifications = await db.notifications.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)
    for notif in notifications:
        if isinstance(notif.get('created_at'), str):
            notif['created_at'] = datetime.fromisoformat(notif['created_at'])
    return notifications


@api_router.put("/notifications/{notification_id}/read")
async def mark_notification_read(notification_id: str):
    result = await db.notifications.update_one(
        {"id": notification_id},
        {"$set": {"is_read": True}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Notification not found")
    return {"message": "Notification marked as read"}


@api_router.put("/notifications/mark-all-read")
async def mark_all_notifications_read(user_email: str = None):
    query = {}
    if user_email:
        query["user_email"] = user_email
    await db.notifications.update_many(query, {"$set": {"is_read": True}})
    return {"message": "All notifications marked as read"}


# Dashboard analytics endpoint
@api_router.get("/dashboard/analytics")
async def get_dashboard_analytics():
    # Get all projects
    projects = await db.projects.find({}, {"_id": 0}).to_list(1000)
    
    # Calculate metrics
    total_projects = len(projects)
    total_revenue = 0
    projects_by_status = {"draft": 0, "in_review": 0, "approved": 0, "rejected": 0}
    projects_by_month = {}
    customer_revenue = {}
    
    for project in projects:
        status = project.get("status", "draft")
        projects_by_status[status] = projects_by_status.get(status, 0) + 1
        
        # Calculate project value
        project_value = 0
        waves = project.get("waves", [])
        profit_margin = project.get("profit_margin_percentage", 35)
        
        for wave in waves:
            config = wave.get("logistics_config", {})
            allocations = wave.get("grid_allocations", [])
            
            wave_base_cost = 0
            wave_logistics = 0
            traveling_mm = 0
            traveling_count = 0
            
            for alloc in allocations:
                mm = sum(alloc.get("phase_allocations", {}).values())
                salary_cost = alloc.get("avg_monthly_salary", 0) * mm
                overhead = salary_cost * (alloc.get("overhead_percentage", 0) / 100)
                wave_base_cost += salary_cost + overhead
                
                if alloc.get("travel_required", False):
                    traveling_mm += mm
                    traveling_count += 1
            
            # Calculate wave logistics for traveling resources
            if traveling_count > 0:
                per_diem = traveling_mm * config.get("per_diem_daily", 50) * config.get("per_diem_days", 30)
                accommodation = traveling_mm * config.get("accommodation_daily", 80) * config.get("accommodation_days", 30)
                conveyance = traveling_mm * config.get("local_conveyance_daily", 15) * config.get("local_conveyance_days", 21)
                flights = traveling_count * config.get("flight_cost_per_trip", 450) * config.get("num_trips", 6)
                visa = traveling_count * config.get("visa_medical_per_trip", 400) * config.get("num_trips", 6)
                subtotal = per_diem + accommodation + conveyance + flights + visa
                contingency = subtotal * (config.get("contingency_percentage", 5) / 100)
                wave_logistics = subtotal + contingency
            
            project_value += wave_base_cost + wave_logistics
        
        # Apply profit margin
        if profit_margin < 100:
            project_value = project_value / (1 - profit_margin / 100)
        
        total_revenue += project_value
        
        # Group by customer
        customer_name = project.get("customer_name", "Unknown")
        customer_revenue[customer_name] = customer_revenue.get(customer_name, 0) + project_value
        
        # Group by month
        created_at = project.get("created_at")
        if created_at:
            if isinstance(created_at, str):
                created_at = datetime.fromisoformat(created_at)
            month_key = created_at.strftime("%Y-%m")
            if month_key not in projects_by_month:
                projects_by_month[month_key] = {"count": 0, "revenue": 0}
            projects_by_month[month_key]["count"] += 1
            projects_by_month[month_key]["revenue"] += project_value
    
    # Convert to sorted list for charts
    monthly_data = [
        {"month": k, "count": v["count"], "revenue": v["revenue"]}
        for k, v in sorted(projects_by_month.items())
    ]
    
    # Top 5 customers by revenue
    top_customers = sorted(
        [{"name": k, "revenue": v} for k, v in customer_revenue.items()],
        key=lambda x: x["revenue"],
        reverse=True
    )[:5]
    
    return {
        "total_projects": total_projects,
        "total_revenue": total_revenue,
        "projects_by_status": projects_by_status,
        "monthly_data": monthly_data,
        "top_customers": top_customers
    }


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()