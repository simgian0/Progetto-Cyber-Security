import requests
import time

try:
    print("[Client] Sending request to server...")
    response = requests.get("http://server:8000")
    print("Server says:", response.text)
except Exception as e:
    print("[Client] Request failed:", e)

# Mantieni il container attivo per ispezione
while True:
    time.sleep(100)
