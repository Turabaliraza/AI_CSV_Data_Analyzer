from flask import Flask, request
from flask_cors import CORS
import pandas as pd
import math
from sklearn.ensemble import IsolationForest


app = Flask(__name__)

CORS(app)


# ---------------------------------------------------------
# HELPER FUNCTION
# ---------------------------------------------------------

def clean_value(value):

    # Convert Pandas NaN / missing values to None
    # None becomes JSON null
    if pd.isna(value):
        return None

    # Convert positive/negative infinity to None
    if isinstance(value, float) and not math.isfinite(value):
        return None

    return value


# ---------------------------------------------------------
# IDENTIFIER DETECTION
# ---------------------------------------------------------

def is_identifier_column(column_name, series):

    """
    Determine whether a numeric column is probably an ID
    rather than a meaningful numerical measurement.
    """

    column = column_name.lower().strip()

    # Common identifier-related words
    identifier_keywords = [
        "id",
        "identifier",
        "account_number",
        "accountnumber",
        "customer_number",
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

    # Direct keyword matching
    for keyword in identifier_keywords:

        if keyword in column:
            return True

    # Check whether the column behaves like a unique ID
    non_null = series.dropna()

    if len(non_null) > 0:

        unique_ratio = non_null.nunique() / len(non_null)

        # Very high uniqueness can indicate an identifier.
        # We only use this as a secondary signal.
        if unique_ratio >= 0.98 and len(non_null) >= 10:
            return True

    return False


# ---------------------------------------------------------
# HOME ROUTE
# ---------------------------------------------------------

@app.route("/")
def home():

    return {
        "message": "AI CSV Data Analyzer Backend is running!"
    }


# ---------------------------------------------------------
# TEST API ROUTE
# ---------------------------------------------------------

@app.route("/api/test")
def test_api():

    return {
        "message": "React and Flask are ready to communicate!"
    }


# ---------------------------------------------------------
# CSV UPLOAD AND ANALYSIS
# ---------------------------------------------------------

@app.route("/api/upload", methods=["POST"])
def upload_csv():

    # Get uploaded file
    file = request.files.get("file")


    # -----------------------------------------------------
    # CHECK FILE
    # -----------------------------------------------------

    if file is None:

        return {
            "error": "No file uploaded"
        }, 400


    if file.filename == "":

        return {
            "error": "No file selected"
        }, 400


    if not file.filename.lower().endswith(".csv"):

        return {
            "error": "Only CSV files are supported"
        }, 400


    try:

        # -------------------------------------------------
        # 1. READ CSV
        # -------------------------------------------------

        df = pd.read_csv(file)


        # -------------------------------------------------
        # 2. BASIC DATASET INFORMATION
        # -------------------------------------------------

        rows = len(df)

        columns = len(df.columns)

        column_names = df.columns.tolist()


        # -------------------------------------------------
        # 3. MISSING VALUES
        # -------------------------------------------------

        missing_values = {
            column: int(value)
            for column, value in df.isnull().sum().items()
        }

        total_missing_values = int(
            df.isnull().sum().sum()
        )


        # -------------------------------------------------
        # 4. DUPLICATE ROWS
        # -------------------------------------------------

        duplicate_rows = int(
            df.duplicated().sum()
        )


        # -------------------------------------------------
        # 5. DETECT COLUMN TYPES
        # -------------------------------------------------

        numeric_columns = df.select_dtypes(
            include="number"
        ).columns.tolist()


        categorical_columns = df.select_dtypes(
            include=["object", "category"]
        ).columns.tolist()


        boolean_columns = df.select_dtypes(
            include="bool"
        ).columns.tolist()


        datetime_columns = df.select_dtypes(
            include="datetime"
        ).columns.tolist()


        # -------------------------------------------------
        # 6. IDENTIFY NUMERIC IDENTIFIER COLUMNS
        # -------------------------------------------------

        identifier_columns = []

        for column in numeric_columns:

            if is_identifier_column(
                column,
                df[column]
            ):

                identifier_columns.append(column)


        # -------------------------------------------------
        # 7. SELECT FEATURES FOR AI
        # -------------------------------------------------

        anomaly_columns = [
            column
            for column in numeric_columns
            if column not in identifier_columns
        ]


        # -------------------------------------------------
        # 8. STATISTICAL SUMMARY
        # -------------------------------------------------

        statistics = {}


        for column in numeric_columns:

            series = df[column]

            valid_values = series.dropna()


            if valid_values.empty:

                statistics[column] = {

                    "mean": None,

                    "median": None,

                    "min": None,

                    "max": None,

                    "std": None
                }


            else:

                statistics[column] = {

                    "mean": clean_value(
                        round(float(series.mean()), 2)
                    ),

                    "median": clean_value(
                        round(float(series.median()), 2)
                    ),

                    "min": clean_value(
                        float(series.min())
                    ),

                    "max": clean_value(
                        float(series.max())
                    ),

                    "std": clean_value(
                        round(float(series.std()), 2)
                    )
                }


        # -------------------------------------------------
        # 9. AI ANOMALY DETECTION
        # -------------------------------------------------

        anomaly_count = 0

        anomalous_rows = []

        anomaly_status = "Not available"


        # Isolation Forest requires meaningful numerical
        # features and at least two rows.

        if len(anomaly_columns) >= 1 and len(df) >= 2:

            numeric_data = df[
                anomaly_columns
            ].copy()


            # Replace missing values with column median

            numeric_data = numeric_data.fillna(
                numeric_data.median()
            )


            # If an entire column is missing,
            # its median will also be NaN.
            # Replace remaining NaN values with 0.

            numeric_data = numeric_data.fillna(0)


            # Remove constant columns because they do not
            # provide useful information for anomaly detection.

            useful_anomaly_columns = [
                column
                for column in anomaly_columns
                if numeric_data[column].nunique() > 1
            ]


            if len(useful_anomaly_columns) >= 1:

                numeric_data = numeric_data[
                    useful_anomaly_columns
                ]


                # Create Isolation Forest model

                model = IsolationForest(
                    contamination="auto",
                    random_state=42
                )


                # Train model and predict anomalies

                predictions = model.fit_predict(
                    numeric_data
                )


                # Get anomaly scores

                scores = model.decision_function(
                    numeric_data
                )


                # Count anomalous rows

                anomaly_count = int(
                    (predictions == -1).sum()
                )


                anomaly_status = "Available"


                # -------------------------------------------------
                # CLEAN ANOMALOUS ROWS
                # -------------------------------------------------

                for index, row in df[
                    predictions == -1
                ].iterrows():

                    # Convert row to dictionary

                    row_data = {
                        column: clean_value(value)
                        for column, value in row.to_dict().items()
                    }


                    # Add anomaly score

                    row_data["anomaly_score"] = round(
                        float(
                            scores[
                                df.index.get_loc(index)
                            ]
                        ),
                        4
                    )


                    # Add cleaned row

                    anomalous_rows.append(
                        row_data
                    )


        # -------------------------------------------------
        # 10. DATASET PREVIEW
        # -------------------------------------------------

        preview = [

            {
                column: clean_value(value)
                for column, value in row.items()
            }

            for row in df.head(10).to_dict(
                orient="records"
            )

        ]


        # -------------------------------------------------
        # 11. COLUMN INFORMATION
        # -------------------------------------------------

        column_information = []


        for column in column_names:

            column_information.append({

                "name": column,

                "dtype": str(
                    df[column].dtype
                ),

                "missing": int(
                    df[column].isnull().sum()
                ),

                "unique_values": int(
                    df[column].nunique()
                ),

                "is_identifier": column in identifier_columns,

                "used_for_anomaly_detection":
                    column in anomaly_columns

            })


        # -------------------------------------------------
        # 12. RETURN ANALYSIS
        # -------------------------------------------------

        return {

            "message": "CSV analyzed successfully!",

            "file": file.filename,

            "rows": rows,

            "columns": columns,

            "column_names": column_names,

            "missing_values": missing_values,

            "total_missing_values": total_missing_values,

            "duplicate_rows": duplicate_rows,

            "numeric_columns": numeric_columns,

            "categorical_columns": categorical_columns,

            "boolean_columns": boolean_columns,

            "datetime_columns": datetime_columns,

            "identifier_columns": identifier_columns,

            "anomaly_columns": anomaly_columns,

            "column_information": column_information,

            "statistics": statistics,

            "anomaly_status": anomaly_status,

            "anomaly_count": anomaly_count,

            "anomalous_rows": anomalous_rows,

            "preview": preview

        }


    # -----------------------------------------------------
    # ERROR HANDLING
    # -----------------------------------------------------

    except Exception as error:

        return {

            "error": str(error)

        }, 500


# ---------------------------------------------------------
# START FLASK SERVER
# ---------------------------------------------------------

if __name__ == "__main__":

    app.run(
        debug=True
    )