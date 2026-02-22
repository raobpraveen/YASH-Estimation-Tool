"""
Backend API Tests for Project Estimator - Version Management Features
Tests: Create project with project_number, Clone, New Version, Versions list
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestProjectVersionManagement:
    """Tests for new version management features: project number, clone, new-version"""
    
    created_project_ids = []
    
    @pytest.fixture(autouse=True)
    def setup_method(self):
        """Setup for tests"""
        yield
        # Cleanup test data after all tests
        for project_id in self.created_project_ids:
            try:
                requests.delete(f"{BASE_URL}/api/projects/{project_id}")
            except:
                pass
    
    def test_api_health(self):
        """Test API is accessible"""
        response = requests.get(f"{BASE_URL}/api/customers")
        assert response.status_code == 200, f"API not accessible: {response.status_code}"
        print("API health check passed")
    
    def test_create_project_generates_project_number(self):
        """Test that creating a new project generates a PRJ-XXXX project number"""
        # Get existing customers for test data
        customers_response = requests.get(f"{BASE_URL}/api/customers")
        customers = customers_response.json()
        customer = customers[0] if customers else None
        
        payload = {
            "name": "TEST_VersionManagement_Project",
            "customer_id": customer["id"] if customer else "",
            "customer_name": customer["name"] if customer else "Test Customer",
            "project_location": "AE",
            "project_location_name": "United Arab Emirates",
            "description": "Test project for version management",
            "profit_margin_percentage": 35.0,
            "waves": []
        }
        
        response = requests.post(f"{BASE_URL}/api/projects", json=payload)
        assert response.status_code == 200, f"Failed to create project: {response.text}"
        
        project = response.json()
        self.created_project_ids.append(project["id"])
        
        # Verify project_number is generated in PRJ-XXXX format
        project_number = project.get("project_number", "")
        assert project_number.startswith("PRJ-"), f"Project number should start with PRJ-: {project_number}"
        assert len(project_number) == 8, f"Project number should be PRJ-XXXX format: {project_number}"
        
        # Verify version is 1
        assert project.get("version") == 1, f"Initial version should be 1: {project.get('version')}"
        assert project.get("is_latest_version") == True, "New project should be latest version"
        
        print(f"Created project with number: {project_number}, version: {project.get('version')}")
        return project
    
    def test_clone_project_creates_new_project_number(self):
        """Test that cloning creates a new project with different project number"""
        # First create a project
        customers_response = requests.get(f"{BASE_URL}/api/customers")
        customers = customers_response.json()
        customer = customers[0] if customers else None
        
        original_payload = {
            "name": "TEST_OriginalProject_ForClone",
            "customer_id": customer["id"] if customer else "",
            "customer_name": customer["name"] if customer else "Test Customer",
            "description": "Original project to be cloned",
            "profit_margin_percentage": 30.0,
            "waves": [{
                "id": "test-wave-1",
                "name": "Wave 1",
                "duration_months": 3,
                "phase_names": ["Month 1", "Month 2", "Month 3"],
                "logistics_defaults": {"per_diem_daily": 50},
                "grid_allocations": []
            }]
        }
        
        create_response = requests.post(f"{BASE_URL}/api/projects", json=original_payload)
        assert create_response.status_code == 200, f"Failed to create original project: {create_response.text}"
        original_project = create_response.json()
        self.created_project_ids.append(original_project["id"])
        
        # Clone the project
        clone_response = requests.post(f"{BASE_URL}/api/projects/{original_project['id']}/clone")
        assert clone_response.status_code == 200, f"Failed to clone project: {clone_response.text}"
        
        cloned_project = clone_response.json()
        self.created_project_ids.append(cloned_project["id"])
        
        # Verify cloned project has different project number
        assert cloned_project["project_number"] != original_project["project_number"], \
            f"Cloned project should have different number: {cloned_project['project_number']} vs {original_project['project_number']}"
        
        # Verify cloned project name contains "(Copy)"
        assert "(Copy)" in cloned_project["name"], f"Cloned project name should contain (Copy): {cloned_project['name']}"
        
        # Verify cloned project is version 1
        assert cloned_project["version"] == 1, f"Cloned project should be version 1: {cloned_project['version']}"
        
        # Verify waves are copied
        assert len(cloned_project.get("waves", [])) == len(original_project.get("waves", [])), \
            "Cloned project should have same number of waves"
        
        print(f"Original: {original_project['project_number']}, Cloned: {cloned_project['project_number']}")
        return original_project, cloned_project
    
    def test_new_version_keeps_same_project_number(self):
        """Test that creating new version increments version but keeps same project number"""
        # First create a project
        customers_response = requests.get(f"{BASE_URL}/api/customers")
        customers = customers_response.json()
        customer = customers[0] if customers else None
        
        original_payload = {
            "name": "TEST_VersionedProject",
            "customer_id": customer["id"] if customer else "",
            "customer_name": customer["name"] if customer else "Test Customer",
            "description": "Project for version testing",
            "profit_margin_percentage": 25.0,
            "waves": []
        }
        
        create_response = requests.post(f"{BASE_URL}/api/projects", json=original_payload)
        assert create_response.status_code == 200, f"Failed to create project: {create_response.text}"
        v1_project = create_response.json()
        self.created_project_ids.append(v1_project["id"])
        
        # Create new version with updated data
        version_payload = {
            "name": "TEST_VersionedProject",
            "description": "Updated description for v2",
            "version_notes": "Version 2 changes",
            "profit_margin_percentage": 30.0
        }
        
        new_version_response = requests.post(f"{BASE_URL}/api/projects/{v1_project['id']}/new-version", json=version_payload)
        assert new_version_response.status_code == 200, f"Failed to create new version: {new_version_response.text}"
        
        v2_project = new_version_response.json()
        self.created_project_ids.append(v2_project["id"])
        
        # Verify same project number
        assert v2_project["project_number"] == v1_project["project_number"], \
            f"Project number should be same: {v2_project['project_number']} vs {v1_project['project_number']}"
        
        # Verify incremented version
        assert v2_project["version"] == 2, f"New version should be 2: {v2_project['version']}"
        
        # Verify v2 is latest
        assert v2_project["is_latest_version"] == True, "New version should be latest"
        
        # Verify v1 is no longer latest
        v1_refreshed = requests.get(f"{BASE_URL}/api/projects/{v1_project['id']}").json()
        assert v1_refreshed["is_latest_version"] == False, "Old version should not be latest"
        
        print(f"v1: {v1_project['project_number']} v{v1_project['version']}, v2: {v2_project['project_number']} v{v2_project['version']}")
        return v1_project, v2_project
    
    def test_get_project_versions(self):
        """Test getting all versions of a project"""
        # Create a project with multiple versions
        customers_response = requests.get(f"{BASE_URL}/api/customers")
        customers = customers_response.json()
        customer = customers[0] if customers else None
        
        # Create v1
        create_response = requests.post(f"{BASE_URL}/api/projects", json={
            "name": "TEST_MultiVersionProject",
            "customer_id": customer["id"] if customer else "",
            "customer_name": customer["name"] if customer else "Test Customer",
        })
        v1 = create_response.json()
        self.created_project_ids.append(v1["id"])
        
        # Create v2
        v2_response = requests.post(f"{BASE_URL}/api/projects/{v1['id']}/new-version", json={"version_notes": "v2"})
        v2 = v2_response.json()
        self.created_project_ids.append(v2["id"])
        
        # Create v3
        v3_response = requests.post(f"{BASE_URL}/api/projects/{v2['id']}/new-version", json={"version_notes": "v3"})
        v3 = v3_response.json()
        self.created_project_ids.append(v3["id"])
        
        # Get all versions
        versions_response = requests.get(f"{BASE_URL}/api/projects/{v3['id']}/versions")
        assert versions_response.status_code == 200, f"Failed to get versions: {versions_response.text}"
        
        versions = versions_response.json()
        assert len(versions) >= 3, f"Should have at least 3 versions: {len(versions)}"
        
        # Verify all have same project number
        project_numbers = set(v["project_number"] for v in versions)
        assert len(project_numbers) == 1, f"All versions should have same project number: {project_numbers}"
        
        # Verify versions are in descending order (latest first)
        version_numbers = [v["version"] for v in versions]
        assert version_numbers == sorted(version_numbers, reverse=True), "Versions should be in descending order"
        
        print(f"Found {len(versions)} versions for project {v3['project_number']}")
        return versions
    
    def test_projects_list_shows_latest_only_by_default(self):
        """Test that projects list shows only latest versions by default"""
        # Create a project with versions
        create_response = requests.post(f"{BASE_URL}/api/projects", json={
            "name": "TEST_LatestOnlyProject",
        })
        v1 = create_response.json()
        self.created_project_ids.append(v1["id"])
        
        # Create v2
        v2_response = requests.post(f"{BASE_URL}/api/projects/{v1['id']}/new-version", json={"version_notes": "v2"})
        v2 = v2_response.json()
        self.created_project_ids.append(v2["id"])
        
        # Get projects list (default: latest_only=True)
        projects_response = requests.get(f"{BASE_URL}/api/projects")
        projects = projects_response.json()
        
        # Find our test projects
        test_projects = [p for p in projects if p["project_number"] == v2["project_number"]]
        
        # Should only have one entry (the latest version)
        assert len(test_projects) == 1, f"Should only show latest version: found {len(test_projects)}"
        assert test_projects[0]["version"] == 2, f"Should be latest version: {test_projects[0]['version']}"
        
        print("Latest-only filter working correctly")
    
    def test_edit_project_updates_existing(self):
        """Test that editing a project updates it without creating new version"""
        # Create a project
        create_response = requests.post(f"{BASE_URL}/api/projects", json={
            "name": "TEST_EditableProject",
            "description": "Original description"
        })
        project = create_response.json()
        self.created_project_ids.append(project["id"])
        
        # Update the project
        update_payload = {
            "name": "TEST_EditableProject_Updated",
            "description": "Updated description"
        }
        
        update_response = requests.put(f"{BASE_URL}/api/projects/{project['id']}", json=update_payload)
        assert update_response.status_code == 200, f"Failed to update project: {update_response.text}"
        
        updated_project = update_response.json()
        
        # Verify update
        assert updated_project["name"] == "TEST_EditableProject_Updated", "Name should be updated"
        assert updated_project["description"] == "Updated description", "Description should be updated"
        
        # Verify same version and project number
        assert updated_project["version"] == project["version"], "Version should not change on edit"
        assert updated_project["project_number"] == project["project_number"], "Project number should not change"
        
        print(f"Project updated successfully: {updated_project['name']}")


class TestProjectEstimatorCoreAPIs:
    """Test core APIs work correctly"""
    
    def test_get_customers(self):
        """Test customers endpoint"""
        response = requests.get(f"{BASE_URL}/api/customers")
        assert response.status_code == 200
        print(f"Found {len(response.json())} customers")
    
    def test_get_proficiency_rates(self):
        """Test proficiency rates endpoint"""
        response = requests.get(f"{BASE_URL}/api/proficiency-rates")
        assert response.status_code == 200
        rates = response.json()
        assert len(rates) > 0, "Should have proficiency rates"
        print(f"Found {len(rates)} proficiency rates")
    
    def test_get_technologies(self):
        """Test technologies endpoint"""
        response = requests.get(f"{BASE_URL}/api/technologies")
        assert response.status_code == 200
        print(f"Found {len(response.json())} technologies")
    
    def test_get_base_locations(self):
        """Test base locations endpoint"""
        response = requests.get(f"{BASE_URL}/api/base-locations")
        assert response.status_code == 200
        print(f"Found {len(response.json())} base locations")
    
    def test_get_project_types(self):
        """Test project types endpoint"""
        response = requests.get(f"{BASE_URL}/api/project-types")
        assert response.status_code == 200
        print(f"Found {len(response.json())} project types")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
