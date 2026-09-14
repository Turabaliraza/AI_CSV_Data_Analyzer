from flask import Flask, request
from flask_cors import CORS
import pandas as pd
from sklearn.ensemble import IsolationForest

app=Flask(__name__)

CORS(app)

@app.route("/")
def home():{
    "message":"AI CSV Data Analyzer Backend is running!"
}

@app.route("/api/test")
def test_api():
    return{
        "message":"React and Flask are ready to communicate!"
    }
@app.route("/api/upload", methods=["POST"])
def upload_csv():

    file = request.files.get("file")

    if file is None:
        return {
            "error": "No file uploaded"
        }, 400

    # Read CSV using Pandas
    df = pd.read_csv(file)

    # Basic CSV information
    rows = len(df)
    columns = len(df.columns)
    column_names = df.columns.tolist()

    # Count missing values
    missing_values = {
        column: int(value)
        for column, value in df.isnull().sum().items()
    }

    #Find numeric columns
    numeric_columns=df.select_dtypes(include="number").columns.tolist()

    #Detect anomalies
    anomaly_count=0

    if len(numeric_columns)>=1:
        numeric_data=df[numeric_columns].copy()

        #Handle missing numeric values

        numeric_data=numeric_data.fillna(numeric_data.median())

        model=IsolationForest(
            contamination="auto",
            random_state=42
        )

        predictions=model.fit_predict(numeric_data)

        anomaly_count=int((predictions == -1).sum())

    return {
        "message": "CSV analyzed successfully!",
        "file": file.filename,
        "rows": rows,
        "columns": columns,
        "column_names": column_names,
        "missing_values": missing_values,
        "numeric_count":anomaly_count
    }
if __name__=="__main__":
    app.run(debug=True)
