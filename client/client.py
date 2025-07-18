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
EXISTING_DRAWING_IDS = list(range(1, 11))  # ID dei disegni esistenti
TEAM_1_DRAWINGS_IDS = [1, 7, 9] # drawings id del team 1
TEAM_2_DRAWINGS_IDS = [2, 8] # drawings id del team 2
TEAM_3_DRAWINGS_IDS = [3, 6] # drawings id del team 3
TEAM_4_DRAWINGS_IDS = [4, 5, 10] # drawings id del team 4

def get_random_payload(modify_name_only=False):
    if modify_name_only:
        return {
            "name": f"AutoDrawing_{random.randint(1000,9999)}"
        }
    else:
        return {
            "name": f"AutoDrawing_{random.randint(1000,9999)}",
            "owner_id": random.choice(OWNER_IDS),
            "points": '[{"x":1,"y":1,"color":"blue"}]',
            "lines": '[{"start_x":1,"start_y":1,"end_x":2,"end_y":2,"color":"black"}]',
            "texts": '[{"x":1,"y":1,"content":"AutoGen","font_size":10,"color":"gray"}]'
        }

# Sequenza predefinita per test
TEST_SEQUENCE = [

    {   "action": "POST",
        "drawing_id": None,
        "payload": lambda: get_random_payload(),  # usa funzione
        "user_id": lambda: random.choice(OWNER_IDS) # random tra gli utenti manager e impiegati; si può cambiare con ALL_USER_IDS in quanto il server gestisce i permessi.
    },
    {
        "action": "GET_ONE",
        "drawing_id": lambda: random.choice(TEAM_1_DRAWINGS_IDS),
        "payload": None,
        "user_id": lambda: random.choice(TEAM_1_CONSUL_IDS)
    },
    {
        "action": "PUT",
        "drawing_id": lambda: random.choice(TEAM_2_DRAWINGS_IDS),
        "payload": lambda: get_random_payload(modify_name_only=True),
        "user_id": lambda: random.choice(TEAM_2_MANAGER_IDS)
    },
    {
        "action": "DELETE",
        "drawing_id": lambda: random.choice(TEAM_3_DRAWINGS_IDS),
        "payload": None,
        "user_id": lambda: random.choice(TEAM_3_IMPIEG_IDS)
    },
    {
        "action": "PUT",
        "drawing_id": 11, # test per checkTeam
        "user_id": 1, # 1 fa parte dello stesso team quindi può accedervi
        "payload": lambda user_id=None: get_random_payload(user_id, modify_name_only=True)
    },
    {
        "action": "PUT",
        "drawing_id": 11, # test per checkTeam
        "user_id": 2, # il 2 è l'owner quindi può accedervi
        "payload": lambda user_id=None: get_random_payload(user_id, modify_name_only=True)
    },
    {
        "action": "PUT",
        "drawing_id": 11, # test per checkTeam
        "user_id": 4, # user 4 fa parte del team_3 quindi non può accedere
        "payload": lambda user_id=None: get_random_payload(user_id, modify_name_only=True)
    },
    {
        "action": "POST",
        "drawing_id": None,
        "user_id": lambda: random.choice(TEAM_1_IMPIEG_IDS),
        "payload": lambda user_id=None: get_random_payload(user_id, random_team=True) # pubblica su team casuali con un impiegato
    },
    {
        "action": "POST",
        "drawing_id": None,
        "user_id": lambda: random.choice(TEAM_1_IMPIEG_IDS),
        "payload": lambda user_id=None: get_random_payload(user_id) # pubblica su team giusto con un impiegato
    },
    """# ✅ Policy 1: GET deve sempre passare (anche fuori orario o da IP bloccato)
    {
        "action": "GET_ONE",
        "drawing_id": lambda: 1,  # qualsiasi ID valido
        "payload": None,
        "user_id": lambda: 3  # consulente
    },

    # ❌ Policy 2: IP bloccato → deve essere inserito in blocklist.json → aspettati timeout
    {
        "action": "POST",
        "drawing_id": None,
        "user_id": lambda: 10,  # impiegato
        "payload": lambda user_id=None: get_random_payload(user_id)  # qualsiasi payload valido
    },

    # ❌ Policy 3: Rete non consentita → container con IP non 172.18/19/20.x
    {
        "action": "PUT",
        "drawing_id": lambda: 4,  # disegno team 4
        "user_id": lambda: 5,     # manager team 4
        "payload": lambda user_id=None: get_random_payload(user_id, modify_name_only=True)
    },

    # ⚠️ Policy 4: Fuori orario → lo script alert deve segnalarlo (ma non bloccare)
    {
        "action": "POST",
        "drawing_id": None,
        "user_id": lambda: 13,  # impiegato team 1
        "payload": lambda user_id=None: get_random_payload(user_id)
    },

    # ✅ Policy 1 di nuovo (GET sempre concesso)
    {
        "action": "GET_ONE",
        "drawing_id": lambda: 5,
        "payload": None,
        "user_id": lambda: 7
    },

    # ❌ Policy 2: IP bloccato (fai partire questa da container con IP nella blocklist)
    {
        "action": "DELETE",
        "drawing_id": lambda: 3,
        "user_id": lambda: 14,  # manager
        "payload": None
    },"""
]

def run():
    while True: # cicla infinitamente nella sequenza
        for req in TEST_SEQUENCE:
            action = req["action"]
            user_id = req["user_id"]() if callable(req["user_id"]) else req["user_id"]
            drawing_id = req["drawing_id"]() if callable(req["drawing_id"]) else req["drawing_id"]
            payload = req["payload"]() if callable(req["payload"]) else req["payload"]

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