import json
import sys
import os

def pretty_print_json(input_path, output_path=None):
    # Load the JSON file
    with open(input_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    # If no output path is given, create one automatically
    if output_path is None:
        base, ext = os.path.splitext(input_path)
        output_path = f"{base}_pretty{ext}"

    # Pretty-print JSON with indentation and sorted keys
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=4, ensure_ascii=False)

    print(f"Pretty JSON written to: {output_path}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python3 pretty_print_json.py <input_json> [output_json]")
        sys.exit(1)

    input_file = sys.argv[1]
    output_file = sys.argv[2] if len(sys.argv) > 2 else None

    pretty_print_json(input_file, output_file)
