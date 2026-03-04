import csv
import json
import copy
from pathlib import Path

# === CONFIG: update these filenames if needed ===
EVENTS_JSON = "events.json"
CSV_FILE = "PONI UP - Nessie's copy.csv"
OUTPUT_JSON = "events_merged.json"

# If your CSV uses different column names for these, update them here
# e.g. "Date", "Latitude", "Longitude", "Project", etc.
COLUMN_MAP = {
    # JSON field : CSV column name
    "id": None,              # If your CSV has an ID column, put its name here
    "date": "date",          # e.g. "date" or "Date"
    "latitude": "latitude",  # e.g. "latitude" or "Latitude"
    "longitude": "longitude",
    "location": "location",  # e.g. "Province" or "Location"
    "description": "description"  # e.g. "Project" or "Description"
    # Any other fields that appear in your JSON and also as columns:
    # "time": "time",
    # "graphic": "graphic",
}

# ---- load existing events.json ----
events_path = Path(EVENTS_JSON)
csv_path = Path(CSV_FILE)

if not events_path.exists():
    raise FileNotFoundError(f"Could not find {events_path.resolve()}")

if not csv_path.exists():
    raise FileNotFoundError(f"Could not find {csv_path.resolve()}")

with events_path.open("r", encoding="utf-8") as f:
    events = json.load(f)

if not isinstance(events, list) or not events:
    raise ValueError("events.json is empty or not a list")

# Use the first event as a template so we keep the exact format/keys
template_event = copy.deepcopy(events[0])

# Collect existing IDs so we don't create duplicates
existing_ids = set()
for ev in events:
    ev_id = str(ev.get("id", "")).strip()
    if ev_id:
        existing_ids.add(ev_id)


def make_unique_id(base_id: str) -> str:
    """
    Ensure we generate a unique event ID that doesn't collide with existing ones.
    """
    if not base_id:
        base_id = str(len(existing_ids) + 1)

    base_id = str(base_id).strip()
    candidate = base_id

    suffix = 1
    while candidate in existing_ids:
        candidate = f"{base_id}_{suffix}"
        suffix += 1

    existing_ids.add(candidate)
    return candidate


# ---- read CSV and build new events ----
with csv_path.open("r", encoding="utf-8-sig", newline="") as f:
    reader = csv.DictReader(f)

    for row in reader:
        # Skip totally empty rows
        if not any(v and str(v).strip() for v in row.values()):
            continue

        # Start from template so all fields are present
        new_event = copy.deepcopy(template_event)

        # Fill fields from CSV using COLUMN_MAP
        for json_field, csv_col in COLUMN_MAP.items():
            if csv_col is None:
                # We'll handle ID separately below
                continue

            if csv_col not in row:
                # Column isn't in CSV; leave template value as-is
                continue

            value = row[csv_col]

            # Normalize latitude/longitude to strings (as timemap expects)
            if json_field in ("latitude", "longitude"):
                if value is None or str(value).strip() == "":
                    new_event[json_field] = ""
                else:
                    new_event[json_field] = str(value).strip()
            else:
                # Generic string trim
                if value is None:
                    new_event[json_field] = ""
                else:
                    new_event[json_field] = str(value).strip()

        # Handle ID
        csv_id = None
        if COLUMN_MAP.get("id"):
            csv_id = row.get(COLUMN_MAP["id"])
        new_event["id"] = make_unique_id(csv_id or "")

        # If your JSON has fields like "sources", "filters", "associations", "graphic", "time"
        # and you DON'T have matching CSV columns, the template values will be preserved.
        # If you want to *reset* them, uncomment or adjust these lines:

        # new_event["sources"] = []
        # new_event["filters"] = []
        # new_event["associations"] = []
        # new_event["graphic"] = False
        # new_event["time"] = ""

        # Finally, append
        events.append(new_event)

# ---- write merged JSON (pretty-printed) ----
with Path(OUTPUT_JSON).open("w", encoding="utf-8") as f:
    json.dump(events, f, ensure_ascii=False, indent=2)

print(f"Done! Wrote {len(events)} total events to {OUTPUT_JSON}")
