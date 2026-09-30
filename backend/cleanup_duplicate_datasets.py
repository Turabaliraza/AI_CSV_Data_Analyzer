import json
import os
import hashlib
from datetime import datetime

from dotenv import load_dotenv
from pymongo import MongoClient


# =========================================================
# MONGODB SETUP
# =========================================================

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")

if not MONGO_URI:
    raise RuntimeError("MONGO_URI was not found in backend/.env")

client = MongoClient(MONGO_URI)
db = client["ai_csv_analyzer"]
datasets_collection = db["datasets"]


# =========================================================
# DATASET FINGERPRINT
# =========================================================

IGNORED_FIELDS = {
    "_id",
    "created_at",
    "file_hash",
    "file_size",
    "message",
    "already_analyzed"
}


def dataset_fingerprint(document):
    """Create a stable fingerprint for historical dataset documents."""

    content = {
        key: value
        for key, value in document.items()
        if key not in IGNORED_FIELDS
    }

    payload = json.dumps(
        content,
        sort_keys=True,
        default=str,
        separators=(",", ":")
    )

    return hashlib.sha256(
        payload.encode("utf-8")
    ).hexdigest()


# =========================================================
# CLEAN DUPLICATES
# =========================================================

try:
    client.admin.command("ping")
    print("MongoDB connection successful!")

    documents = list(
        datasets_collection.find().sort(
            "created_at",
            -1
        )
    )

    seen_hashes = set()
    seen_fingerprints = set()

    duplicate_ids = []

    for document in documents:

        file_hash = document.get("file_hash")
        fingerprint = dataset_fingerprint(document)

        # Primary identity for modern records.
        if file_hash and file_hash in seen_hashes:
            duplicate_ids.append(document["_id"])
            continue

        # Compatibility identity for old records, and for detecting an
        # old record that duplicates a newer hashed record.
        if fingerprint and fingerprint in seen_fingerprints:
            duplicate_ids.append(document["_id"])
            continue

        if file_hash:
            seen_hashes.add(file_hash)

        if fingerprint:
            seen_fingerprints.add(fingerprint)

    if duplicate_ids:
        result = datasets_collection.delete_many({
            "_id": {
                "$in": duplicate_ids
            }
        })

        print(
            f"Removed {result.deleted_count} duplicate dataset document(s)."
        )
    else:
        print("No duplicate dataset documents found.")

    # Remove the old non-unique index if it exists and recreate the
    # canonical unique sparse hash index.
    try:
        datasets_collection.drop_index("file_hash_1")
        print("Removed existing file_hash index.")
    except Exception:
        pass

    datasets_collection.create_index(
        "file_hash",
        unique=True,
        sparse=True
    )

    remaining = datasets_collection.count_documents({})

    print(f"Remaining dataset documents: {remaining}")
    print("Unique file_hash index is ready.")

except Exception as error:
    print("Cleanup failed:", error)

finally:
    client.close()
