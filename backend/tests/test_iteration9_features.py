"""
Iteration 9 Tests: RBAC, User Management, Dashboard Analytics, Proficiency Rates Inline Editing
Tests: Admin login, Dashboard KPIs/Charts/Filters, User Management CRUD, Proficiency Rates inline edit
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestAdminAuthentication:
    """Test admin user authentication"""
    
    def test_admin_login_success(self):
        """Test admin login with valid credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@test.com",
            "password": "admin123"
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert "token" in data
        assert "user" in data
        assert data["user"]["email"] == "admin@test.com"
        assert data["user"]["role"] == "admin"
        print(f"PASS: Admin login successful, role={data['user']['role']}")
    
    def test_admin_login_invalid_credentials(self):
        """Test admin login with wrong password"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@test.com",
            "password": "wrongpassword"
        })
        assert response.status_code == 401
        print("PASS: Invalid credentials rejected with 401")
    
    def test_get_current_user(self):
        """Test /auth/me endpoint with admin token"""
        # Login first
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@test.com",
            "password": "admin123"
        })
        assert login_response.status_code == 200
        token = login_response.json()["token"]
        
        # Get current user
        response = requests.get(f"{BASE_URL}/api/auth/me", headers={
            "Authorization": f"Bearer {token}"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == "admin@test.com"
        assert data["role"] == "admin"
        print(f"PASS: /auth/me returns admin user: {data['name']}")


class TestDashboardAnalytics:
    """Test Dashboard analytics endpoint"""
    
    def test_dashboard_analytics_returns_data(self):
        """Test GET /dashboard/analytics returns expected structure"""
        response = requests.get(f"{BASE_URL}/api/dashboard/analytics")
        assert response.status_code == 200
        data = response.json()
        
        # Verify expected fields exist
        assert "total_projects" in data, "Missing total_projects field"
        assert "total_revenue" in data, "Missing total_revenue field"
        assert "projects_by_status" in data, "Missing projects_by_status field"
        assert "monthly_data" in data, "Missing monthly_data field"
        assert "top_customers" in data, "Missing top_customers field"
        
        # Verify projects_by_status structure
        status_data = data["projects_by_status"]
        assert "draft" in status_data
        assert "in_review" in status_data
        assert "approved" in status_data
        assert "rejected" in status_data
        
        print(f"PASS: Dashboard analytics returned - total_projects={data['total_projects']}, total_revenue=${data['total_revenue']:.2f}")
        print(f"       Projects by status: {status_data}")
    
    def test_dashboard_analytics_with_filters(self):
        """Test dashboard analytics with date/customer filters"""
        # Test with date_from filter
        response = requests.get(f"{BASE_URL}/api/dashboard/analytics?date_from=2024-01-01")
        assert response.status_code == 200
        data = response.json()
        assert "total_projects" in data
        print("PASS: Dashboard analytics with date_from filter works")
        
        # Test with date_to filter
        response = requests.get(f"{BASE_URL}/api/dashboard/analytics?date_to=2026-12-31")
        assert response.status_code == 200
        data = response.json()
        assert "total_projects" in data
        print("PASS: Dashboard analytics with date_to filter works")


class TestUserManagement:
    """Test User Management (Admin only) endpoints"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@test.com",
            "password": "admin123"
        })
        assert response.status_code == 200, "Admin login failed"
        return response.json()["token"]
    
    @pytest.fixture
    def non_admin_token(self):
        """Get non-admin auth token (create if doesn't exist)"""
        # Try login with existing user
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "test@example.com",
            "password": "test123"
        })
        if response.status_code == 200:
            return response.json()["token"]
        # User doesn't exist, return None (will skip tests)
        return None
    
    def test_get_users_as_admin(self, admin_token):
        """Test GET /users returns user list for admin"""
        response = requests.get(f"{BASE_URL}/api/users", headers={
            "Authorization": f"Bearer {admin_token}"
        })
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert isinstance(data, list)
        print(f"PASS: Admin can view users, found {len(data)} users")
        
        # Verify user structure
        if len(data) > 0:
            user = data[0]
            assert "id" in user
            assert "email" in user
            assert "name" in user
            assert "role" in user
            assert "is_active" in user
            print(f"       User structure verified: {user['email']}, role={user['role']}")
    
    def test_get_users_without_auth(self):
        """Test GET /users requires authentication"""
        response = requests.get(f"{BASE_URL}/api/users")
        assert response.status_code == 401
        print("PASS: GET /users requires authentication (401)")
    
    def test_create_user_as_admin(self, admin_token):
        """Test POST /users creates a new user (admin only)"""
        test_user = {
            "email": "TEST_iteration9_user@example.com",
            "password": "testpass123",
            "name": "Test User Iter9",
            "role": "user"
        }
        response = requests.post(f"{BASE_URL}/api/users", json=test_user, headers={
            "Authorization": f"Bearer {admin_token}"
        })
        # 200 or 201 for success, 400 if email exists
        if response.status_code == 400 and "already" in response.text.lower():
            print("INFO: Test user already exists, continuing...")
            return
        
        assert response.status_code in [200, 201], f"Create user failed: {response.text}"
        data = response.json()
        assert data["email"] == test_user["email"].lower()
        assert data["role"] == "user"
        print(f"PASS: Admin created user: {data['email']}")
    
    def test_update_user_role_as_admin(self, admin_token):
        """Test PUT /users/{id} can update user role"""
        # First get users
        response = requests.get(f"{BASE_URL}/api/users", headers={
            "Authorization": f"Bearer {admin_token}"
        })
        assert response.status_code == 200
        users = response.json()
        
        # Find a test user to update (not admin)
        test_user = None
        for u in users:
            if "TEST_" in u["name"] or "iteration9" in u["email"]:
                test_user = u
                break
        
        if not test_user:
            print("INFO: No test user found to update, skipping role update test")
            return
        
        # Update role
        new_role = "approver" if test_user["role"] == "user" else "user"
        response = requests.put(f"{BASE_URL}/api/users/{test_user['id']}", json={
            "role": new_role
        }, headers={
            "Authorization": f"Bearer {admin_token}"
        })
        assert response.status_code == 200, f"Update failed: {response.text}"
        data = response.json()
        assert data["role"] == new_role
        print(f"PASS: Updated user role to {new_role}")
    
    def test_delete_user_as_admin(self, admin_token):
        """Test DELETE /users/{id} can delete user (admin only)"""
        # First create a user to delete
        test_user = {
            "email": "TEST_delete_me@example.com",
            "password": "testpass123",
            "name": "Delete Me",
            "role": "user"
        }
        create_response = requests.post(f"{BASE_URL}/api/users", json=test_user, headers={
            "Authorization": f"Bearer {admin_token}"
        })
        
        if create_response.status_code not in [200, 201]:
            # Maybe already exists, try to find and delete
            users_response = requests.get(f"{BASE_URL}/api/users", headers={
                "Authorization": f"Bearer {admin_token}"
            })
            users = users_response.json()
            user_to_delete = next((u for u in users if u["email"] == test_user["email"].lower()), None)
            if user_to_delete:
                user_id = user_to_delete["id"]
            else:
                print("INFO: Could not create or find test user to delete")
                return
        else:
            user_id = create_response.json()["id"]
        
        # Delete the user
        response = requests.delete(f"{BASE_URL}/api/users/{user_id}", headers={
            "Authorization": f"Bearer {admin_token}"
        })
        assert response.status_code == 200, f"Delete failed: {response.text}"
        print("PASS: Admin deleted user successfully")
        
        # Verify deleted
        verify_response = requests.get(f"{BASE_URL}/api/users", headers={
            "Authorization": f"Bearer {admin_token}"
        })
        users = verify_response.json()
        deleted_exists = any(u["id"] == user_id for u in users)
        assert not deleted_exists, "User still exists after delete"
        print("PASS: Verified user no longer in list")
    
    def test_user_management_forbidden_for_non_admin(self, non_admin_token):
        """Test that non-admin users get 403 on user management endpoints"""
        if not non_admin_token:
            pytest.skip("No non-admin user available")
        
        response = requests.get(f"{BASE_URL}/api/users", headers={
            "Authorization": f"Bearer {non_admin_token}"
        })
        assert response.status_code == 403, f"Expected 403, got {response.status_code}"
        print("PASS: Non-admin user gets 403 on GET /users")


class TestProficiencyRates:
    """Test Proficiency Rates CRUD and inline editing"""
    
    def test_get_proficiency_rates(self):
        """Test GET /proficiency-rates returns rates list"""
        response = requests.get(f"{BASE_URL}/api/proficiency-rates")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"PASS: GET /proficiency-rates returned {len(data)} rates")
        
        if len(data) > 0:
            rate = data[0]
            assert "id" in rate
            assert "skill_name" in rate
            assert "proficiency_level" in rate
            assert "avg_monthly_salary" in rate
            print(f"       Sample rate: {rate['skill_name']} - {rate['proficiency_level']} - ${rate['avg_monthly_salary']}")
    
    def test_update_proficiency_rate_salary(self):
        """Test PUT /proficiency-rates/{id} updates salary (inline edit)"""
        # First get all rates
        response = requests.get(f"{BASE_URL}/api/proficiency-rates")
        assert response.status_code == 200
        rates = response.json()
        
        if len(rates) == 0:
            print("INFO: No proficiency rates to update, skipping test")
            return
        
        # Pick first rate to update
        rate = rates[0]
        original_salary = rate["avg_monthly_salary"]
        new_salary = original_salary + 100
        
        # Update salary
        update_response = requests.put(
            f"{BASE_URL}/api/proficiency-rates/{rate['id']}?avg_monthly_salary={new_salary}"
        )
        assert update_response.status_code == 200, f"Update failed: {update_response.text}"
        updated = update_response.json()
        assert updated["avg_monthly_salary"] == new_salary
        print(f"PASS: Updated rate salary from ${original_salary} to ${new_salary}")
        
        # Verify persistence by fetching again
        verify_response = requests.get(f"{BASE_URL}/api/proficiency-rates")
        rates = verify_response.json()
        updated_rate = next((r for r in rates if r["id"] == rate["id"]), None)
        assert updated_rate is not None
        assert updated_rate["avg_monthly_salary"] == new_salary
        print("PASS: Verified salary update persisted")
        
        # Restore original salary
        requests.put(f"{BASE_URL}/api/proficiency-rates/{rate['id']}?avg_monthly_salary={original_salary}")
        print(f"INFO: Restored original salary ${original_salary}")
    
    def test_create_and_delete_proficiency_rate(self):
        """Test full CRUD for proficiency rates"""
        # First get skills and locations
        skills_response = requests.get(f"{BASE_URL}/api/skills")
        locations_response = requests.get(f"{BASE_URL}/api/base-locations")
        
        if skills_response.status_code != 200 or locations_response.status_code != 200:
            print("INFO: Could not get skills/locations, skipping create test")
            return
        
        skills = skills_response.json()
        locations = locations_response.json()
        
        if len(skills) == 0 or len(locations) == 0:
            print("INFO: No skills or locations available, skipping create test")
            return
        
        # Try to create a unique rate
        skill = skills[0]
        location = locations[0]
        
        new_rate = {
            "skill_id": skill["id"],
            "skill_name": skill["name"],
            "technology_id": skill.get("technology_id", ""),
            "technology_name": skill.get("technology_name", ""),
            "base_location_id": location["id"],
            "base_location_name": location["name"],
            "proficiency_level": "TEST_Level",
            "avg_monthly_salary": 9999
        }
        
        create_response = requests.post(f"{BASE_URL}/api/proficiency-rates", json=new_rate)
        if create_response.status_code == 400:
            print("INFO: Rate already exists for this combination, which is expected")
            return
        
        assert create_response.status_code in [200, 201], f"Create failed: {create_response.text}"
        created = create_response.json()
        print(f"PASS: Created proficiency rate: {created['skill_name']} - {created['proficiency_level']}")
        
        # Delete the test rate
        delete_response = requests.delete(f"{BASE_URL}/api/proficiency-rates/{created['id']}")
        assert delete_response.status_code == 200
        print("PASS: Deleted test proficiency rate")


class TestCustomers:
    """Test customers endpoint for dashboard filters"""
    
    def test_get_customers(self):
        """Test GET /customers for dashboard filter dropdown"""
        response = requests.get(f"{BASE_URL}/api/customers")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"PASS: GET /customers returned {len(data)} customers")
        
        if len(data) > 0:
            customer = data[0]
            assert "id" in customer
            assert "name" in customer
            print(f"       Sample customer: {customer['name']}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
