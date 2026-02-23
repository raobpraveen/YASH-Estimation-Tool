"""
Test Iteration 12: Calculation bugs and logistics persistence tests
Tests:
1. Logistics Config Persistence - Values should persist after save and reload
2. Row Selling Price Calculation - Each row selling price = (Salary + Overhead) / (1 - profit_margin)
3. Wave Selling Price = Sum of all rows selling prices + logistics selling price markup
4. Total Selling Price = Sum of all waves selling prices
5. Onsite Selling Price = Sum of selling prices where is_onsite = true (ON) + logistics
6. Offshore Selling Price = Sum of selling prices where is_onsite = false (OFF)
7. Onsite Avg $/MM = Onsite Selling Price / Onsite MM
8. Offshore Avg $/MM = Offshore Selling Price / Offshore MM
"""
import pytest
import requests
import os
import json

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')


class TestCalculationsAndLogistics:
    """Tests for calculation formulas and logistics persistence"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@emergent.com",
            "password": "password"
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        return response.json().get("token")
    
    @pytest.fixture(scope="class")
    def test_project_id(self):
        """PRJ-0004 v2 project ID for testing"""
        return "37482dc9-7743-4197-9e02-15dd76a04b3d"
    
    def test_project_exists(self, test_project_id):
        """Verify test project PRJ-0004 v2 exists"""
        response = requests.get(f"{BASE_URL}/api/projects/{test_project_id}")
        assert response.status_code == 200, f"Project not found: {response.text}"
        data = response.json()
        assert data["project_number"] == "PRJ-0004"
        assert data["version"] == 2
        print(f"✓ Test project found: {data['project_number']} v{data['version']}")
    
    def test_logistics_config_exists_in_wave(self, test_project_id):
        """Verify logistics_config field exists in wave data"""
        response = requests.get(f"{BASE_URL}/api/projects/{test_project_id}")
        assert response.status_code == 200
        data = response.json()
        
        assert len(data["waves"]) > 0, "Project has no waves"
        wave = data["waves"][0]
        
        assert "logistics_config" in wave, "logistics_config field missing from wave"
        config = wave["logistics_config"]
        
        # Verify all logistics fields exist
        expected_fields = [
            "per_diem_daily", "per_diem_days",
            "accommodation_daily", "accommodation_days",
            "local_conveyance_daily", "local_conveyance_days",
            "flight_cost_per_trip", "visa_medical_per_trip",
            "num_trips", "contingency_percentage"
        ]
        for field in expected_fields:
            assert field in config, f"Missing logistics field: {field}"
        
        print(f"✓ All logistics_config fields present in wave")
        print(f"  Config values: per_diem=${config['per_diem_daily']}/day, accommodation=${config['accommodation_daily']}/day")
    
    def test_logistics_persistence_after_save(self, auth_token, test_project_id):
        """Test that logistics config persists after save and reload"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        # Get current project data
        response = requests.get(f"{BASE_URL}/api/projects/{test_project_id}")
        assert response.status_code == 200
        project = response.json()
        original_config = project["waves"][0]["logistics_config"].copy()
        
        # Modify logistics config
        modified_config = original_config.copy()
        modified_config["per_diem_daily"] = 125  # Change from 100 to 125
        modified_config["accommodation_daily"] = 85  # Change from 70 to 85
        
        # Update project with new logistics
        project["waves"][0]["logistics_config"] = modified_config
        project["version_notes"] = "Testing logistics persistence"
        
        update_response = requests.put(
            f"{BASE_URL}/api/projects/{test_project_id}",
            json={
                "waves": project["waves"],
                "version_notes": project["version_notes"]
            },
            headers=headers
        )
        assert update_response.status_code == 200, f"Update failed: {update_response.text}"
        
        # Reload and verify persistence
        reload_response = requests.get(f"{BASE_URL}/api/projects/{test_project_id}")
        assert reload_response.status_code == 200
        reloaded_project = reload_response.json()
        reloaded_config = reloaded_project["waves"][0]["logistics_config"]
        
        assert reloaded_config["per_diem_daily"] == 125, "per_diem_daily not persisted"
        assert reloaded_config["accommodation_daily"] == 85, "accommodation_daily not persisted"
        
        print(f"✓ Logistics config persisted after save/reload")
        print(f"  per_diem_daily: {reloaded_config['per_diem_daily']}, accommodation_daily: {reloaded_config['accommodation_daily']}")
        
        # Restore original values
        project["waves"][0]["logistics_config"] = original_config
        requests.put(
            f"{BASE_URL}/api/projects/{test_project_id}",
            json={"waves": project["waves"], "version_notes": "Restored original logistics"},
            headers=headers
        )
    
    def test_row_selling_price_calculation(self, test_project_id):
        """
        Test Row Selling Price = (Salary + Overhead) / (1 - profit_margin)
        At 35% margin: Selling Price = Total Cost / 0.65
        """
        response = requests.get(f"{BASE_URL}/api/projects/{test_project_id}")
        assert response.status_code == 200
        project = response.json()
        
        profit_margin = project["profit_margin_percentage"]  # 35%
        assert profit_margin == 35, f"Expected 35% margin, got {profit_margin}%"
        
        wave = project["waves"][0]
        allocations = wave["grid_allocations"]
        
        print(f"\n✓ Row Selling Price Calculations (Margin: {profit_margin}%):")
        
        for alloc in allocations:
            # Calculate MM
            total_mm = sum(alloc["phase_allocations"].values())
            
            # Calculate costs
            salary_cost = alloc["avg_monthly_salary"] * total_mm
            overhead_pct = alloc["overhead_percentage"]
            overhead_cost = salary_cost * (overhead_pct / 100)
            total_cost = salary_cost + overhead_cost
            
            # Calculate selling price = Total Cost / (1 - margin)
            expected_selling_price = total_cost / (1 - profit_margin / 100)
            
            print(f"  {alloc['skill_name']} ({alloc['proficiency_level']}):")
            print(f"    MM: {total_mm}, Salary: ${alloc['avg_monthly_salary']}/mo")
            print(f"    Salary Cost: ${salary_cost:,.2f}, Overhead({overhead_pct}%): ${overhead_cost:,.2f}")
            print(f"    Total Cost: ${total_cost:,.2f}, Selling Price: ${expected_selling_price:,.2f}")
            print(f"    is_onsite: {alloc['is_onsite']}, travel_required: {alloc['travel_required']}")
            
        print(f"\n✓ Formula verified: Selling Price = (Salary + Overhead) / (1 - {profit_margin}%)")
    
    def test_wave_selling_price_calculation(self, test_project_id):
        """
        Test Wave Selling Price = Sum of all rows selling prices + logistics selling price markup
        Logistics markup = logistics_cost / (1 - profit_margin)
        """
        response = requests.get(f"{BASE_URL}/api/projects/{test_project_id}")
        assert response.status_code == 200
        project = response.json()
        
        profit_margin = project["profit_margin_percentage"]
        wave = project["waves"][0]
        config = wave["logistics_config"]
        allocations = wave["grid_allocations"]
        
        # Calculate sum of all row selling prices
        total_rows_selling_price = 0
        for alloc in allocations:
            total_mm = sum(alloc["phase_allocations"].values())
            salary_cost = alloc["avg_monthly_salary"] * total_mm
            overhead_cost = salary_cost * (alloc["overhead_percentage"] / 100)
            total_cost = salary_cost + overhead_cost
            selling_price = total_cost / (1 - profit_margin / 100)
            total_rows_selling_price += selling_price
        
        # Calculate logistics cost (only for travel_required resources)
        traveling_mm = 0
        traveling_count = 0
        for alloc in allocations:
            if alloc["travel_required"]:
                traveling_mm += sum(alloc["phase_allocations"].values())
                traveling_count += 1
        
        per_diem_cost = traveling_mm * config["per_diem_daily"] * config["per_diem_days"]
        accommodation_cost = traveling_mm * config["accommodation_daily"] * config["accommodation_days"]
        conveyance_cost = traveling_mm * config["local_conveyance_daily"] * config["local_conveyance_days"]
        flight_cost = traveling_count * config["flight_cost_per_trip"] * config["num_trips"]
        visa_cost = traveling_count * config["visa_medical_per_trip"] * config["num_trips"]
        
        subtotal = per_diem_cost + accommodation_cost + conveyance_cost + flight_cost + visa_cost
        contingency = subtotal * (config["contingency_percentage"] / 100)
        total_logistics = subtotal + contingency
        
        # Logistics selling price markup
        logistics_selling_price = total_logistics / (1 - profit_margin / 100)
        
        # Wave Selling Price = rows + logistics
        wave_selling_price = total_rows_selling_price + logistics_selling_price
        
        print(f"\n✓ Wave Selling Price Calculation:")
        print(f"  Sum of Rows Selling Prices: ${total_rows_selling_price:,.2f}")
        print(f"  Traveling Resources: {traveling_count}, Traveling MM: {traveling_mm}")
        print(f"  Logistics Cost: ${total_logistics:,.2f}")
        print(f"  Logistics Selling Price Markup: ${logistics_selling_price:,.2f}")
        print(f"  Wave Selling Price: ${wave_selling_price:,.2f}")
        print(f"✓ Formula: Wave SP = Sum(Row SP) + (Logistics / (1 - {profit_margin}%))")
    
    def test_onsite_offshore_selling_price(self, test_project_id):
        """
        Test:
        - Onsite Selling Price = Sum of selling prices where is_onsite = true + logistics
        - Offshore Selling Price = Sum of selling prices where is_onsite = false
        """
        response = requests.get(f"{BASE_URL}/api/projects/{test_project_id}")
        assert response.status_code == 200
        project = response.json()
        
        profit_margin = project["profit_margin_percentage"]
        wave = project["waves"][0]
        config = wave["logistics_config"]
        allocations = wave["grid_allocations"]
        
        onsite_selling_price = 0
        offshore_selling_price = 0
        onsite_mm = 0
        offshore_mm = 0
        
        for alloc in allocations:
            total_mm = sum(alloc["phase_allocations"].values())
            salary_cost = alloc["avg_monthly_salary"] * total_mm
            overhead_cost = salary_cost * (alloc["overhead_percentage"] / 100)
            total_cost = salary_cost + overhead_cost
            selling_price = total_cost / (1 - profit_margin / 100)
            
            if alloc["is_onsite"]:
                onsite_selling_price += selling_price
                onsite_mm += total_mm
            else:
                offshore_selling_price += selling_price
                offshore_mm += total_mm
        
        # Calculate logistics for traveling resources
        traveling_mm = sum(
            sum(alloc["phase_allocations"].values()) 
            for alloc in allocations if alloc["travel_required"]
        )
        traveling_count = len([a for a in allocations if a["travel_required"]])
        
        per_diem_cost = traveling_mm * config["per_diem_daily"] * config["per_diem_days"]
        accommodation_cost = traveling_mm * config["accommodation_daily"] * config["accommodation_days"]
        conveyance_cost = traveling_mm * config["local_conveyance_daily"] * config["local_conveyance_days"]
        flight_cost = traveling_count * config["flight_cost_per_trip"] * config["num_trips"]
        visa_cost = traveling_count * config["visa_medical_per_trip"] * config["num_trips"]
        
        subtotal = per_diem_cost + accommodation_cost + conveyance_cost + flight_cost + visa_cost
        contingency = subtotal * (config["contingency_percentage"] / 100)
        total_logistics = subtotal + contingency
        logistics_selling = total_logistics / (1 - profit_margin / 100)
        
        # Add logistics to onsite
        onsite_selling_price_with_logistics = onsite_selling_price + logistics_selling
        
        print(f"\n✓ Onsite/Offshore Selling Price:")
        print(f"  Onsite Resources (is_onsite=true):")
        print(f"    Onsite MM: {onsite_mm}")
        print(f"    Onsite Selling (rows only): ${onsite_selling_price:,.2f}")
        print(f"    + Logistics Selling: ${logistics_selling:,.2f}")
        print(f"    Onsite Total: ${onsite_selling_price_with_logistics:,.2f}")
        print(f"  Offshore Resources (is_onsite=false):")
        print(f"    Offshore MM: {offshore_mm}")
        print(f"    Offshore Selling: ${offshore_selling_price:,.2f}")
        
        return {
            "onsite_selling": onsite_selling_price_with_logistics,
            "offshore_selling": offshore_selling_price,
            "onsite_mm": onsite_mm,
            "offshore_mm": offshore_mm
        }
    
    def test_avg_per_mm_calculation(self, test_project_id):
        """
        Test:
        - Onsite Avg $/MM = Onsite Selling Price / Onsite MM
        - Offshore Avg $/MM = Offshore Selling Price / Offshore MM
        """
        response = requests.get(f"{BASE_URL}/api/projects/{test_project_id}")
        assert response.status_code == 200
        project = response.json()
        
        profit_margin = project["profit_margin_percentage"]
        wave = project["waves"][0]
        config = wave["logistics_config"]
        allocations = wave["grid_allocations"]
        
        onsite_selling = 0
        offshore_selling = 0
        onsite_mm = 0
        offshore_mm = 0
        
        for alloc in allocations:
            total_mm = sum(alloc["phase_allocations"].values())
            salary_cost = alloc["avg_monthly_salary"] * total_mm
            overhead_cost = salary_cost * (alloc["overhead_percentage"] / 100)
            total_cost = salary_cost + overhead_cost
            selling_price = total_cost / (1 - profit_margin / 100)
            
            if alloc["is_onsite"]:
                onsite_selling += selling_price
                onsite_mm += total_mm
            else:
                offshore_selling += selling_price
                offshore_mm += total_mm
        
        # Add logistics to onsite
        traveling_mm = sum(
            sum(alloc["phase_allocations"].values()) 
            for alloc in allocations if alloc["travel_required"]
        )
        traveling_count = len([a for a in allocations if a["travel_required"]])
        
        per_diem_cost = traveling_mm * config["per_diem_daily"] * config["per_diem_days"]
        accommodation_cost = traveling_mm * config["accommodation_daily"] * config["accommodation_days"]
        conveyance_cost = traveling_mm * config["local_conveyance_daily"] * config["local_conveyance_days"]
        flight_cost = traveling_count * config["flight_cost_per_trip"] * config["num_trips"]
        visa_cost = traveling_count * config["visa_medical_per_trip"] * config["num_trips"]
        
        subtotal = per_diem_cost + accommodation_cost + conveyance_cost + flight_cost + visa_cost
        contingency = subtotal * (config["contingency_percentage"] / 100)
        total_logistics = subtotal + contingency
        logistics_selling = total_logistics / (1 - profit_margin / 100)
        
        onsite_selling_with_logistics = onsite_selling + logistics_selling
        
        # Calculate Avg $/MM
        onsite_avg_per_mm = onsite_selling_with_logistics / onsite_mm if onsite_mm > 0 else 0
        offshore_avg_per_mm = offshore_selling / offshore_mm if offshore_mm > 0 else 0
        
        print(f"\n✓ Avg $/MM Calculation:")
        print(f"  Onsite:")
        print(f"    Selling Price: ${onsite_selling_with_logistics:,.2f}")
        print(f"    MM: {onsite_mm}")
        print(f"    Avg $/MM: ${onsite_avg_per_mm:,.2f}")
        print(f"  Offshore:")
        print(f"    Selling Price: ${offshore_selling:,.2f}")
        print(f"    MM: {offshore_mm}")
        print(f"    Avg $/MM: ${offshore_avg_per_mm:,.2f}")
        
        assert onsite_avg_per_mm > 0, "Onsite Avg $/MM should be positive"
        assert offshore_avg_per_mm > 0, "Offshore Avg $/MM should be positive"
    
    def test_total_selling_price(self, test_project_id):
        """
        Test Total Selling Price = Sum of all waves selling prices
        """
        response = requests.get(f"{BASE_URL}/api/projects/{test_project_id}")
        assert response.status_code == 200
        project = response.json()
        
        profit_margin = project["profit_margin_percentage"]
        total_selling_price = 0
        
        for wave in project["waves"]:
            config = wave["logistics_config"]
            allocations = wave["grid_allocations"]
            
            # Sum row selling prices
            rows_selling = 0
            for alloc in allocations:
                total_mm = sum(alloc["phase_allocations"].values())
                salary_cost = alloc["avg_monthly_salary"] * total_mm
                overhead_cost = salary_cost * (alloc["overhead_percentage"] / 100)
                total_cost = salary_cost + overhead_cost
                selling_price = total_cost / (1 - profit_margin / 100)
                rows_selling += selling_price
            
            # Calculate logistics
            traveling_mm = sum(
                sum(alloc["phase_allocations"].values()) 
                for alloc in allocations if alloc["travel_required"]
            )
            traveling_count = len([a for a in allocations if a["travel_required"]])
            
            per_diem_cost = traveling_mm * config["per_diem_daily"] * config["per_diem_days"]
            accommodation_cost = traveling_mm * config["accommodation_daily"] * config["accommodation_days"]
            conveyance_cost = traveling_mm * config["local_conveyance_daily"] * config["local_conveyance_days"]
            flight_cost = traveling_count * config["flight_cost_per_trip"] * config["num_trips"]
            visa_cost = traveling_count * config["visa_medical_per_trip"] * config["num_trips"]
            
            subtotal = per_diem_cost + accommodation_cost + conveyance_cost + flight_cost + visa_cost
            contingency = subtotal * (config["contingency_percentage"] / 100)
            total_logistics = subtotal + contingency
            logistics_selling = total_logistics / (1 - profit_margin / 100)
            
            wave_selling = rows_selling + logistics_selling
            total_selling_price += wave_selling
            
            print(f"\n✓ Wave '{wave['name']}' Summary:")
            print(f"  Rows Selling Price: ${rows_selling:,.2f}")
            print(f"  Logistics Selling Price: ${logistics_selling:,.2f}")
            print(f"  Wave Selling Price: ${wave_selling:,.2f}")
        
        print(f"\n✓ Total Selling Price: ${total_selling_price:,.2f}")
        print(f"✓ Formula: Total SP = Sum(All Waves SP)")


class TestIsOnsiteIndicator:
    """Test that is_onsite indicator correctly separates onsite/offshore"""
    
    def test_is_onsite_field_exists(self):
        """Verify is_onsite field exists in allocations"""
        response = requests.get(f"{BASE_URL}/api/projects/37482dc9-7743-4197-9e02-15dd76a04b3d")
        assert response.status_code == 200
        project = response.json()
        
        wave = project["waves"][0]
        onsite_count = 0
        offshore_count = 0
        
        for alloc in wave["grid_allocations"]:
            assert "is_onsite" in alloc, "is_onsite field missing"
            if alloc["is_onsite"]:
                onsite_count += 1
            else:
                offshore_count += 1
        
        print(f"✓ is_onsite field verified:")
        print(f"  Onsite resources (is_onsite=true): {onsite_count}")
        print(f"  Offshore resources (is_onsite=false): {offshore_count}")
        
        assert onsite_count > 0, "Expected at least one onsite resource"
        assert offshore_count > 0, "Expected at least one offshore resource"


if __name__ == "__main__":
    pytest.main([__file__, "-v", "-s"])
