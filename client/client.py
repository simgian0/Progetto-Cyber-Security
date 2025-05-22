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

ALL_USER_IDS = list(range(1, 21)) # lista di tutti gli utenti
OWNER_IDS = [1, 2, 4, 5, 7, 8, 10, 11, 13, 16]  # solo manager/impiegato
EXISTING_DRAWING_IDS = list(range(1, 11))  # ipotetici ID esistenti

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
    {
        "action": "POST",
        "drawing_id": None,
        "payload": lambda: get_random_payload(),  # usa funzione
        "user_id": lambda: random.choice(OWNER_IDS) # random tra gli utenti manager e impiegati; si può cambiare con ALL_USER_IDS in quanto il server gestisce i permessi.
    },
    {
        "action": "GET_ONE",
        "drawing_id": lambda: random.choice(EXISTING_DRAWING_IDS),
        "payload": None,
        "user_id": lambda: random.choice(ALL_USER_IDS)
    },
    {
        "action": "PUT",
        "drawing_id": lambda: random.choice(EXISTING_DRAWING_IDS),
        "payload": lambda: get_random_payload(modify_name_only=True),
        "user_id": lambda: random.choice(OWNER_IDS)
    },
    {
        "action": "DELETE",
        "drawing_id": lambda: random.choice(EXISTING_DRAWING_IDS),
        "payload": None,
        "user_id": lambda: random.choice(OWNER_IDS)
    },
]

def run():
    while True: # cicla infinitamente nella sequenza
        for req in TEST_SEQUENCE:
            action = req["action"]
            user_id = req["user_id"]() if callable(req["user_id"]) else req["user_id"]
            drawing_id = req["drawing_id"]() if callable(req["drawing_id"]) else req["drawing_id"]
            payload = req["payload"]() if callable(req["payload"]) else req["payload"]

            print(f"\n - {action} da user {user_id}")
            headers = {"X-User-ID": str(user_id)}  # gestisce il server

            try:
                if action == "GET_ONE":
                    resp = requests.get(f"{BASE_URL}/drawings/{drawing_id}", headers=headers, timeout=5)
                    print(f"[GET_ONE] drawing_id: {drawing_id} -> status_code: {resp.status_code} | {resp.json()}")

                elif action == "POST":
                    resp = requests.post(f"{BASE_URL}/drawings", json=payload, headers=headers, timeout=5)
                    result = resp.json()
                    new_id = result.get("id")
                    if new_id and new_id not in EXISTING_DRAWING_IDS:
                        EXISTING_DRAWING_IDS.append(new_id)
                    print(f"[POST] -> status_code: {resp.status_code} | {resp.json()}")

                elif action == "PUT":
                    resp = requests.put(f"{BASE_URL}/drawings/{drawing_id}", json=payload, headers=headers, timeout=5)
                    print(f"[PUT] drawing_id: {drawing_id} -> status_code: {resp.status_code} | {resp.json()}")

                elif action == "DELETE":
                    resp = requests.delete(f"{BASE_URL}/drawings/{drawing_id}", headers=headers, timeout=5)
                    print(f"[DELETE] drawing_id: {drawing_id} -> status_code: {resp.status_code} | {resp.json()}")
                    if action == "DELETE" and resp.status_code == 200:
                        if drawing_id in EXISTING_DRAWING_IDS:
                            EXISTING_DRAWING_IDS.remove(drawing_id)

            except Exception as e:
                print(f"[ERROR] {action} fallita: {e}")

            time.sleep(10)

if __name__ == "__main__":
    run()

# endpoints to hit – some valid, one intentionally invalid to show 404
'''ENDPOINTS = ["/", "/db-check", "/db-check", "/not-found"]

for path in ENDPOINTS:
    url = f"{BASE_URL}{path}"
    try:
        resp = requests.get(url, timeout=5)
        print(f"[{resp.status_code}] GET {url} -> {resp.text[:60]}")
    except Exception as exc:
        print(f"ERROR reaching {url}: {exc}")
    time.sleep(2)  # pause so that logs are easier to follow'''