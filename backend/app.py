from flask import Flask, request
from flask_cors import CORS
import pandas as pd
import math
from sklearn.ensemble import IsolationForest

import os
import json
import hashlib 
from dotenv import load_dotenv
from pymongo import MongoClient
from pymongo.errors import DuplicateKeyError
from datetime import datetime, timezone


# =========================================================
# FLASK + MONGODB SETUP
# =========================================================

app = Flask(__name__)
CORS(app)

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")

client = MongoClient(MONGO_URI)

db = client["ai_csv_analyzer"]
datasets_collection = db["datasets"]


# A sparse unique index keeps legacy documents valid while
# guaranteeing that each new file hash can exist only once.
try:
    datasets_collection.create_index(
        [("file_hash", 1)],
        unique=True,
        sparse=True
    )
except Exception as error:
    print("MongoDB index setup warning:", error)


# =========================================================
# MONGODB CONNECTION TEST
# =========================================================

try:
    client.admin.command("ping")
    print("MongoDB connection successful!")
except Exception as error:
    print("MongoDB connection failed:", error)


# =========================================================
# HELPER FUNCTION
# =========================================================

def clean_value(value):
    """
    Convert Pandas / Python values into JSON-safe values.
    """

    if pd.isna(value):
        return None

    if isinstance(value, float) and not math.isfinite(value):
        return None

    return value


# =========================================================
# MONGODB DOCUMENT HELPERS
# =========================================================

def serialize_mongo_document(document):
    """Convert a MongoDB dataset document into JSON-safe data."""

    document = dict(document)

    if "_id" in document:
        document["_id"] = str(document["_id"])

    if isinstance(document.get("created_at"), datetime):
        document["created_at"] = document["created_at"].isoformat()

    return document


LEGACY_MATCH_FIELDS = [
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
    "visualization_data"
]


def values_match(left, right):
    """Compare nested analysis values consistently."""

    try:
        return json.dumps(
            left,
            sort_keys=True,
            default=str,
            separators=(",", ":")
        ) == json.dumps(
            right,
            sort_keys=True,
            default=str,
            separators=(",", ":")
        )
    except Exception:
        return left == right


def legacy_analysis_matches(legacy_document, analysis_result):
    """Match a pre-hash document against the newly generated analysis."""

    for field in LEGACY_MATCH_FIELDS:
        if not values_match(
            legacy_document.get(field),
            analysis_result.get(field)
        ):
            return False

    return True


# =========================================================
# IDENTIFIER DETECTION
# =========================================================

def is_identifier_column(column_name, series):
    """
    Determine whether a numeric column is probably an
    identifier rather than a meaningful measurement.
    """

    column = column_name.lower().strip()

    identifier_keywords = [
        "id",
        "identifier",
        "account_number",
        "accountnumber",
        "customer_number",
        "customer_id",
        "employee_id",
        "employee_number",
        "invoice_id",
        "invoice_number",
        "order_id",
        "order_number",
        "transaction_id",
        "transaction_number",
        "record_id",
        "record_number",
        "phone",
        "phone_number",
        "telephone",
        "mobile",
        "zip",
        "zipcode",
        "postal",
        "postal_code"
    ]

    for keyword in identifier_keywords:
        if keyword in column:
            return True

    non_null = series.dropna()

    if len(non_null) > 0:

        unique_ratio = (
            non_null.nunique()
            / len(non_null)
        )

        if (
            unique_ratio >= 0.98
            and len(non_null) >= 10
        ):
            return True

    return False


# =========================================================
# NICE NUMBER HELPER
# =========================================================

def calculate_nice_bin_width(
    data_range,
    target_bins
):
    """
    Calculate a human-readable bin width.

    Examples:
        47.3 -> 50
        124  -> 200
        0.43 -> 0.5
    """

    if data_range <= 0:
        return 1

    raw_width = (
        data_range
        / target_bins
    )

    magnitude = (
        10
        ** math.floor(
            math.log10(raw_width)
        )
    )

    normalized_width = (
        raw_width
        / magnitude
    )

    if normalized_width <= 1:
        nice_width = 1

    elif normalized_width <= 2:
        nice_width = 2

    elif normalized_width <= 5:
        nice_width = 5

    else:
        nice_width = 10

    return nice_width * magnitude


# =========================================================
# FORMAT RANGE LABEL
# =========================================================

def format_range_value(
    value,
    bin_width
):
    """
    Format numeric values used in chart labels.
    """

    if bin_width >= 1:
        return f"{round(value):,}"

    if bin_width >= 0.1:
        return (
            f"{value:.1f}"
            .rstrip("0")
            .rstrip(".")
        )

    return (
        f"{value:.2f}"
        .rstrip("0")
        .rstrip(".")
    )


# =========================================================
# NUMERIC VISUALIZATION
# =========================================================

def create_numeric_visualization(series):
    """
    Create a readable numeric distribution using
    the complete dataset.
    """

    series = pd.to_numeric(
        series,
        errors="coerce"
    ).dropna()

    # -----------------------------------------------------
    # No valid values
    # -----------------------------------------------------

    if series.empty:

        return {
            "data": [],
            "valid_values": 0,
            "min": None,
            "max": None,
            "insight":
                "No valid numeric values available."
        }

    total_values = len(series)

    min_value = float(
        series.min()
    )

    max_value = float(
        series.max()
    )

    # -----------------------------------------------------
    # All values are identical
    # -----------------------------------------------------

    if min_value == max_value:

        formatted_value = format_range_value(
            min_value,
            1
        )

        return {

            "data": [

                {
                    "range":
                        formatted_value,

                    "count":
                        int(total_values)
                }

            ],

            "valid_values":
                int(total_values),

            "min":
                clean_value(min_value),

            "max":
                clean_value(max_value),

            "insight":
                (
                    f"All {total_values} valid "
                    f"values are {formatted_value}."
                )
        }

    # -----------------------------------------------------
    # FINAL POLISH
    # -----------------------------------------------------

    # Keep the number of groups small enough for the
    # X-axis to remain readable.

    # The entire dataset is still used.

    # We are only changing how values are grouped.

    target_bins = 10

    data_range = (
        max_value
        - min_value
    )

    bin_width = calculate_nice_bin_width(
        data_range,
        target_bins
    )

    # -----------------------------------------------------
    # Create clean bin boundaries
    # -----------------------------------------------------

    bin_start = (
        math.floor(
            min_value
            / bin_width
        )
        * bin_width
    )

    bin_end = (
        math.ceil(
            max_value
            / bin_width
        )
        * bin_width
    )

    if bin_end <= bin_start:

        bin_end = (
            bin_start
            + bin_width
        )

    # -----------------------------------------------------
    # Safety check
    # -----------------------------------------------------

    # The "nice number" calculation should normally
    # produce around 10 groups.

    # This prevents an unusual dataset from producing
    # too many groups.

    while (
        (bin_end - bin_start)
        / bin_width
        > 12
    ):

        bin_width *= 2

        bin_start = (
            math.floor(
                min_value
                / bin_width
            )
            * bin_width
        )

        bin_end = (
            math.ceil(
                max_value
                / bin_width
            )
            * bin_width
        )

    # -----------------------------------------------------
    # Generate bins
    # -----------------------------------------------------

    bins = []

    current = bin_start

    while current < bin_end:

        bins.append(current)

        current += bin_width

    bins.append(bin_end)

    # -----------------------------------------------------
    # Create categories
    # -----------------------------------------------------

    categories = pd.cut(

        series,

        bins=bins,

        include_lowest=True,

        duplicates="drop"
    )

    counts = categories.value_counts(
        sort=False
    )

    chart_data = []

    # -----------------------------------------------------
    # Build chart records
    # -----------------------------------------------------

    for interval, count in counts.items():

        if pd.isna(interval):
            continue

        lower = float(
            interval.left
        )

        upper = float(
            interval.right
        )

        lower_label = format_range_value(
            lower,
            bin_width
        )

        upper_label = format_range_value(
            upper,
            bin_width
        )

        chart_data.append({

            "range":
                f"{lower_label} - {upper_label}",

            "count":
                int(count),

            "min":
                clean_value(lower),

            "max":
                clean_value(upper)

        })

    # -----------------------------------------------------
    # Dynamic insight
    # -----------------------------------------------------

    if chart_data:

        highest_group = max(
            chart_data,
            key=lambda item:
                item["count"]
        )

        highest_count = (
            highest_group["count"]
        )

        highest_percentage = (

            highest_count
            / total_values

        ) * 100

        insight = (

            f"The highest concentration of "
            f"values is in the "
            f"{highest_group['range']} range, "
            f"containing {highest_count} of "
            f"{total_values} valid records "
            f"({highest_percentage:.1f}%)."

        )

    else:

        insight = (
            "A distribution could not be "
            "calculated for this column."
        )

    return {

        "data":
            chart_data,

        "valid_values":
            int(total_values),

        "min":
            clean_value(min_value),

        "max":
            clean_value(max_value),

        "insight":
            insight
    }


# =========================================================
# CATEGORICAL VISUALIZATION
# =========================================================

def create_categorical_visualization(series):
    """
    Create frequency information for a categorical
    column using the complete dataset.
    """

    series = series.dropna()

    # -----------------------------------------------------
    # No valid values
    # -----------------------------------------------------

    if series.empty:

        return {
            "data": [],
            "valid_values": 0,
            "insight":
                "No categorical values available."
        }

    # Convert values to strings for safe chart labels.

    value_counts = (

        series
        .astype(str)
        .value_counts()

    )

    chart_data = []

    for category, count in value_counts.items():

        chart_data.append({

            "category":
                category,

            "count":
                int(count)

        })

    # -----------------------------------------------------
    # Keep categorical charts readable
    # -----------------------------------------------------

    if len(chart_data) > 12:

        top_categories = (
            chart_data[:11]
        )

        remaining_count = sum(

            item["count"]

            for item
            in chart_data[11:]

        )

        top_categories.append({

            "category":
                "Other",

            "count":
                int(
                    remaining_count
                )

        })

        chart_data = top_categories

    # -----------------------------------------------------
    # Dynamic insight
    # -----------------------------------------------------

    if chart_data:

        highest_category = max(

            chart_data,

            key=lambda item:
                item["count"]

        )

        total_values = len(series)

        percentage = (

            highest_category["count"]
            / total_values

        ) * 100

        insight = (

            f'"{highest_category["category"]}" '
            f'is the most common category with '
            f'{highest_category["count"]} of '
            f'{total_values} valid records '
            f'({percentage:.1f}%).'

        )

    else:

        insight = (

            "No categorical distribution "
            "could be calculated."

        )

    return {

        "data":
            chart_data,

        "valid_values":
            int(len(series)),

        "insight":
            insight
    }


# =========================================================
# COMPLETE VISUALIZATION DATA
# =========================================================

def create_visualization_data(
    df,
    numeric_columns,
    categorical_columns,
    identifier_columns
):
    """
    Create visualization data using the COMPLETE dataset.

    Numeric identifier columns are excluded because they
    normally represent record identifiers rather than
    meaningful measurements.
    """

    visualization_data = {

        "numeric": {},

        "categorical": {}

    }

    # -----------------------------------------------------
    # NUMERIC COLUMNS
    # -----------------------------------------------------

    visual_numeric_columns = [

        column

        for column in numeric_columns

        if column not in identifier_columns

    ]

    for column in visual_numeric_columns:

        visualization_data[
            "numeric"
        ][column] = (

            create_numeric_visualization(
                df[column]
            )

        )

    # -----------------------------------------------------
    # CATEGORICAL COLUMNS
    # -----------------------------------------------------

    for column in categorical_columns:

        visualization_data[
            "categorical"
        ][column] = (

            create_categorical_visualization(
                df[column]
            )

        )

    return visualization_data


# =========================================================
# HOME ROUTE
# =========================================================

@app.route("/")
def home():

    return {

        "message":
            "AI CSV Data Analyzer Backend is running!"

    }


# =========================================================
# TEST API ROUTE
# =========================================================

@app.route("/api/test")
def test_api():

    return {

        "message":
            "React and Flask are ready to communicate!"

    }
# =========================================================
# GET SAVED DATASETS
# =========================================================

@app.route("/api/datasets", methods=["GET"])
def get_datasets():

    try:

        documents = datasets_collection.find().sort(
            "created_at",
            -1
        )

        datasets = []

        for document in documents:
            datasets.append(
                serialize_mongo_document(document)
            )

        return datasets

    except Exception as error:

        return {
            "error":
                str(error)
        }, 500

# =========================================================
# TEMPORARY MIGRATION ENDPOINT
# =========================================================

@app.route("/api/migrate-dataset", methods=["POST"])
def migrate_dataset():

    try:

        dataset = request.get_json()

        if not dataset:
            return {
                "error": "No dataset provided."
            }, 400

        analysis = dataset.get("analysis")

        if not analysis:
            return {
                "error": "No analysis data provided."
            }, 400

        file_hash = (
            dataset.get("file_hash")
            or dataset.get("fileHash")
        )

        if not file_hash:
            return {
                "error":
                    "Migration requires a file_hash. Upload the original CSV through /api/upload instead."
            }, 400

        existing_dataset = datasets_collection.find_one(
            {"file_hash": file_hash}
        )

        if existing_dataset:
            return {
                "message": "Dataset already exists.",
                "file": analysis.get("file")
            }, 200

        mongodb_document = {
            **analysis,
            "file_hash": file_hash,
            "file_size": dataset.get("file_size"),
            "created_at": dataset.get(
                "analyzedAt",
                datetime.now(timezone.utc).isoformat()
            )
        }

        try:

            datasets_collection.insert_one(
                mongodb_document
            )

        except DuplicateKeyError:

            existing_dataset = datasets_collection.find_one(
                {"file_hash": file_hash}
            )

            if existing_dataset:

                existing_response = serialize_mongo_document(
                    existing_dataset
                )

                existing_response["already_analyzed"] = True
                existing_response["message"] = "Dataset already exists. Loaded the saved analysis."

                return existing_response, 200

            raise

        return {
            "message": "Dataset migrated successfully.",
            "file": analysis.get("file"),
            "file_hash": file_hash
        }, 201

    except Exception as error:

        return {
            "error": str(error)
        }, 500  
# =========================================================
# CSV UPLOAD AND ANALYSIS
# =========================================================

@app.route(
    "/api/upload",
    methods=["POST"]
)
def upload_csv():

    # -----------------------------------------------------
    # Get uploaded file
    # -----------------------------------------------------

    file = request.files.get(
        "file"
    )

    # -----------------------------------------------------
    # Validate file
    # -----------------------------------------------------

    if file is None:

        return {

            "error":
                "No file uploaded"

        }, 400

    if file.filename == "":

        return {

            "error":
                "No file selected"

        }, 400

    if not file.filename.lower().endswith(
        ".csv"
    ):

        return {

            "error":
                "Only CSV files are supported"

        }, 400


    # =================================================
    # CALCULATE FILE HASH
    # =================================================

    file_bytes = file.read()

    file_hash = hashlib.sha256(
        file_bytes
    ).hexdigest()

    file_size = len(file_bytes)

    file.seek(0)


    # =================================================
    # CHECK MONGODB FOR EXISTING DATASET
    # =================================================

    existing_dataset = datasets_collection.find_one(
        {
            "file_hash":
                file_hash
        }
    )


    # =================================================
    # RETURN EXISTING ANALYSIS
    # =================================================

    if existing_dataset:

        existing_response = serialize_mongo_document(
            existing_dataset
        )

        existing_response["already_analyzed"] = True
        existing_response["message"] = "Dataset already exists. Loaded the saved analysis."

        return existing_response


    try:

        # =================================================
        # 1. READ CSV
        # =================================================

        df = pd.read_csv(file)

        # =================================================
        # 2. BASIC DATASET INFORMATION
        # =================================================

        rows = len(df)

        columns = len(
            df.columns
        )

        column_names = (
            df.columns.tolist()
        )

        # =================================================
        # 3. MISSING VALUES
        # =================================================

        missing_values = {

            column:
                int(value)

            for column, value
            in df.isnull().sum().items()

        }

        total_missing_values = int(

            df
            .isnull()
            .sum()
            .sum()

        )

        # =================================================
        # 4. DUPLICATE ROWS
        # =================================================

        duplicate_rows = int(

            df
            .duplicated()
            .sum()

        )

        # =================================================
        # 5. DETECT COLUMN TYPES
        # =================================================

        numeric_columns = (

            df
            .select_dtypes(
                include="number"
            )
            .columns
            .tolist()

        )

        categorical_columns = (

            df
            .select_dtypes(
                include=[
                    "object",
                    "category"
                ]
            )
            .columns
            .tolist()

        )

        boolean_columns = (

            df
            .select_dtypes(
                include="bool"
            )
            .columns
            .tolist()

        )

        datetime_columns = (

            df
            .select_dtypes(
                include="datetime"
            )
            .columns
            .tolist()

        )

        # =================================================
        # 6. IDENTIFY NUMERIC IDENTIFIER COLUMNS
        # =================================================

        identifier_columns = []

        for column in numeric_columns:

            if is_identifier_column(

                column,

                df[column]

            ):

                identifier_columns.append(
                    column
                )

        # =================================================
        # 7. SELECT FEATURES FOR AI
        # =================================================

        anomaly_columns = [

            column

            for column in numeric_columns

            if column not in identifier_columns

        ]

        # =================================================
        # 8. STATISTICAL SUMMARY
        # =================================================

        statistics = {}

        for column in numeric_columns:

            series = df[column]

            valid_values = (
                series.dropna()
            )

            if valid_values.empty:

                statistics[column] = {

                    "mean":
                        None,

                    "median":
                        None,

                    "min":
                        None,

                    "max":
                        None,

                    "std":
                        None

                }

            else:

                statistics[column] = {

                    "mean":
                        clean_value(
                            round(
                                float(
                                    series.mean()
                                ),
                                2
                            )
                        ),

                    "median":
                        clean_value(
                            round(
                                float(
                                    series.median()
                                ),
                                2
                            )
                        ),

                    "min":
                        clean_value(
                            float(
                                series.min()
                            )
                        ),

                    "max":
                        clean_value(
                            float(
                                series.max()
                            )
                        ),

                    "std":
                        clean_value(
                            round(
                                float(
                                    series.std()
                                ),
                                2
                            )
                        )

                }

        # =================================================
        # 9. AI ANOMALY DETECTION
        # =================================================

        anomaly_count = 0

        anomalous_rows = []

        anomaly_status = (
            "Not available"
        )

        if (

            len(anomaly_columns) >= 1

            and len(df) >= 2

        ):

            numeric_data = (

                df[
                    anomaly_columns
                ]
                .copy()

            )

            # -------------------------------------------------
            # Fill missing values
            # -------------------------------------------------

            numeric_data = (

                numeric_data
                .fillna(
                    numeric_data.median()
                )

            )

            numeric_data = (

                numeric_data
                .fillna(0)

            )

            # -------------------------------------------------
            # Remove constant columns
            # -------------------------------------------------

            useful_anomaly_columns = [

                column

                for column
                in anomaly_columns

                if (
                    numeric_data[column]
                    .nunique()
                    > 1
                )

            ]

            if (
                len(
                    useful_anomaly_columns
                ) >= 1
            ):

                numeric_data = (

                    numeric_data[
                        useful_anomaly_columns
                    ]

                )

                # -------------------------------------------------
                # Create Isolation Forest
                # -------------------------------------------------

                model = IsolationForest(

                    contamination="auto",

                    random_state=42

                )

                # -------------------------------------------------
                # Predict anomalies
                # -------------------------------------------------

                predictions = (

                    model
                    .fit_predict(
                        numeric_data
                    )

                )

                # -------------------------------------------------
                # Calculate scores
                # -------------------------------------------------

                scores = (

                    model
                    .decision_function(
                        numeric_data
                    )

                )

                # -------------------------------------------------
                # Count anomalies
                # -------------------------------------------------

                anomaly_count = int(

                    (
                        predictions
                        == -1
                    )
                    .sum()

                )

                anomaly_status = (
                    "Available"
                )

                # -------------------------------------------------
                # Store anomalous rows
                # -------------------------------------------------

                for index, row in df[
                    predictions == -1
                ].iterrows():

                    row_data = {

                        column:
                            clean_value(value)

                        for column, value
                        in row.to_dict().items()

                    }

                    row_data[
                        "anomaly_score"
                    ] = round(

                        float(

                            scores[
                                df.index.get_loc(
                                    index
                                )
                            ]

                        ),

                        4

                    )

                    anomalous_rows.append(
                        row_data
                    )

        # =================================================
        # 10. DATASET PREVIEW
        # =================================================

        # Preview intentionally remains limited to
        # the first 10 rows.

        preview = [

            {

                column:
                    clean_value(value)

                for column, value
                in row.items()

            }

            for row in (

                df
                .head(10)
                .to_dict(
                    orient="records"
                )

            )

        ]

        # =================================================
        # 11. VISUALIZATION DATA
        # =================================================

        visualization_data = (

            create_visualization_data(

                df,

                numeric_columns,

                categorical_columns,

                identifier_columns

            )

        )

        # Numeric columns suitable for visualization.

        visualization_numeric_columns = [

            column

            for column in numeric_columns

            if column not in identifier_columns

        ]

        # =================================================
        # 12. COLUMN INFORMATION
        # =================================================

        column_information = []

        for column in column_names:

            column_information.append({

                "name":
                    column,

                "dtype":
                    str(
                        df[column].dtype
                    ),

                "missing":
                    int(
                        df[column]
                        .isnull()
                        .sum()
                    ),

                "unique_values":
                    int(
                        df[column]
                        .nunique()
                    ),

                "is_identifier":
                    column
                    in identifier_columns,

                "used_for_anomaly_detection":
                    column
                    in anomaly_columns

            })

        # =================================================
        # 13. CREATE ANALYSIS RESULT
        # =================================================

        analysis_result = {

            "message":
                "CSV analyzed successfully!",

            "file":
                file.filename,

            "rows":
                rows,

            "columns":
                columns,

            "column_names":
                column_names,

            "missing_values":
                missing_values,

            "total_missing_values":
                total_missing_values,

            "duplicate_rows":
                duplicate_rows,

            "numeric_columns":
                numeric_columns,

            "visualization_numeric_columns":
                visualization_numeric_columns,

            "categorical_columns":
                categorical_columns,

            "boolean_columns":
                boolean_columns,

            "datetime_columns":
                datetime_columns,

            "identifier_columns":
                identifier_columns,

            "anomaly_columns":
                anomaly_columns,

            "column_information":
                column_information,

            "statistics":
                statistics,

            "anomaly_status":
                anomaly_status,

            "anomaly_count":
                anomaly_count,

            "anomalous_rows":
                anomalous_rows,

            "preview":
                preview,

            "visualization_data":
                visualization_data

        }

        # =================================================
        # 14. HANDLE LEGACY DOCUMENTS
        # =================================================
        # Older records do not have file_hash. If the newly
        # generated analysis is identical to a legacy record,
        # attach the hash to that record instead of inserting
        # another dataset. This is a one-time compatibility path.
        # =================================================

        legacy_candidates = datasets_collection.find({
            "file": file.filename,
            "file_hash": {"$exists": False}
        })

        for legacy_document in legacy_candidates:

            if legacy_analysis_matches(
                legacy_document,
                analysis_result
            ):

                datasets_collection.update_one(
                    {"_id": legacy_document["_id"]},
                    {
                        "$set": {
                            "file_hash": file_hash,
                            "file_size": file_size
                        }
                    }
                )

                updated_document = datasets_collection.find_one(
                    {"_id": legacy_document["_id"]}
                )

                legacy_response = serialize_mongo_document(
                    updated_document
                )

                legacy_response["already_analyzed"] = True

                return legacy_response


        # =================================================
        # 15. SAVE NEW ANALYSIS TO MONGODB
        # =================================================

        mongodb_document = {

            **analysis_result,

            "file_hash":
                file_hash,

            "file_size":
                file_size,

            "created_at":
                datetime.now(timezone.utc)

        }

        try:

            insert_result = datasets_collection.insert_one(
                mongodb_document
            )

        except DuplicateKeyError:

            # If two identical CSV uploads arrive at nearly
            # the same time, the unique MongoDB index prevents
            # a second document from being created.
            existing_dataset = datasets_collection.find_one(
                {"file_hash": file_hash}
            )

            if existing_dataset:

                existing_response = serialize_mongo_document(
                    existing_dataset
                )

                existing_response["already_analyzed"] = True
                existing_response["message"] = "Dataset already exists. Loaded the saved analysis."

                return existing_response, 200

            raise

        saved_document = datasets_collection.find_one(
            {"_id": insert_result.inserted_id}
        )

        # =================================================
        # 16. RETURN SAVED ANALYSIS TO FRONTEND
        # =================================================

        new_response = serialize_mongo_document(
            saved_document
        )

        new_response["already_analyzed"] = False

        return new_response

    # =================================================
    # ERROR HANDLING
    # =================================================

    except Exception as error:

        return {

            "error":
                str(error)

        }, 500


# =========================================================
# START FLASK SERVER
# =========================================================

if __name__ == "__main__":

    app.run(
        debug=True
    )