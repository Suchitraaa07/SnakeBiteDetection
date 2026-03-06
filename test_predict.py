import requests

url = "http://localhost:8000/predict"
file_path = "/Users/swapnilvpotdar/Downloads/cobraTest.jpg"  # <-- change this to your image path

with open(file_path, "rb") as f:
    files = {"file": f}
    response = requests.post(url, files=files)

print("Status code:", response.status_code)
print("Response:", response.text)
