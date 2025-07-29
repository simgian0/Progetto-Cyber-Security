"""Simple client that generates multiple HTTP requests so they appear
in Squid (and, therefore, in Splunk). The HTTP(S)_PROXY env‑vars set in
docker‑compose ensure the traffic is routed through Squid.
"""
import os
import time
import requests

BASE_URL = os.getenv("SERVER_URL", "http://192.168.102.2:8000")

for path in ENDPOINTS:
    url = f"{BASE_URL}{path}"
    try:
        resp = requests.get(url, timeout=5)
        print(f"[{resp.status_code}] GET {url} -> {resp.text[:60]}")
    except Exception as exc:
        print(f"ERROR reaching {url}: {exc}")
    time.sleep(2)  # pause so that logs are easier to follow