"""
Test cases for Iteration 6 features:
1. Skills Management: Technology first column (UI), duplicate skill+technology rejection
2. Proficiency Rates: Technology first column (UI), duplicate key rejection
3. Project Estimator: Multiple locations, Version Notes, 5 summary cards
4. Projects: Expandable version history, read-only mode for old versions/approved projects
"""

import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestSkillsDuplicateHandling:
    """Test duplicate skill+technology combination is rejected"""
    
    def test_duplicate_skill_same_technology_rejected(self):
        """Creating a skill with same name+technology should fail"""
        # First get existing technologies
        tech_response = requests.get(f"{BASE_URL}/api/technologies")
        assert tech_response.status_code == 200
        technologies = tech_response.json()
        
        if not technologies:
            pytest.skip("No technologies available for testing")
        
        tech = technologies[0]
        unique_skill_name = f"TEST_DuplicateSkill_{uuid.uuid4().hex[:8]}"
        
        # Create first skill
        payload = {
            "name": unique_skill_name,
            "technology_id": tech['id'],
            "technology_name": tech['name']
        }
        
        response1 = requests.post(f"{BASE_URL}/api/skills", json=payload)
        assert response1.status_code == 200, f"First skill creation failed: {response1.text}"
        created_skill = response1.json()
        
        # Try to create duplicate
        response2 = requests.post(f"{BASE_URL}/api/skills", json=payload)
        assert response2.status_code == 400, f"Duplicate skill should be rejected, got: {response2.status_code}"
        
        error_detail = response2.json().get('detail', '')
        assert 'already exists' in error_detail.lower(), f"Expected 'already exists' in error, got: {error_detail}"
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/skills/{created_skill['id']}")
        print(f"✓ Duplicate skill+technology correctly rejected")
    
    def test_same_skill_different_technology_allowed(self):
        """Same skill name with different technology should be allowed"""
        tech_response = requests.get(f"{BASE_URL}/api/technologies")
        assert tech_response.status_code == 200
        technologies = tech_response.json()
        
        if len(technologies) < 2:
            pytest.skip("Need at least 2 technologies for this test")
        
        tech1 = technologies[0]
        tech2 = technologies[1]
        unique_skill_name = f"TEST_MultiTechSkill_{uuid.uuid4().hex[:8]}"
        
        # Create skill with first technology
        payload1 = {
            "name": unique_skill_name,
            "technology_id": tech1['id'],
            "technology_name": tech1['name']
        }
        response1 = requests.post(f"{BASE_URL}/api/skills", json=payload1)
        assert response1.status_code == 200
        skill1 = response1.json()
        
        # Create same skill name with different technology
        payload2 = {
            "name": unique_skill_name,
            "technology_id": tech2['id'],
            "technology_name": tech2['name']
        }
        response2 = requests.post(f"{BASE_URL}/api/skills", json=payload2)
        assert response2.status_code == 200, f"Same skill with different tech should be allowed: {response2.text}"
        skill2 = response2.json()
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/skills/{skill1['id']}")
        requests.delete(f"{BASE_URL}/api/skills/{skill2['id']}")
        print(f"✓ Same skill name with different technologies allowed")


class TestProficiencyRatesDuplicateHandling:
    """Test duplicate rate (skill+location+level) is rejected"""
    
    def test_duplicate_rate_combination_rejected(self):
        """Creating a rate with same skill+location+level should fail"""
        # Get existing skills and locations
        skills_response = requests.get(f"{BASE_URL}/api/skills")
        assert skills_response.status_code == 200
        skills = skills_response.json()
        
        locations_response = requests.get(f"{BASE_URL}/api/base-locations")
        assert locations_response.status_code == 200
        locations = locations_response.json()
        
        if not skills or not locations:
            pytest.skip("Need skills and locations for this test")
        
        skill = skills[0]
        location = locations[0]
        
        # Create first rate with a unique proficiency level
        payload = {
            "skill_id": skill['id'],
            "skill_name": skill['name'],
            "technology_id": skill['technology_id'],
            "technology_name": skill['technology_name'],
            "base_location_id": location['id'],
            "base_location_name": location['name'],
            "proficiency_level": "TEST_Level",
            "avg_monthly_salary": 5000
        }
        
        # Clean up any existing test rate
        rates_response = requests.get(f"{BASE_URL}/api/proficiency-rates")
        for rate in rates_response.json():
            if rate.get('proficiency_level') == 'TEST_Level':
                requests.delete(f"{BASE_URL}/api/proficiency-rates/{rate['id']}")
        
        response1 = requests.post(f"{BASE_URL}/api/proficiency-rates", json=payload)
        assert response1.status_code == 200, f"First rate creation failed: {response1.text}"
        created_rate = response1.json()
        
        # Try to create duplicate
        response2 = requests.post(f"{BASE_URL}/api/proficiency-rates", json=payload)
        assert response2.status_code == 400, f"Duplicate rate should be rejected, got: {response2.status_code}"
        
        error_detail = response2.json().get('detail', '')
        assert 'already exists' in error_detail.lower() or 'combination' in error_detail.lower(), \
            f"Expected duplicate error message, got: {error_detail}"
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/proficiency-rates/{created_rate['id']}")
        print(f"✓ Duplicate rate combination correctly rejected")


class TestProjectMultipleLocations:
    """Test project supports multiple locations"""
    
    def test_create_project_with_multiple_locations(self):
        """Creating a project with multiple locations should work"""
        # Get a customer
        customers_response = requests.get(f"{BASE_URL}/api/customers")
        assert customers_response.status_code == 200
        customers = customers_response.json()
        
        if not customers:
            pytest.skip("No customers available for testing")
        
        customer = customers[0]
        
        payload = {
            "name": f"TEST_MultiLocation_{uuid.uuid4().hex[:8]}",
            "customer_id": customer['id'],
            "customer_name": customer['name'],
            "project_locations": ["US", "GB", "IN"],
            "project_location_names": ["United States", "United Kingdom", "India"],
            "waves": []
        }
        
        response = requests.post(f"{BASE_URL}/api/projects", json=payload)
        assert response.status_code == 200, f"Project creation failed: {response.text}"
        
        project = response.json()
        assert len(project.get('project_locations', [])) == 3, "Should have 3 locations"
        assert "US" in project['project_locations']
        assert "GB" in project['project_locations']
        assert "IN" in project['project_locations']
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/projects/{project['id']}")
        print(f"✓ Project with multiple locations created successfully")


class TestVersionNotes:
    """Test version notes field in projects"""
    
    def test_project_version_notes_saved(self):
        """Version notes should be saved with project"""
        customers_response = requests.get(f"{BASE_URL}/api/customers")
        assert customers_response.status_code == 200
        customers = customers_response.json()
        
        if not customers:
            pytest.skip("No customers available for testing")
        
        customer = customers[0]
        version_notes = "Initial version - baseline estimate for Q1"
        
        payload = {
            "name": f"TEST_VersionNotes_{uuid.uuid4().hex[:8]}",
            "customer_id": customer['id'],
            "customer_name": customer['name'],
            "version_notes": version_notes,
            "waves": []
        }
        
        response = requests.post(f"{BASE_URL}/api/projects", json=payload)
        assert response.status_code == 200
        project = response.json()
        
        # Fetch and verify
        get_response = requests.get(f"{BASE_URL}/api/projects/{project['id']}")
        assert get_response.status_code == 200
        fetched = get_response.json()
        assert fetched.get('version_notes') == version_notes
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/projects/{project['id']}")
        print(f"✓ Version notes saved and retrieved correctly")


class TestReadOnlyOldVersion:
    """Test read-only mode for old versions"""
    
    def test_old_version_marked_not_latest(self):
        """When new version is created, old version should be marked as not latest"""
        customers_response = requests.get(f"{BASE_URL}/api/customers")
        customers = customers_response.json()
        
        if not customers:
            pytest.skip("No customers available")
        
        customer = customers[0]
        
        # Create initial project
        payload = {
            "name": f"TEST_VersionTest_{uuid.uuid4().hex[:8]}",
            "customer_id": customer['id'],
            "customer_name": customer['name'],
            "waves": []
        }
        
        response = requests.post(f"{BASE_URL}/api/projects", json=payload)
        assert response.status_code == 200
        project_v1 = response.json()
        assert project_v1.get('is_latest_version') == True
        
        # Create new version
        update_payload = {"name": project_v1['name'] + " v2"}
        new_version_response = requests.post(
            f"{BASE_URL}/api/projects/{project_v1['id']}/new-version",
            json=update_payload
        )
        assert new_version_response.status_code == 200
        project_v2 = new_version_response.json()
        
        # Check v1 is now marked as not latest
        v1_check = requests.get(f"{BASE_URL}/api/projects/{project_v1['id']}")
        assert v1_check.status_code == 200
        v1_data = v1_check.json()
        assert v1_data.get('is_latest_version') == False, "Old version should be marked as not latest"
        
        # Check v2 is marked as latest
        assert project_v2.get('is_latest_version') == True
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/projects/{project_v1['id']}")
        requests.delete(f"{BASE_URL}/api/projects/{project_v2['id']}")
        print(f"✓ Old version correctly marked as not latest after new version created")


class TestApprovedProjectReadOnly:
    """Test approved projects should be read-only (clone to change)"""
    
    def test_approved_project_status(self):
        """Approved project should have status='approved'"""
        # Find PRJ-0003 which should be approved
        projects_response = requests.get(f"{BASE_URL}/api/projects?latest_only=false")
        assert projects_response.status_code == 200
        projects = projects_response.json()
        
        approved_projects = [p for p in projects if p.get('status') == 'approved']
        
        if not approved_projects:
            pytest.skip("No approved projects found for testing")
        
        approved = approved_projects[0]
        assert approved['status'] == 'approved'
        print(f"✓ Found approved project: {approved.get('project_number')}")
    
    def test_clone_approved_project(self):
        """Cloning an approved project should create a new draft project"""
        projects_response = requests.get(f"{BASE_URL}/api/projects?latest_only=false")
        projects = projects_response.json()
        
        approved_projects = [p for p in projects if p.get('status') == 'approved']
        
        if not approved_projects:
            pytest.skip("No approved projects found")
        
        approved = approved_projects[0]
        
        # Clone the approved project
        clone_response = requests.post(f"{BASE_URL}/api/projects/{approved['id']}/clone")
        assert clone_response.status_code == 200
        cloned = clone_response.json()
        
        # Cloned project should be a new project number
        assert cloned.get('project_number') != approved.get('project_number')
        # Cloned project should have status draft (default)
        assert cloned.get('status') == 'draft'
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/projects/{cloned['id']}")
        print(f"✓ Approved project cloned successfully as new draft")


class TestExpandableVersionHistory:
    """Test version history API"""
    
    def test_get_project_versions(self):
        """Should return all versions of a project"""
        # Find a project with multiple versions
        projects_response = requests.get(f"{BASE_URL}/api/projects?latest_only=false")
        projects = projects_response.json()
        
        # Group by project_number
        by_number = {}
        for p in projects:
            pn = p.get('project_number', '')
            if pn:
                if pn not in by_number:
                    by_number[pn] = []
                by_number[pn].append(p)
        
        # Find one with multiple versions
        multi_version = None
        for pn, versions in by_number.items():
            if len(versions) > 1:
                multi_version = versions[0]
                break
        
        if not multi_version:
            pytest.skip("No projects with multiple versions found")
        
        # Get versions via API
        versions_response = requests.get(f"{BASE_URL}/api/projects/{multi_version['id']}/versions")
        assert versions_response.status_code == 200
        versions = versions_response.json()
        
        assert len(versions) > 1, "Should return multiple versions"
        
        # Versions should be sorted by version number descending
        version_nums = [v.get('version', 0) for v in versions]
        assert version_nums == sorted(version_nums, reverse=True), "Versions should be sorted descending"
        
        print(f"✓ Version history API returns {len(versions)} versions correctly sorted")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
