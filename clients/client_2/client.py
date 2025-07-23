"""Questo client invia ogni 10 secondi una richiesta al server tra
GET_ONE, POST, PUT e DELETE. NOTA: non si comporta come un user specifico
ma come tutti i manager e impiegati. TO DO: modificare per rendere coerente 
con il reale comportamente dei due ruoli - manager (read/write/delete), impiegato (read/write)
"""
import os
import time
import requests
import random

BASE_URL = os.getenv("SERVER_URL", "http://server:8000")

# ------ ARRAY PER TEST ------
# USERS
ALL_USER_IDS = list(range(1, 21)) # lista di tutti gli utenti
ALL_TEAM_1_IDS = [1, 3, 10, 13, 17] # tutti gli user id del team 1 (tutti i ruoli)
ALL_TEAM_2_IDS = [2, 6, 11, 15, 19] # tutti gli user id del team 2 (tutti i ruoli)
ALL_TEAM_3_IDS = [4, 8, 9, 14, 18] # tutti gli user id del team 3 (tutti i ruoli)
ALL_TEAM_4_IDS = [5, 7, 12, 16, 20] # tutti gli user id del team 4 (tutti i ruoli)
TEAM_1_MANAGER_IDS = [1, 17] # user id dei manager del team 1
TEAM_2_MANAGER_IDS = [11] # user id dei manager del team 2
TEAM_3_MANAGER_IDS = [8, 14] # user id dei manager del team 3
TEAM_4_MANAGER_IDS = [5, 20] # user id dei manager del team 4
TEAM_1_IMPIEG_IDS = [10, 13] # user id degli impiegati del team 1
TEAM_2_IMPIEG_IDS = [2, 19] # user id degli impiegati del team 2
TEAM_3_IMPIEG_IDS = [4] # user id degli impiegati del team 3
TEAM_4_IMPIEG_IDS = [7, 16] # user id degli impiegati del team 4
TEAM_1_CONSUL_IDS = [3] # user id dei consulenti del team 1
TEAM_2_CONSUL_IDS = [6, 15] # user id dei consulenti del team 2
TEAM_3_CONSUL_IDS = [9, 18] # user id dei consulenti del team 3
TEAM_4_CONSUL_IDS = [12] # user id dei consulenti del team 4
OWNER_IDS = [1, 2, 4, 5, 7, 8, 10, 11, 13, 14, 16, 17, 19, 20]  # tutti i manager/impiegato
# DRAWINGS
EXISTING_DRAWING_IDS = list(range(1, 12))  # ID dei disegni esistenti
TEAM_1_DRAWINGS_IDS = [1, 7, 9] # drawings id del team 1
TEAM_2_DRAWINGS_IDS = [2, 8] # drawings id del team 2
TEAM_3_DRAWINGS_IDS = [3, 6] # drawings id del team 3
TEAM_4_DRAWINGS_IDS = [4, 5, 10] # drawings id del team 4

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

# Sequenza user 2, 3/4 giusto
TEST_SEQUENCE = [
    {
        "action": "POST",
        "drawing_id": None,
        "user_id": 2,
        "payload": lambda user_id=None: get_random_payload(user_id)
    },
    {
        "action": "GET_ONE",
        "drawing_id": lambda: random.choice(EXISTING_DRAWING_IDS),
        "payload": None,
        "user_id": 2
    },
    {
        "action": "PUT",
        "drawing_id": lambda: random.choice(TEAM_2_DRAWINGS_IDS),
        "user_id": 2,
        "payload": lambda user_id=None: get_random_payload(user_id, modify_name_only=True)
    },
    {
        "action": "DELETE", # non permesso
        "drawing_id": lambda: random.choice(TEAM_2_DRAWINGS_IDS),
        "payload": None,
        "user_id": 2
    }
]

def run():
    while True: # cicla infinitamente nella sequenza
        for req in TEST_SEQUENCE:
            action = req["action"]
            user_id = req["user_id"]() if callable(req["user_id"]) else req["user_id"]
            drawing_id = req["drawing_id"]() if callable(req["drawing_id"]) else req["drawing_id"]
            payload = req["payload"](user_id) if callable(req["payload"]) else req["payload"]

            print(f"\n - {action} da user {user_id}")
            headers = {"X-User-ID": str(user_id)}  # gestisce il server (come se user_id fosse l'utente autenticato)

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