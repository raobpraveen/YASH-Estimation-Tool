"""
Test Iteration 7 Features:
- Multi-select Technology and Project Type fields on project header
- Inline grid dropdowns for Skill, Level, and Location in resource rows  
- Read-only mode disables all inputs for 'in_review' and 'approved' projects
- Version Notes field is mandatory when updating existing projects
- KPI cards show Onsite Avg. $/MM and Offshore Avg. $/MM
- View Summary modal shows profit margin per wave and onsite/offshore avg prices
- Compare Versions page shows version_notes for each version
- Compare Versions shows onsite and offshore selling price breakdown
"""

import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestMultiSelectFields:
    """Test multi-select Technology and Project Type fields"""
    
    def test_create_project_with_multiple_technologies(self):
        """Test project creation with multiple technology IDs"""
        # First get existing technologies
        response = requests.get(f"{BASE_URL}/api/technologies")
        assert response.status_code == 200
        technologies = response.json()
        
        if len(technologies) >= 2:
            tech_ids = [technologies[0]['id'], technologies[1]['id']]
            tech_names = [technologies[0]['name'], technologies[1]['name']]
        else:
            print("Not enough technologies for multi-select test, skipping")
            pytest.skip("Need at least 2 technologies")
            return
        
        # Get a customer
        cust_response = requests.get(f"{BASE_URL}/api/customers")
        customers = cust_response.json()
        customer_id = customers[0]['id'] if customers else ""
        
        # Create project with multiple technologies
        payload = {
            "name": f"TEST_MultiTech_Project_{uuid.uuid4().hex[:8]}",
            "customer_id": customer_id,
            "technology_ids": tech_ids,
            "technology_names": tech_names,
            "project_type_ids": [],
            "waves": []
        }
        
        response = requests.post(f"{BASE_URL}/api/projects", json=payload)
        assert response.status_code == 200, f"Failed to create project: {response.text}"
        
        project = response.json()
        assert "technology_ids" in project
        assert len(project["technology_ids"]) == 2
        assert set(project["technology_ids"]) == set(tech_ids)
        print(f"PASS: Project created with multiple technologies: {tech_ids}")
        
        # Cleanup - delete the test project
        project_id = project['id']
        requests.delete(f"{BASE_URL}/api/projects/{project_id}")
    
    def test_create_project_with_multiple_project_types(self):
        """Test project creation with multiple project type IDs"""
        # First get existing project types
        response = requests.get(f"{BASE_URL}/api/project-types")
        assert response.status_code == 200
        project_types = response.json()
        
        if len(project_types) >= 2:
            type_ids = [project_types[0]['id'], project_types[1]['id']]
            type_names = [project_types[0]['name'], project_types[1]['name']]
        else:
            print("Not enough project types for multi-select test, skipping")
            pytest.skip("Need at least 2 project types")
            return
        
        # Get a customer
        cust_response = requests.get(f"{BASE_URL}/api/customers")
        customers = cust_response.json()
        customer_id = customers[0]['id'] if customers else ""
        
        # Create project with multiple project types
        payload = {
            "name": f"TEST_MultiType_Project_{uuid.uuid4().hex[:8]}",
            "customer_id": customer_id,
            "technology_ids": [],
            "project_type_ids": type_ids,
            "project_type_names": type_names,
            "waves": []
        }
        
        response = requests.post(f"{BASE_URL}/api/projects", json=payload)
        assert response.status_code == 200, f"Failed to create project: {response.text}"
        
        project = response.json()
        assert "project_type_ids" in project
        assert len(project["project_type_ids"]) == 2
        assert set(project["project_type_ids"]) == set(type_ids)
        print(f"PASS: Project created with multiple project types: {type_ids}")
        
        # Cleanup
        project_id = project['id']
        requests.delete(f"{BASE_URL}/api/projects/{project_id}")


class TestReadOnlyMode:
    """Test read-only mode for in_review and approved projects"""
    
    def test_get_approved_project(self):
        """Verify approved project has status='approved' and is_latest_version"""
        # Use the known approved project ID
        project_id = "07c55622-22f5-4c64-a13a-c33c4460e6b5"
        
        response = requests.get(f"{BASE_URL}/api/projects/{project_id}")
        
        if response.status_code == 404:
            print("Test project not found, skipping")
            pytest.skip("Test approved project not found")
            return
        
        assert response.status_code == 200
        project = response.json()
        
        assert project.get("status") == "approved", f"Expected approved status, got {project.get('status')}"
        print(f"PASS: Project {project_id} has status='approved'")
    
    def test_create_and_submit_for_review(self):
        """Create a project and submit it for review"""
        # Get a customer
        cust_response = requests.get(f"{BASE_URL}/api/customers")
        customers = cust_response.json()
        customer_id = customers[0]['id'] if customers else ""
        
        # Create a project
        payload = {
            "name": f"TEST_Review_Project_{uuid.uuid4().hex[:8]}",
            "customer_id": customer_id,
            "waves": [
                {
                    "id": str(uuid.uuid4()),
                    "name": "Wave 1",
                    "duration_months": 3,
                    "phase_names": ["Month 1", "Month 2", "Month 3"],
                    "grid_allocations": []
                }
            ]
        }
        
        response = requests.post(f"{BASE_URL}/api/projects", json=payload)
        assert response.status_code == 200
        project = response.json()
        project_id = project['id']
        
        assert project.get("status") == "draft", "New project should be draft"
        print(f"PASS: New project created with status='draft'")
        
        # Submit for review
        review_response = requests.post(
            f"{BASE_URL}/api/projects/{project_id}/submit-for-review?approver_email=test@example.com"
        )
        assert review_response.status_code == 200
        
        # Verify status changed
        get_response = requests.get(f"{BASE_URL}/api/projects/{project_id}")
        updated_project = get_response.json()
        assert updated_project.get("status") == "in_review", f"Expected in_review, got {updated_project.get('status')}"
        print(f"PASS: Project status changed to 'in_review'")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/projects/{project_id}")


class TestVersionNotes:
    """Test version notes functionality"""
    
    def test_version_notes_saved_on_create(self):
        """Verify version_notes is saved when creating a project"""
        cust_response = requests.get(f"{BASE_URL}/api/customers")
        customers = cust_response.json()
        customer_id = customers[0]['id'] if customers else ""
        
        version_notes = "Initial version - test project"
        payload = {
            "name": f"TEST_VersionNotes_Project_{uuid.uuid4().hex[:8]}",
            "customer_id": customer_id,
            "version_notes": version_notes,
            "waves": []
        }
        
        response = requests.post(f"{BASE_URL}/api/projects", json=payload)
        assert response.status_code == 200
        
        project = response.json()
        assert project.get("version_notes") == version_notes
        print(f"PASS: version_notes saved on project create")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/projects/{project['id']}")
    
    def test_version_notes_in_project_response(self):
        """Verify version_notes field is included in project GET response"""
        # Get existing approved project
        project_id = "07c55622-22f5-4c64-a13a-c33c4460e6b5"
        
        response = requests.get(f"{BASE_URL}/api/projects/{project_id}")
        
        if response.status_code == 404:
            pytest.skip("Test project not found")
            return
        
        project = response.json()
        assert "version_notes" in project, "version_notes field should be in response"
        print(f"PASS: version_notes field present in project response: '{project.get('version_notes', '')}'")


class TestCompareVersionsAPI:
    """Test Compare Versions API endpoints"""
    
    def test_get_project_versions_api(self):
        """Verify /api/projects/{id}/versions returns all versions"""
        # Use the known approved project
        project_id = "07c55622-22f5-4c64-a13a-c33c4460e6b5"
        
        response = requests.get(f"{BASE_URL}/api/projects/{project_id}/versions")
        
        if response.status_code == 404:
            pytest.skip("Test project not found")
            return
        
        assert response.status_code == 200
        versions = response.json()
        
        assert isinstance(versions, list)
        assert len(versions) >= 1
        
        # Check that each version has required fields
        for version in versions:
            assert "id" in version
            assert "version" in version
            assert "version_notes" in version
            assert "profit_margin_percentage" in version
        
        print(f"PASS: Got {len(versions)} version(s) for project")
        print(f"Versions: {[v.get('version') for v in versions]}")
    
    def test_versions_include_wave_data(self):
        """Verify versions include waves with grid_allocations for summary calculations"""
        project_id = "07c55622-22f5-4c64-a13a-c33c4460e6b5"
        
        response = requests.get(f"{BASE_URL}/api/projects/{project_id}/versions")
        
        if response.status_code == 404:
            pytest.skip("Test project not found")
            return
        
        versions = response.json()
        
        for version in versions:
            assert "waves" in version
            waves = version["waves"]
            for wave in waves:
                assert "grid_allocations" in wave
                for alloc in wave.get("grid_allocations", []):
                    assert "is_onsite" in alloc
                    assert "avg_monthly_salary" in alloc
                    assert "phase_allocations" in alloc
        
        print(f"PASS: Versions include wave data with grid_allocations")


class TestKPICalculations:
    """Test KPI card calculations for onsite/offshore avg prices"""
    
    def test_project_has_profit_margin(self):
        """Verify project has profit_margin_percentage for KPI calculations"""
        project_id = "07c55622-22f5-4c64-a13a-c33c4460e6b5"
        
        response = requests.get(f"{BASE_URL}/api/projects/{project_id}")
        
        if response.status_code == 404:
            pytest.skip("Test project not found")
            return
        
        project = response.json()
        assert "profit_margin_percentage" in project
        assert isinstance(project["profit_margin_percentage"], (int, float))
        print(f"PASS: Project has profit_margin_percentage: {project['profit_margin_percentage']}%")
    
    def test_project_allocations_have_salary_data(self):
        """Verify allocations have avg_monthly_salary for KPI calculations"""
        project_id = "07c55622-22f5-4c64-a13a-c33c4460e6b5"
        
        response = requests.get(f"{BASE_URL}/api/projects/{project_id}")
        
        if response.status_code == 404:
            pytest.skip("Test project not found")
            return
        
        project = response.json()
        waves = project.get("waves", [])
        
        has_allocations = False
        for wave in waves:
            for alloc in wave.get("grid_allocations", []):
                has_allocations = True
                assert "avg_monthly_salary" in alloc
                assert "is_onsite" in alloc
                assert isinstance(alloc["avg_monthly_salary"], (int, float))
        
        if has_allocations:
            print(f"PASS: Allocations have salary data for KPI calculations")
        else:
            print("WARNING: No allocations found in project")


class TestInlineGridDropdowns:
    """Test inline grid editing with dropdowns for Skill, Level, Location"""
    
    def test_skills_api_returns_data(self):
        """Verify skills API returns data for dropdown population"""
        response = requests.get(f"{BASE_URL}/api/skills")
        assert response.status_code == 200
        skills = response.json()
        
        assert isinstance(skills, list)
        print(f"PASS: Skills API returns {len(skills)} skills")
        
        if len(skills) > 0:
            skill = skills[0]
            assert "id" in skill
            assert "name" in skill
            print(f"Sample skill: {skill.get('name')}")
    
    def test_locations_api_returns_data(self):
        """Verify base locations API returns data for dropdown population"""
        response = requests.get(f"{BASE_URL}/api/base-locations")
        assert response.status_code == 200
        locations = response.json()
        
        assert isinstance(locations, list)
        print(f"PASS: Locations API returns {len(locations)} locations")
        
        if len(locations) > 0:
            location = locations[0]
            assert "id" in location
            assert "name" in location
            assert "overhead_percentage" in location
            print(f"Sample location: {location.get('name')}, overhead: {location.get('overhead_percentage')}%")
    
    def test_proficiency_rates_api_for_salary_lookup(self):
        """Verify proficiency rates API returns data for auto salary lookup"""
        response = requests.get(f"{BASE_URL}/api/proficiency-rates")
        assert response.status_code == 200
        rates = response.json()
        
        assert isinstance(rates, list)
        print(f"PASS: Proficiency rates API returns {len(rates)} rates")
        
        if len(rates) > 0:
            rate = rates[0]
            assert "skill_id" in rate
            assert "base_location_id" in rate
            assert "proficiency_level" in rate
            assert "avg_monthly_salary" in rate
            print(f"Sample rate: {rate.get('skill_name')} / {rate.get('proficiency_level')} / {rate.get('base_location_name')} = ${rate.get('avg_monthly_salary')}")


# Run tests
if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
