"""
Iteration 13 Tests - Testing new features:
1. Sales Manager CRUD endpoints
2. Dashboard analytics with new KPIs (technology_data, project_type_data, location_data, sales_manager_data)
3. Notification endpoints (GET, mark as read, mark all read)
4. Sales Manager dropdown integration on Project Estimator
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestSalesManagerCRUD:
    """Test Sales Manager CRUD operations"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Store created IDs for cleanup"""
        self.created_ids = []
        yield
        # Cleanup
        for manager_id in self.created_ids:
            try:
                requests.delete(f"{BASE_URL}/api/sales-managers/{manager_id}")
            except:
                pass
    
    def test_create_sales_manager(self):
        """Test creating a new sales manager"""
        payload = {
            "name": "TEST_John Smith",
            "email": "test.john@emergent.com",
            "phone": "+1-555-0123",
            "department": "Enterprise Sales",
            "is_active": True
        }
        response = requests.post(f"{BASE_URL}/api/sales-managers", json=payload)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        assert data["name"] == payload["name"]
        assert data["email"] == payload["email"]
        assert data["phone"] == payload["phone"]
        assert data["department"] == payload["department"]
        assert data["is_active"] == True
        assert "id" in data
        
        self.created_ids.append(data["id"])
        print(f"Created sales manager: {data['id']}")
    
    def test_get_all_sales_managers(self):
        """Test listing all sales managers"""
        response = requests.get(f"{BASE_URL}/api/sales-managers")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert isinstance(data, list)
        print(f"Found {len(data)} sales managers")
    
    def test_get_active_sales_managers_only(self):
        """Test getting only active sales managers"""
        response = requests.get(f"{BASE_URL}/api/sales-managers?active_only=true")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert isinstance(data, list)
        # All returned should be active
        for manager in data:
            assert manager.get("is_active", True) == True, f"Found inactive manager: {manager['name']}"
        print(f"Found {len(data)} active sales managers")
    
    def test_get_single_sales_manager(self):
        """Test getting a single sales manager by ID"""
        # First create a manager
        create_payload = {
            "name": "TEST_Jane Doe",
            "email": "test.jane@emergent.com",
            "department": "SMB Sales"
        }
        create_response = requests.post(f"{BASE_URL}/api/sales-managers", json=create_payload)
        assert create_response.status_code == 200
        manager_id = create_response.json()["id"]
        self.created_ids.append(manager_id)
        
        # Get the manager
        response = requests.get(f"{BASE_URL}/api/sales-managers/{manager_id}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert data["id"] == manager_id
        assert data["name"] == create_payload["name"]
        print(f"Retrieved sales manager: {data['name']}")
    
    def test_update_sales_manager(self):
        """Test updating a sales manager"""
        # First create a manager
        create_payload = {
            "name": "TEST_Bob Wilson",
            "email": "test.bob@emergent.com",
            "department": "Sales"
        }
        create_response = requests.post(f"{BASE_URL}/api/sales-managers", json=create_payload)
        assert create_response.status_code == 200
        manager_id = create_response.json()["id"]
        self.created_ids.append(manager_id)
        
        # Update the manager
        update_payload = {
            "name": "TEST_Bob Wilson Jr",
            "department": "Enterprise Sales",
            "phone": "+1-555-9999"
        }
        response = requests.put(f"{BASE_URL}/api/sales-managers/{manager_id}", json=update_payload)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert data["name"] == update_payload["name"]
        assert data["department"] == update_payload["department"]
        assert data["phone"] == update_payload["phone"]
        # Original email should be preserved
        assert data["email"] == create_payload["email"]
        print(f"Updated sales manager: {data['name']}")
    
    def test_delete_sales_manager(self):
        """Test deleting a sales manager"""
        # First create a manager
        create_payload = {"name": "TEST_ToDelete Manager"}
        create_response = requests.post(f"{BASE_URL}/api/sales-managers", json=create_payload)
        assert create_response.status_code == 200
        manager_id = create_response.json()["id"]
        
        # Delete the manager
        response = requests.delete(f"{BASE_URL}/api/sales-managers/{manager_id}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        # Verify deletion
        get_response = requests.get(f"{BASE_URL}/api/sales-managers/{manager_id}")
        assert get_response.status_code == 404, "Manager should not exist after deletion"
        print(f"Deleted sales manager: {manager_id}")
    
    def test_delete_nonexistent_sales_manager(self):
        """Test deleting a nonexistent sales manager returns 404"""
        response = requests.delete(f"{BASE_URL}/api/sales-managers/nonexistent-id-12345")
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"


class TestDashboardAnalytics:
    """Test Dashboard analytics endpoint with new KPIs"""
    
    def test_dashboard_analytics_endpoint(self):
        """Test that dashboard analytics returns all required fields"""
        response = requests.get(f"{BASE_URL}/api/dashboard/analytics")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        
        # Check core fields
        assert "total_projects" in data, "Missing total_projects"
        assert "total_revenue" in data, "Missing total_revenue"
        assert "projects_by_status" in data, "Missing projects_by_status"
        assert "monthly_data" in data, "Missing monthly_data"
        assert "top_customers" in data, "Missing top_customers"
        
        # Check NEW KPI fields
        assert "technology_data" in data, "Missing technology_data"
        assert "project_type_data" in data, "Missing project_type_data"
        assert "location_data" in data, "Missing location_data"
        assert "sales_manager_data" in data, "Missing sales_manager_data"
        
        print(f"Dashboard analytics: {data['total_projects']} projects, ${data['total_revenue']:.2f} total value")
        print(f"Technology data items: {len(data['technology_data'])}")
        print(f"Project type data items: {len(data['project_type_data'])}")
        print(f"Location data items: {len(data['location_data'])}")
        print(f"Sales manager data items: {len(data['sales_manager_data'])}")
    
    def test_dashboard_analytics_structure_technology(self):
        """Test that technology_data has correct structure"""
        response = requests.get(f"{BASE_URL}/api/dashboard/analytics")
        assert response.status_code == 200
        data = response.json()
        
        for item in data.get("technology_data", []):
            assert "name" in item, "technology_data item missing 'name'"
            assert "value" in item, "technology_data item missing 'value'"
            print(f"Technology: {item['name']} - ${item['value']:.2f}")
    
    def test_dashboard_analytics_structure_project_type(self):
        """Test that project_type_data has correct structure"""
        response = requests.get(f"{BASE_URL}/api/dashboard/analytics")
        assert response.status_code == 200
        data = response.json()
        
        for item in data.get("project_type_data", []):
            assert "name" in item, "project_type_data item missing 'name'"
            assert "value" in item, "project_type_data item missing 'value'"
            print(f"Project Type: {item['name']} - ${item['value']:.2f}")
    
    def test_dashboard_analytics_structure_location(self):
        """Test that location_data has correct structure"""
        response = requests.get(f"{BASE_URL}/api/dashboard/analytics")
        assert response.status_code == 200
        data = response.json()
        
        for item in data.get("location_data", []):
            assert "name" in item, "location_data item missing 'name'"
            assert "value" in item, "location_data item missing 'value'"
            print(f"Location: {item['name']} - ${item['value']:.2f}")
    
    def test_dashboard_analytics_structure_sales_manager(self):
        """Test that sales_manager_data has correct structure"""
        response = requests.get(f"{BASE_URL}/api/dashboard/analytics")
        assert response.status_code == 200
        data = response.json()
        
        for item in data.get("sales_manager_data", []):
            assert "name" in item, "sales_manager_data item missing 'name'"
            assert "value" in item, "sales_manager_data item missing 'value'"
            print(f"Sales Manager: {item['name']} - ${item['value']:.2f}")
    
    def test_dashboard_label_total_value_estimations(self):
        """Verify total_revenue field exists (renamed to 'Total Value of Estimations' on UI)"""
        response = requests.get(f"{BASE_URL}/api/dashboard/analytics")
        assert response.status_code == 200
        data = response.json()
        
        # Backend still returns 'total_revenue', frontend displays as 'Total Value of Estimations'
        assert "total_revenue" in data, "Missing total_revenue field"
        assert isinstance(data["total_revenue"], (int, float)), "total_revenue should be numeric"
        print(f"Total Value of Estimations: ${data['total_revenue']:.2f}")


class TestNotificationEndpoints:
    """Test Notification API endpoints"""
    
    def test_get_notifications(self):
        """Test getting notifications list"""
        response = requests.get(f"{BASE_URL}/api/notifications")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert isinstance(data, list)
        print(f"Found {len(data)} notifications")
    
    def test_get_notifications_by_user_email(self):
        """Test filtering notifications by user email"""
        test_email = "admin@emergent.com"
        response = requests.get(f"{BASE_URL}/api/notifications?user_email={test_email}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert isinstance(data, list)
        # All returned should have matching email
        for notif in data:
            assert notif.get("user_email") == test_email, f"Notification for wrong user: {notif.get('user_email')}"
        print(f"Found {len(data)} notifications for {test_email}")
    
    def test_get_unread_notifications_only(self):
        """Test filtering for unread notifications only"""
        response = requests.get(f"{BASE_URL}/api/notifications?unread_only=true")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert isinstance(data, list)
        # All returned should be unread
        for notif in data:
            assert notif.get("is_read", False) == False, f"Found read notification in unread filter"
        print(f"Found {len(data)} unread notifications")
    
    def test_mark_all_notifications_read(self):
        """Test marking all notifications as read"""
        test_email = "admin@emergent.com"
        response = requests.put(f"{BASE_URL}/api/notifications/mark-all-read?user_email={test_email}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert "message" in data
        print(f"Marked all notifications read for {test_email}")


class TestAuthentication:
    """Test authentication for protected endpoints"""
    
    def test_login_success(self):
        """Test successful login"""
        payload = {"email": "admin@emergent.com", "password": "password"}
        response = requests.post(f"{BASE_URL}/api/auth/login", json=payload)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        assert "token" in data, "Missing token in response"
        assert "user" in data, "Missing user in response"
        assert data["user"]["email"] == payload["email"]
        print(f"Login successful: {data['user']['name']} ({data['user']['role']})")
        return data["token"]
    
    def test_get_current_user(self):
        """Test getting current user info"""
        # First login
        login_payload = {"email": "admin@emergent.com", "password": "password"}
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json=login_payload)
        assert login_response.status_code == 200
        token = login_response.json()["token"]
        
        # Get user info
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get(f"{BASE_URL}/api/auth/me", headers=headers)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert data["email"] == login_payload["email"]
        print(f"Current user: {data['name']} ({data['role']})")


class TestProjectWithSalesManager:
    """Test project creation/update with sales manager"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup - login and store IDs for cleanup"""
        login_payload = {"email": "admin@emergent.com", "password": "password"}
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json=login_payload)
        if login_response.status_code == 200:
            self.token = login_response.json()["token"]
            self.headers = {"Authorization": f"Bearer {self.token}"}
        else:
            self.token = None
            self.headers = {}
        
        self.created_manager_ids = []
        self.created_project_ids = []
        yield
        
        # Cleanup
        for project_id in self.created_project_ids:
            try:
                requests.delete(f"{BASE_URL}/api/projects/{project_id}", headers=self.headers)
            except:
                pass
        for manager_id in self.created_manager_ids:
            try:
                requests.delete(f"{BASE_URL}/api/sales-managers/{manager_id}")
            except:
                pass
    
    def test_create_project_with_sales_manager(self):
        """Test creating a project with a sales manager assigned"""
        # First create a sales manager
        manager_payload = {
            "name": "TEST_Project SM",
            "email": "test.project.sm@emergent.com"
        }
        manager_response = requests.post(f"{BASE_URL}/api/sales-managers", json=manager_payload)
        assert manager_response.status_code == 200
        manager = manager_response.json()
        self.created_manager_ids.append(manager["id"])
        
        # Create a project with sales manager
        project_payload = {
            "name": "TEST_Project with SM",
            "customer_id": "",
            "customer_name": "Test Customer",
            "sales_manager_id": manager["id"],
            "sales_manager_name": manager["name"],
            "waves": []
        }
        response = requests.post(f"{BASE_URL}/api/projects", json=project_payload, headers=self.headers)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        assert data["sales_manager_id"] == manager["id"], "Sales manager ID not saved"
        assert data["sales_manager_name"] == manager["name"], "Sales manager name not saved"
        
        self.created_project_ids.append(data["id"])
        print(f"Created project {data['project_number']} with sales manager {manager['name']}")
    
    def test_update_project_sales_manager(self):
        """Test updating a project's sales manager"""
        # Create two sales managers
        sm1_payload = {"name": "TEST_SM One"}
        sm1_response = requests.post(f"{BASE_URL}/api/sales-managers", json=sm1_payload)
        assert sm1_response.status_code == 200
        sm1 = sm1_response.json()
        self.created_manager_ids.append(sm1["id"])
        
        sm2_payload = {"name": "TEST_SM Two"}
        sm2_response = requests.post(f"{BASE_URL}/api/sales-managers", json=sm2_payload)
        assert sm2_response.status_code == 200
        sm2 = sm2_response.json()
        self.created_manager_ids.append(sm2["id"])
        
        # Create project with SM1
        project_payload = {
            "name": "TEST_Update SM Project",
            "sales_manager_id": sm1["id"],
            "sales_manager_name": sm1["name"],
            "waves": []
        }
        create_response = requests.post(f"{BASE_URL}/api/projects", json=project_payload, headers=self.headers)
        assert create_response.status_code == 200
        project = create_response.json()
        self.created_project_ids.append(project["id"])
        
        # Update project to use SM2
        update_payload = {
            "sales_manager_id": sm2["id"],
            "sales_manager_name": sm2["name"]
        }
        update_response = requests.put(f"{BASE_URL}/api/projects/{project['id']}", json=update_payload, headers=self.headers)
        
        assert update_response.status_code == 200, f"Expected 200, got {update_response.status_code}"
        updated_project = update_response.json()
        
        assert updated_project["sales_manager_id"] == sm2["id"], "Sales manager ID not updated"
        assert updated_project["sales_manager_name"] == sm2["name"], "Sales manager name not updated"
        print(f"Updated project {project['project_number']} sales manager to {sm2['name']}")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
