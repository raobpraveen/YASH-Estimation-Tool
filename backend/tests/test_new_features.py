"""
Backend tests for IT/Software Project Estimator - New Features
Tests cover:
1. Dashboard analytics endpoint
2. Notifications API (create, get, mark as read)
3. Approval workflow (submit-for-review, approve, reject)
4. Project versions endpoint
5. Status field in projects
"""

import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test data prefix for cleanup
TEST_PREFIX = "TEST_NewFeatures_"

@pytest.fixture(scope="module")
def api_client():
    """Create a requests session for API calls"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session

@pytest.fixture(scope="module")
def test_customer(api_client):
    """Create a test customer for use in projects"""
    # Check if test customer exists
    response = api_client.get(f"{BASE_URL}/api/customers")
    customers = response.json()
    for customer in customers:
        if customer['name'].startswith(TEST_PREFIX):
            return customer
    
    # Create test customer
    customer_data = {
        "name": f"{TEST_PREFIX}Customer_{uuid.uuid4().hex[:6]}",
        "location": "US",
        "location_name": "United States",
        "city": "New York",
        "industry_vertical": "Technology"
    }
    response = api_client.post(f"{BASE_URL}/api/customers", json=customer_data)
    assert response.status_code == 200
    return response.json()


class TestDashboardAnalytics:
    """Tests for Dashboard Analytics API endpoint"""
    
    def test_get_dashboard_analytics(self, api_client):
        """Test GET /api/dashboard/analytics returns correct structure"""
        response = api_client.get(f"{BASE_URL}/api/dashboard/analytics")
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify required fields
        assert "total_projects" in data
        assert "total_revenue" in data
        assert "projects_by_status" in data
        assert "monthly_data" in data
        assert "top_customers" in data
        
        # Verify projects_by_status structure
        status_data = data["projects_by_status"]
        assert "draft" in status_data
        assert "in_review" in status_data
        assert "approved" in status_data
        assert "rejected" in status_data
        
        # Verify data types
        assert isinstance(data["total_projects"], int)
        assert isinstance(data["total_revenue"], (int, float))
        assert isinstance(data["monthly_data"], list)
        assert isinstance(data["top_customers"], list)
        
    def test_analytics_monthly_data_structure(self, api_client):
        """Test that monthly_data has correct structure"""
        response = api_client.get(f"{BASE_URL}/api/dashboard/analytics")
        data = response.json()
        
        if len(data["monthly_data"]) > 0:
            month_entry = data["monthly_data"][0]
            assert "month" in month_entry
            assert "count" in month_entry
            assert "revenue" in month_entry
            
    def test_analytics_top_customers_structure(self, api_client):
        """Test that top_customers has correct structure"""
        response = api_client.get(f"{BASE_URL}/api/dashboard/analytics")
        data = response.json()
        
        if len(data["top_customers"]) > 0:
            customer_entry = data["top_customers"][0]
            assert "name" in customer_entry
            assert "revenue" in customer_entry


class TestNotificationsAPI:
    """Tests for Notifications API endpoints"""
    
    def test_get_notifications_all(self, api_client):
        """Test GET /api/notifications returns list"""
        response = api_client.get(f"{BASE_URL}/api/notifications")
        
        assert response.status_code == 200
        assert isinstance(response.json(), list)
        
    def test_get_notifications_unread_only(self, api_client):
        """Test GET /api/notifications with unread_only filter"""
        response = api_client.get(f"{BASE_URL}/api/notifications?unread_only=true")
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        # All returned notifications should be unread
        for notif in data:
            assert notif.get("is_read", True) == False or "is_read" not in notif
            
    def test_get_notifications_by_email(self, api_client):
        """Test GET /api/notifications with user_email filter"""
        response = api_client.get(f"{BASE_URL}/api/notifications?user_email=test@example.com")
        
        assert response.status_code == 200
        assert isinstance(response.json(), list)
        
    def test_mark_all_notifications_read(self, api_client):
        """Test PUT /api/notifications/mark-all-read"""
        response = api_client.put(f"{BASE_URL}/api/notifications/mark-all-read")
        
        assert response.status_code == 200
        data = response.json()
        assert "message" in data


class TestApprovalWorkflow:
    """Tests for Approval Workflow API endpoints"""
    
    @pytest.fixture
    def test_project(self, api_client, test_customer):
        """Create a test project for approval workflow testing"""
        project_data = {
            "name": f"{TEST_PREFIX}ApprovalTest_{uuid.uuid4().hex[:6]}",
            "customer_id": test_customer["id"],
            "customer_name": test_customer["name"],
            "profit_margin_percentage": 35,
            "status": "draft",
            "waves": [{
                "id": f"wave_{uuid.uuid4().hex[:8]}",
                "name": "Test Wave",
                "duration_months": 3,
                "phase_names": ["Month 1", "Month 2", "Month 3"],
                "logistics_config": {},
                "grid_allocations": []
            }]
        }
        response = api_client.post(f"{BASE_URL}/api/projects", json=project_data)
        assert response.status_code == 200
        project = response.json()
        
        yield project
        
        # Cleanup
        api_client.delete(f"{BASE_URL}/api/projects/{project['id']}")
    
    def test_project_default_status_is_draft(self, test_project):
        """Test that new projects have default status 'draft'"""
        assert test_project.get("status") == "draft"
        
    def test_submit_for_review(self, api_client, test_project):
        """Test POST /api/projects/{id}/submit-for-review"""
        project_id = test_project["id"]
        approver_email = "approver@test.com"
        
        response = api_client.post(
            f"{BASE_URL}/api/projects/{project_id}/submit-for-review?approver_email={approver_email}"
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "in_review"
        
        # Verify project status was updated
        verify_response = api_client.get(f"{BASE_URL}/api/projects/{project_id}")
        assert verify_response.status_code == 200
        updated_project = verify_response.json()
        assert updated_project["status"] == "in_review"
        assert updated_project["approver_email"] == approver_email
        
    def test_submit_for_review_missing_email(self, api_client, test_project):
        """Test submit-for-review fails without approver email"""
        project_id = test_project["id"]
        
        response = api_client.post(
            f"{BASE_URL}/api/projects/{project_id}/submit-for-review?approver_email="
        )
        
        assert response.status_code == 400
        
    def test_approve_project(self, api_client, test_customer):
        """Test POST /api/projects/{id}/approve"""
        # Create a fresh project for this test
        project_data = {
            "name": f"{TEST_PREFIX}ApproveTest_{uuid.uuid4().hex[:6]}",
            "customer_id": test_customer["id"],
            "customer_name": test_customer["name"],
            "waves": []
        }
        create_response = api_client.post(f"{BASE_URL}/api/projects", json=project_data)
        project = create_response.json()
        project_id = project["id"]
        
        try:
            # First submit for review
            api_client.post(
                f"{BASE_URL}/api/projects/{project_id}/submit-for-review?approver_email=test@test.com"
            )
            
            # Now approve
            approval_comments = "Looks good, approved!"
            response = api_client.post(
                f"{BASE_URL}/api/projects/{project_id}/approve?comments={approval_comments}"
            )
            
            assert response.status_code == 200
            data = response.json()
            assert data.get("status") == "approved"
            
            # Verify status persisted
            verify_response = api_client.get(f"{BASE_URL}/api/projects/{project_id}")
            updated = verify_response.json()
            assert updated["status"] == "approved"
            assert updated["approval_comments"] == approval_comments
        finally:
            api_client.delete(f"{BASE_URL}/api/projects/{project_id}")
            
    def test_reject_project(self, api_client, test_customer):
        """Test POST /api/projects/{id}/reject"""
        # Create a fresh project for this test
        project_data = {
            "name": f"{TEST_PREFIX}RejectTest_{uuid.uuid4().hex[:6]}",
            "customer_id": test_customer["id"],
            "customer_name": test_customer["name"],
            "waves": []
        }
        create_response = api_client.post(f"{BASE_URL}/api/projects", json=project_data)
        project = create_response.json()
        project_id = project["id"]
        
        try:
            # First submit for review
            api_client.post(
                f"{BASE_URL}/api/projects/{project_id}/submit-for-review?approver_email=test@test.com"
            )
            
            # Now reject
            rejection_reason = "Budget too high, please revise"
            response = api_client.post(
                f"{BASE_URL}/api/projects/{project_id}/reject?comments={rejection_reason}"
            )
            
            assert response.status_code == 200
            data = response.json()
            assert data.get("status") == "rejected"
            
            # Verify status persisted
            verify_response = api_client.get(f"{BASE_URL}/api/projects/{project_id}")
            updated = verify_response.json()
            assert updated["status"] == "rejected"
            assert updated["approval_comments"] == rejection_reason
        finally:
            api_client.delete(f"{BASE_URL}/api/projects/{project_id}")


class TestProjectVersions:
    """Tests for Project Versions API"""
    
    def test_get_project_versions(self, api_client):
        """Test GET /api/projects/{id}/versions returns all versions"""
        # Get any existing project
        response = api_client.get(f"{BASE_URL}/api/projects")
        projects = response.json()
        
        if len(projects) > 0:
            project_id = projects[0]["id"]
            versions_response = api_client.get(f"{BASE_URL}/api/projects/{project_id}/versions")
            
            assert versions_response.status_code == 200
            versions = versions_response.json()
            assert isinstance(versions, list)
            assert len(versions) >= 1
            
            # All versions should have same project_number
            if len(versions) > 1:
                project_number = versions[0].get("project_number")
                for v in versions:
                    assert v.get("project_number") == project_number
                    
    def test_project_has_status_field(self, api_client):
        """Test that projects have status field"""
        response = api_client.get(f"{BASE_URL}/api/projects")
        projects = response.json()
        
        for project in projects:
            assert "status" in project
            assert project["status"] in ["draft", "in_review", "approved", "rejected"]
            

class TestNotificationCreation:
    """Tests for notification creation during approval workflow"""
    
    def test_notification_created_on_submit_for_review(self, api_client, test_customer):
        """Test that notification is created when project is submitted for review"""
        # Create test project
        project_data = {
            "name": f"{TEST_PREFIX}NotifTest_{uuid.uuid4().hex[:6]}",
            "customer_id": test_customer["id"],
            "customer_name": test_customer["name"],
            "waves": []
        }
        create_response = api_client.post(f"{BASE_URL}/api/projects", json=project_data)
        project = create_response.json()
        project_id = project["id"]
        approver_email = f"approver_{uuid.uuid4().hex[:6]}@test.com"
        
        try:
            # Get initial notification count for this email
            initial_notifs = api_client.get(
                f"{BASE_URL}/api/notifications?user_email={approver_email}"
            ).json()
            initial_count = len(initial_notifs)
            
            # Submit for review
            api_client.post(
                f"{BASE_URL}/api/projects/{project_id}/submit-for-review?approver_email={approver_email}"
            )
            
            # Check notification was created
            final_notifs = api_client.get(
                f"{BASE_URL}/api/notifications?user_email={approver_email}"
            ).json()
            
            assert len(final_notifs) > initial_count
            
            # Verify notification content
            latest_notif = final_notifs[0]
            assert latest_notif["type"] == "review_request"
            assert "review" in latest_notif["title"].lower()
            assert project["project_number"] in latest_notif["project_number"]
        finally:
            api_client.delete(f"{BASE_URL}/api/projects/{project_id}")
            

class TestMarkNotificationRead:
    """Tests for marking individual notifications as read"""
    
    def test_mark_notification_as_read(self, api_client, test_customer):
        """Test PUT /api/notifications/{id}/read"""
        # Create project and submit for review to generate notification
        project_data = {
            "name": f"{TEST_PREFIX}MarkReadTest_{uuid.uuid4().hex[:6]}",
            "customer_id": test_customer["id"],
            "customer_name": test_customer["name"],
            "waves": []
        }
        create_response = api_client.post(f"{BASE_URL}/api/projects", json=project_data)
        project = create_response.json()
        project_id = project["id"]
        approver_email = f"markread_{uuid.uuid4().hex[:6]}@test.com"
        
        try:
            # Submit for review to create notification
            api_client.post(
                f"{BASE_URL}/api/projects/{project_id}/submit-for-review?approver_email={approver_email}"
            )
            
            # Get the notification
            notifs = api_client.get(
                f"{BASE_URL}/api/notifications?user_email={approver_email}"
            ).json()
            
            if len(notifs) > 0:
                notif_id = notifs[0]["id"]
                
                # Mark as read
                response = api_client.put(f"{BASE_URL}/api/notifications/{notif_id}/read")
                assert response.status_code == 200
                
                # Verify it's marked as read - check unread list
                unread_notifs = api_client.get(
                    f"{BASE_URL}/api/notifications?user_email={approver_email}&unread_only=true"
                ).json()
                
                # The notification should not be in unread list
                unread_ids = [n["id"] for n in unread_notifs]
                assert notif_id not in unread_ids
        finally:
            api_client.delete(f"{BASE_URL}/api/projects/{project_id}")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
