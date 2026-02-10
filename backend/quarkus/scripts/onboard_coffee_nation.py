#!/usr/bin/env python3
import json
import requests
import time
import sys
import os
import random

# ==============================================================================
# FoodGrid - Sophisticated Client Onboarding Service (Python Edition)
# 
# Usage: python3 onboard_coffee_nation.py [BASE_URL]
# Focus: Coffee Nation Pitch (High-Fidelity Data & Images)
# ==============================================================================

BASE_URL = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8080"
SUPER_ADMIN_EMAIL = "admin@foodgrid.com"
SUPER_ADMIN_PASS = "123456"

# --- Load High-Fidelity Scraped Data ---
PARSED_MENU_FILE = os.path.join(os.getcwd(), "../../../parsed_menu.json")
if not os.path.exists(PARSED_MENU_FILE):
    # Try current directory too
    PARSED_MENU_FILE = "parsed_menu.json"

scraped_menu = {}
if os.path.exists(PARSED_MENU_FILE):
    try:
        with open(PARSED_MENU_FILE, 'r') as f:
            scraped_menu = json.load(f)
            print(f"Loaded {sum(len(v) for v in scraped_menu.values())} items from {PARSED_MENU_FILE}")
    except Exception as e:
        print(f"Error loading {PARSED_MENU_FILE}: {e}")

COFFEE_NATION_DATA = {
    "name": "Coffee Nation",
    "email": "corporate@coffeenation.com",
    "password": "Coffee@2026",
    "outlets": [
        {"name": "Coffee Nation - FC Road", "lat": 18.5196, "lng": 73.8437},
        {"name": "Coffee Nation - Kalyani Nagar", "lat": 18.5463, "lng": 73.9033},
        {"name": "Coffee Nation - Aundh", "lat": 18.5602, "lng": 73.8031}
    ],
    "menu": scraped_menu if scraped_menu else {
        "Hot Beverages": [
            {
            "name": "Americano",
            "img": "https://airmenusimages.blr1.cdn.digitaloceanspaces.com/item/item_71153_1683268475.5623708.png",
            "price": 170.0,
            "veg": True,
            "desc": "Freshly prepared Americano."
            },
            # ... (other fallback items)
        ]
    }
}


class FoodGridAPI:
    def __init__(self, base_url):
        self.base_url = base_url
        self.session = requests.Session()
        self.super_token = None
        self.client_token = None
        self.client_id = None
        self.admin_id = None

    def log(self, msg):
        print(f"[FoodGrid-Py] {msg}")

    def error(self, msg):
        print(f"[ERROR] {msg}")
        sys.exit(1)

    def login_super_admin(self, email, password):
        self.log("Authenticating Super Admin...")
        try:
            res = self.session.post(f"{self.base_url}/api/v1/admin/auth/login", 
                                  json={"email": email, "password": password})
            if res.status_code == 200:
                self.super_token = res.json().get("accessToken")
                return True
        except:
            pass
            
        # Fallback to bootstrap if login fails
        self.log("Login failed, attempting bootstrap...")
        res = self.session.post(f"{self.base_url}/api/v1/bootstrap/admin",
                              json={"email": email, "password": password, "displayName": "System Admin"})
        if res.status_code in [200, 201]:
            self.super_token = res.json().get("accessToken")
            return True
        return False

    def create_client(self, name, email, password):
        headers = {"Authorization": f"Bearer {self.super_token}"}
        
        # Check if exists
        self.log(f"Checking for existing client: {name}")
        res = self.session.get(f"{self.base_url}/api/v1/admin/tenants", headers=headers)
        if res.status_code == 200:
            for c in res.json():
                if c["contactEmail"] == email:
                    self.client_id = c["id"]
                    self.log(f"Found existing client ID: {self.client_id}")
                    return self.client_id

        # Create
        self.log(f"Creating new client: {name}")
        payload = {
            "name": name,
            "contactEmail": email,
            "status": "ACTIVE",
            "adminEmail": email,
            "adminPassword": password,
            "adminDisplayName": f"{name} HQ"
        }
        res = self.session.post(f"{self.base_url}/api/v1/admin/tenants", headers=headers, json=payload)
        
        if res.status_code in [200, 201]:
            self.client_id = res.json().get("id")
            return self.client_id
        else:
            self.error(f"Failed to create client: {res.text}")

    def login_client(self, email, password):
        self.log("Logging in as Client Admin...")
        res = self.session.post(f"{self.base_url}/api/v1/admin/auth/login", 
                              json={"email": email, "password": password})
        if res.status_code == 200:
            data = res.json()
            self.client_token = data.get("accessToken")
            self.admin_id = data.get("admin", {}).get("id")
            return True
        self.error(f"Client login failed: {res.text}")

    def create_outlet(self, name, lat, lng):
        headers = {"Authorization": f"Bearer {self.client_token}"}
        
        # Check exists
        res = self.session.get(f"{self.base_url}/api/v1/admin/outlets", headers=headers)
        for o in res.json():
            if o["name"] == name:
                self.log(f"Outlet exists: {name}")
                return o["id"]

        self.log(f"Creating Outlet: {name}")
        payload = {
            "ownerId": self.admin_id,
            "name": name,
            "timezone": "Asia/Kolkata",
            # We could add lat/lng if the API supports it, currently stored in name/metadata or ignored
        }
        res = self.session.post(f"{self.base_url}/api/v1/admin/outlets", headers=headers, json=payload)
        if res.status_code in [200, 201]:
            return res.json().get("id")
        self.error(f"Failed to create outlet: {res.text}")

    def create_category(self, outlet_id, name, sort_order):
        headers = {"Authorization": f"Bearer {self.client_token}"}
        res = self.session.post(f"{self.base_url}/api/v1/admin/outlets/{outlet_id}/menu/categories",
                              headers=headers,
                              json={"name": name, "sortOrder": sort_order, "status": "ACTIVE"})
        if res.status_code in [200, 201]:
            return res.json().get("id")
        # If conflict, find ID
        res = self.session.get(f"{self.base_url}/api/v1/admin/outlets/{outlet_id}/menu/categories", headers=headers)
        for c in res.json():
            if c["name"] == name:
                return c["id"]
        return None

    def create_item(self, outlet_id, category_id, item_data):
        headers = {"Authorization": f"Bearer {self.client_token}"}
        # Check duplicate by name? (Simplified: just post, backend handles or ignores)
        payload = {
            "categoryId": category_id,
            "name": item_data["name"],
            "description": item_data["desc"],
            "isVeg": item_data["veg"],
            "basePrice": item_data["price"],
            "images": [
                {
                    "imageUrl": item_data["img"],
                    "sortOrder": 0,
                    "isPrimary": True
                }
            ] if item_data.get("img") else [],
            "status": "ACTIVE"
        }
        res = self.session.post(f"{self.base_url}/api/v1/admin/outlets/{outlet_id}/menu/items",
                              headers=headers, json=payload)
        if res.status_code in [200, 201]:
            self.log(f"   + Menu Item: {item_data['name']}")
        elif res.status_code == 409:
            # If exists, we might need to update to ensure high quality images are there
            # Retrieve the item ID first (simplified logic here)
            # For now, we assume if it exists, it might not have the image.
            # But the Quarkus API might not support PUT on duplicate POST.
            # Let's try to get all items, find ID, and PUT update.
            self.log(f"   . Item exists: {item_data['name']} - Updating details...")
            
            # Find ID
            items_res = self.session.get(f"{self.base_url}/api/v1/admin/outlets/{outlet_id}/menu/items", headers=headers)
            item_id = None
            for i in items_res.json():
                if i["name"] == item_data["name"] and i["categoryId"] == category_id:
                    item_id = i["id"]
                    break
            
            if item_id:
                # PUT Update
                res_put = self.session.put(f"{self.base_url}/api/v1/admin/outlets/{outlet_id}/menu/items/{item_id}",
                                        headers=headers, json=payload)
                if res_put.status_code < 300:
                    self.log(f"   ✓ Updated Image/Details for {item_data['name']}")
                else:
                    self.log(f"   ! Failed to update {item_data['name']}")
        else:
            self.log(f"   ! Failed to add {item_data['name']}: {res.status_code}")

    def create_tables_and_employees(self, outlet_id, outlet_idx):
        headers = {"Authorization": f"Bearer {self.client_token}"}
        
        # Tables
        tables = [
            {"code": "T1", "name": "Window Seat", "cap": 2},
            {"code": "C1", "name": "Cozy Corner", "cap": 4},
            {"code": "B1", "name": "Bar Stool", "cap": 1}
        ]
        for t in tables:
            self.session.post(f"{self.base_url}/api/v1/admin/outlets/{outlet_id}/tables",
                            headers=headers,
                            json={"tableCode": t["code"], "displayName": t["name"], 
                                  "capacity": t["cap"], "status": "ACTIVE"})
        
        # Employees
        # Simplified: one manager per outlet
        email = f"manager.{outlet_idx}@coffeenation.local"
        self.session.post(f"{self.base_url}/api/v1/admin/outlets/{outlet_id}/employees",
                        headers=headers,
                        json={"displayName": "Store Manager", "email": email, 
                              "pin": "123456", "status": "ACTIVE"})

def main():
    api = FoodGridAPI(BASE_URL)
    
    # 1. Super Admin Auth
    if not api.login_super_admin(SUPER_ADMIN_EMAIL, SUPER_ADMIN_PASS):
        api.error("Super Admin login failed.")
        
    # 2. Client Creation
    api.create_client(COFFEE_NATION_DATA["name"], 
                     COFFEE_NATION_DATA["email"], 
                     COFFEE_NATION_DATA["password"])
                     
    # 3. Client Login
    api.login_client(COFFEE_NATION_DATA["email"], COFFEE_NATION_DATA["password"])
    
    # 4. Outlets & Menu
    for idx, outlet in enumerate(COFFEE_NATION_DATA["outlets"]):
        outlet_id = api.create_outlet(outlet["name"], outlet["lat"], outlet["lng"])
        api.create_tables_and_employees(outlet_id, idx+1)
        
        # Menu Seeding
        api.log(f"Seeding Menu for {outlet['name']}...")
        sort_order = 1
        for cat_name, items in COFFEE_NATION_DATA["menu"].items():
            cat_id = api.create_category(outlet_id, cat_name, sort_order)
            sort_order += 1
            
            if cat_id:
                for item in items:
                    api.create_item(outlet_id, cat_id, item)
                    
    api.log("✅ Onboarding Complete! Pitch Ready.")
    api.log(f"Client Email: {COFFEE_NATION_DATA['email']}")
    api.log(f"Password:     {COFFEE_NATION_DATA['password']}")

if __name__ == "__main__":
    main()
