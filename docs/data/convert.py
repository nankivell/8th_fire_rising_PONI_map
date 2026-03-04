import json
import csv

# Path to your JSON file
input_file = "events.json"

# Path to your output CSV file
output_file = "events.csv"

# Load JSON
with open(input_file, "r") as f:
    data = json.load(f)

# If the file is empty or not a list, stop
if not isinstance(data, list):
    raise ValueError("JSON root must be a list of objects.")

# Extract CSV fieldnames from keys of the first record
fieldnames = list(data[0].keys())

# Write CSV
with open(output_file, "w", newline="", encoding="utf-8") as f:
    writer = csv.DictWriter(f, fieldnames=fieldnames)
    writer.writeheader()
    writer.writerows(data)

print(f"CSV successfully written to: {output_file}")
