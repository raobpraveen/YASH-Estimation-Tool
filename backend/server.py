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
    skill_id: str
    skill_name: str
    proficiency_level: str
    avg_monthly_salary: float
    base_location_id: str
    base_location_name: str
    overhead_percentage: float
    is_onsite: bool = False
    phase_allocations: Dict[str, float] = {}
    per_diem_monthly: float = 0
    accommodation_monthly: float = 0
    flight_cost_per_trip: float = 0
    num_trips: int = 0
    visa_cost: float = 0
    insurance_cost: float = 0
    local_conveyance_monthly: float = 0
    misc_cost: float = 0


# Models for Project Waves
class ProjectWave(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    duration_months: float
    phases: List[str] = ["Discovery", "Prepare", "Explore", "Realize", "Deploy", "Run"]
    grid_allocations: List[WaveGridAllocation] = []


# Models for Projects
class Project(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    customer_name: str = ""
    project_location: str = ""  # ISO country code
    project_location_name: str = ""
    technology_id: str = ""
    technology_name: str = ""
    project_type_id: str = ""
    project_type_name: str = ""
    description: Optional[str] = ""
    profit_margin_percentage: float = 15.0
    waves: List[ProjectWave] = []
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ProjectCreate(BaseModel):
    name: str
    customer_name: str = ""
    project_location: str = ""
    project_location_name: str = ""
    technology_id: str = ""
    technology_name: str = ""
    project_type_id: str = ""
    project_type_name: str = ""
    description: Optional[str] = ""
    profit_margin_percentage: float = 15.0

class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    customer_name: Optional[str] = None
    project_location: Optional[str] = None
    project_location_name: Optional[str] = None
    technology_id: Optional[str] = None
    technology_name: Optional[str] = None
    project_type_id: Optional[str] = None
    project_type_name: Optional[str] = None
    description: Optional[str] = None
    profit_margin_percentage: Optional[float] = None
    waves: Optional[List[Dict]] = None


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
@api_router.post("/projects", response_model=Project)
async def create_project(input: ProjectCreate):
    project_obj = Project(**input.model_dump())
    doc = project_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    doc['updated_at'] = doc['updated_at'].isoformat()
    await db.projects.insert_one(doc)
    return project_obj

@api_router.get("/projects", response_model=List[Project])
async def get_projects():
    projects = await db.projects.find({}, {"_id": 0}).to_list(1000)
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

@api_router.delete("/projects/{project_id}")
async def delete_project(project_id: str):
    result = await db.projects.delete_one({"id": project_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Project not found")
    return {"message": "Project deleted successfully"}


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