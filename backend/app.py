from flask import Flask, request
from flask_cors import CORS
import pandas as pd
from sklearn.ensemble import IsolationForest


app = Flask(__name__)

CORS(app)


@app.route("/")
def home():
    return {
        "message": "AI CSV Data Analyzer Backend is running!"
    }


@app.route("/api/test")
def test_api():
    return {
        "message": "React and Flask are ready to communicate!"
    }


@app.route("/api/upload", methods=["POST"])
def upload_csv():

    file = request.files.get("file")

    if file is None:
        return {
            "error": "No file uploaded"
        }, 400

    try:
        # Read uploaded CSV using Pandas
        df = pd.read_csv(file)

        # Basic dataset information
        rows = len(df)
        columns = len(df.columns)
        column_names = df.columns.tolist()

        # Count missing values in each column
        missing_values = {
            column: int(value)
            for column, value in df.isnull().sum().items()
        }

        # Find numeric columns
        numeric_columns = df.select_dtypes(
            include="number"
        ).columns.tolist()

        # Detect anomalies
        anomaly_count = 0
        anomalous_rows=[]

        if len(numeric_columns) >= 1:

            numeric_data = df[numeric_columns].copy()

            # Replace missing numeric values with the median
            numeric_data = numeric_data.fillna(
                numeric_data.median()
            )

            # Create Isolation Forest model
            model = IsolationForest(
                contamination="auto",
                random_state=42
            )

            # Predict normal/anomalous rows
        predictions=model.fit_predict(numeric_data)

           #Get anomoly scores
        scores=model.decision_function(numeric_data)

        anomaly_count=int(
               (predictions==-1).sum()
           )

        #Get anomalous rows
        anomalous_rows=[]

        for index, row in df[predictions == -1].iterrows():

            row_data=row.to_dict()

            row_data["anomaly_score"]=round(
                float(scores[index]),4
            )
            anomalous_rows.append(row_data)

            #Statistical Summary for numeric columns
            statistics={}

            for column in numeric_columns:
                statistics[column]={
                    "mean":round(float(df[column].mean()),2),
                    "min":float(df[column].min()),
                    "max":float(df[column].max())
                }

          
        

        return {
            "message": "CSV analyzed successfully!",
            "file": file.filename,
            "rows": rows,
            "columns": columns,
            "column_names": column_names,
            "missing_values": missing_values,
            "numeric_columns": numeric_columns,
            "anomaly_count": anomaly_count,
            "anomalous_rows":anomalous_rows,
            "statistics":statistics,
            "data":df.to_dict(orient="records"),
        }

    except Exception as error:
        return {
            "error": str(error)
        }, 500


if __name__ == "__main__":
    app.run(debug=True)