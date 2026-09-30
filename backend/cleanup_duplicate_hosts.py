import json
import os
from dotenv import load_dotenv
from pymongo import MongoClient

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")

if not MONGO_URI:
    raise RuntimeError("MONGO_URI is missing from backend/.env")

client = MongoClient(MONGO_URI)
collection = client["ai_csv_analyzer"]["datasets"]

MATCH_FIELDS = [
    "file",
    "rows",
    "columns",
    "column_names",
    "missing_values",
    "duplicate_rows",
    "numeric_columns",
    "visualization_numeric_columns",
    "categorical_columns",
    "boolean_columns",
    "datetime_columns",
    "identifier_columns",
    "anomaly_columns",
    "column_information",
    "statistics",
    "anomaly_status",
    "anomaly_count",
    "anomalous_rows",
    "preview",
    "visualization_data",
]


def same_analysis(a, b):
    for field in MATCH_FIELDS:
        left = json.dumps(a.get(field), sort_keys=True, default=str)
        right = json.dumps(b.get(field), sort_keys=True, default=str)
        if left != right:
            return False
    return True


hosts = list(collection.find({"file": "hosts.csv"}).sort("created_at", 1))

if len(hosts) <= 1:
    print("No duplicate hosts.csv documents found.")
    raise SystemExit(0)

hashed = [doc for doc in hosts if doc.get("file_hash")]
legacy = [doc for doc in hosts if not doc.get("file_hash")]

removed = 0

if hashed:
    reference = hashed[0]
    for doc in legacy:
        if same_analysis(doc, reference):
            collection.delete_one({"_id": doc["_id"]})
            removed += 1
            print(f"Removed legacy duplicate: {doc['_id']}")
        else:
            print(f"Kept non-identical legacy document: {doc['_id']}")
else:
    print("No hashed hosts.csv document exists yet; nothing was removed.")

remaining = collection.count_documents({"file": "hosts.csv"})
print(f"Removed: {removed}")
print(f"Remaining hosts.csv documents: {remaining}")

client.close()
