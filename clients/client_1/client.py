"""This client sends a request to the server every 10 seconds,
randomly choosing from GET_ONE, POST, PUT, or DELETE.
"""

import os
import time
import requests
import random

BASE_URL = os.getenv("SERVER_URL", "http://server:8000")

# ------ ARRAY for TESTING ------
# USERS
ALL_USER_IDS = list(range(1, 21))  # list of all user IDs
ALL_TEAM_1_IDS = [1, 3, 10, 13, 17]  # user IDs in team 1 (all roles)
ALL_TEAM_2_IDS = [2, 6, 11, 15, 19]  # user IDs in team 2 (all roles)
ALL_TEAM_3_IDS = [4, 8, 9, 14, 18]  # user IDs in team 3 (all roles)
ALL_TEAM_4_IDS = [5, 7, 12, 16, 20]  # user IDs in team 4 (all roles)

TEAM_1_MANAGER_IDS = [1, 17]  # manager user IDs in team 1
TEAM_2_MANAGER_IDS = [11]  # manager user IDs in team 2
TEAM_3_MANAGER_IDS = [8, 14]  # manager user IDs in team 3
TEAM_4_MANAGER_IDS = [5, 20]  # manager user IDs in team 4

TEAM_1_IMPIEG_IDS = [10, 13]  # employee user IDs in team 1
TEAM_2_IMPIEG_IDS = [2, 19]  # employee user IDs in team 2
TEAM_3_IMPIEG_IDS = [4]  # employee user IDs in team 3
TEAM_4_IMPIEG_IDS = [7, 16]  # employee user IDs in team 4

TEAM_1_CONSUL_IDS = [3]  # consultant user IDs in team 1
TEAM_2_CONSUL_IDS = [6, 15]  # consultant user IDs in team 2
TEAM_3_CONSUL_IDS = [9, 18]  # consultant user IDs in team 3
TEAM_4_CONSUL_IDS = [12]  # consultant user IDs in team 4

OWNER_IDS = [1, 2, 4, 5, 7, 8, 10, 11, 13, 14, 16, 17, 19, 20]  # all managers and employees

# DRAWINGS
EXISTING_DRAWING_IDS = list(range(1, 12))  # IDs of existing drawings
TEAM_1_DRAWINGS_IDS = [1, 7, 9]  # drawing IDs belonging to team 1
TEAM_2_DRAWINGS_IDS = [2, 8]  # drawing IDs belonging to team 2
TEAM_3_DRAWINGS_IDS = [3, 6]  # drawing IDs belonging to team 3
TEAM_4_DRAWINGS_IDS = [4, 5, 10]  # drawing IDs belonging to team 4

# Generates a random payload for POST and PUT requests.
# If modify_name_only=True, only the name is modified.
# If random_team=True, assigns a team at random.
# Otherwise, team is selected based on user_id membership.
def get_random_payload(user_id, modify_name_only=False, random_team=False):
    if modify_name_only:
        return {
            "name": f"AutoDrawing_{random.randint(1000,9999)}"
        }
    else:
        if random_team:
            team = random.choice(["team_1", "team_2", "team_3", "team_4"])
        else:
            if user_id in ALL_TEAM_1_IDS:
                team = "team_1"
            elif user_id in ALL_TEAM_2_IDS:
                team = "team_2"
            elif user_id in ALL_TEAM_3_IDS:
                team = "team_3"
            elif user_id in ALL_TEAM_4_IDS:
                team = "team_4"
            else:
                team = "unknown"

        return {
            "name": f"AutoDrawing_{random.randint(1000,9999)}",
            "owner_id": user_id,
            "target_team": team,
            "points": '[{"x":1,"y":1,"color":"blue"}]',
            "lines": '[{"start_x":1,"start_y":1,"end_x":2,"end_y":2,"color":"black"}]',
            "texts": '[{"x":1,"y":1,"content":"AutoGen","font_size":10,"color":"gray"}]'
        }

# Test sequence for user 11. Almost all operations are valid for this user.
TEST_SEQUENCE = [
    {
        "action": "POST",
        "drawing_id": None,
        "user_id": 11,
        "payload": lambda user_id=None: get_random_payload(user_id, random_team=True)
    },
    {
        "action": "GET_ONE",
        "drawing_id": lambda: random.choice(TEAM_1_DRAWINGS_IDS),
        "payload": None,
        "user_id": 11
    },
    {
        "action": "PUT",
        "drawing_id": lambda: random.choice(TEAM_2_DRAWINGS_IDS),
        "user_id": 11,
        "payload": lambda user_id=None: get_random_payload(user_id, modify_name_only=True)
    },
    {
        "action": "DELETE",
        "drawing_id": lambda: random.choice(TEAM_2_DRAWINGS_IDS),
        "payload": None,
        "user_id": 11
    }
]

# Infinite loop that iterates through the test sequence,
# sending one request every 10 seconds.
# Each request uses headers to simulate an authenticated user via user_id.
# Handles GET_ONE, POST, PUT, and DELETE with appropriate payloads and logging.
def run():
    while True:
        for req in TEST_SEQUENCE:
            action = req["action"]
            user_id = req["user_id"]() if callable(req["user_id"]) else req["user_id"]
            drawing_id = req["drawing_id"]() if callable(req["drawing_id"]) else req["drawing_id"]
            payload = req["payload"](user_id) if callable(req["payload"]) else req["payload"]

            print(f"\n - {action} da user {user_id}")
            headers = {"X-User-ID": str(user_id), # user_id authenticated
                       "X-Mac-Address": "02:42:ac:11:00:01"}  # client mac_address
            
            try:
                if action == "GET_ONE":
                    resp = requests.get(f"{BASE_URL}/api/drawings/{drawing_id}", headers=headers, timeout=5)
                    print(f"[GET_ONE] drawing_id: {drawing_id} | resp: {resp.json()}")

                elif action == "POST":
                    resp = requests.post(f"{BASE_URL}/api/drawings", json=payload, headers=headers, timeout=5)
                    result = resp.json()
                    new_id = result.get("id")
                    if new_id and new_id not in EXISTING_DRAWING_IDS:
                        EXISTING_DRAWING_IDS.append(new_id)
                    print(f"[POST] | resp: {resp.json()}")

                elif action == "PUT":
                    resp = requests.put(f"{BASE_URL}/api/drawings/{drawing_id}", json=payload, headers=headers, timeout=5)
                    print(f"[PUT] drawing_id: {drawing_id} | resp: {resp.json()}")

                elif action == "DELETE":
                    resp = requests.delete(f"{BASE_URL}/api/drawings/{drawing_id}", headers=headers, timeout=5)
                    print(f"[DELETE] drawing_id: {drawing_id} | resp: {resp.json()}")
                    if action == "DELETE" and resp.status_code == 200:
                        if drawing_id in EXISTING_DRAWING_IDS:
                            EXISTING_DRAWING_IDS.remove(drawing_id)

            except Exception as e:
                print(f"[ERROR] {action} fallita: {e}")

            time.sleep(10)

if __name__ == "__main__":
    run()