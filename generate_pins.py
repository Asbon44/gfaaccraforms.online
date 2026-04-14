import json
import random

pins = []
for i in range(1000):
    serialNumber = f"GFA-{10000 + i}"
    pin = str(random.randint(100000, 999999))
    pins.append({
        "serialNumber": serialNumber,
        "pin": pin
    })

file_content = f"const GFA_PINS = {json.dumps(pins, indent=2)};"

with open("data.js", "w") as f:
    f.write(file_content)

print("Created data.js with 1000 pins.")
