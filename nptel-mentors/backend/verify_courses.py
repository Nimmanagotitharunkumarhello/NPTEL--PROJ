
import requests
import json

try:
    response = requests.get('http://127.0.0.1:5000/get-courses')
    if response.status_code == 200:
        data = response.json()
        print(f"Success! Found {len(data['courses'])} courses.")
        print("First 3 courses:")
        print(json.dumps(data['courses'][:3], indent=2))
    else:
        print(f"Failed: {response.status_code} - {response.text}")
except Exception as e:
    print(f"Error: {e}")
