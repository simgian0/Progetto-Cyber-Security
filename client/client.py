import requests

response = requests.get("http://server:8000")
print("Server says:", response.text)
