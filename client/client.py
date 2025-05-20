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

def run():
    while True:
        action = random.choice(["GET_ONE", "POST", "PUT", "DELETE"])
        print(f"Azione scelta dal client: {action}")
        try:
            drawing_id = random.choice(EXISTING_DRAWING_IDS)

            if action == "GET_ONE":
                resp = requests.get(f"{BASE_URL}/drawings/{drawing_id}", timeout=5)
                print(f"[GET_ONE] id {drawing_id} -> {resp.status_code}")

            elif action == "POST":
                payload = get_random_payload()
                resp = requests.post(f"{BASE_URL}/drawings", json=payload, timeout=5)
                new_id = resp.json().get('id')
                if new_id:
                    EXISTING_DRAWING_IDS.append(new_id)
                print(f"[POST] created id {new_id}")

            elif action == "PUT":
                payload = get_random_payload(modify_name_only=True)
                resp = requests.put(f"{BASE_URL}/drawings/{drawing_id}", json=payload, timeout=5)
                print(f"[PUT] updated id {drawing_id}")

            elif action == "DELETE":
                resp = requests.delete(f"{BASE_URL}/drawings/{drawing_id}", timeout=5)
                if resp.status_code == 200 and drawing_id in EXISTING_DRAWING_IDS:
                    EXISTING_DRAWING_IDS.remove(drawing_id)
                print(f"[DELETE] removed id {drawing_id}")

        except Exception as e:
            print(f"[ERROR] {action} failed: {e}")

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