import { useState } from "react";
import "./App.css";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

function App() {
  const [file, setFile] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [message, setMessage] = useState("");

  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
    setAnalysis(null);
    setMessage("");
  };

  const handleUpload = () => {
    if (!file) {
      setMessage("Please select a CSV file first.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    fetch("http://127.0.0.1:5000/api/upload", {
      method: "POST",
      body: formData,
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.error) {
          setMessage(data.error);
        } else {
          setMessage(data.message);
          setAnalysis(data);
        }
      })
      .catch((error) => {
        console.error("Upload error:", error);
        setMessage("Error connecting to Flask.");
      });
  };

  return (
    <div>
      <h1>AI CSV Data Analyzer</h1>

      <input
        type="file"
        accept=".csv"
        onChange={handleFileChange}
      />

      <button onClick={handleUpload}>
        Upload CSV
      </button>

      <p>{message}</p>

      {analysis && (
        <div>
          {/* Dataset Overview */}
          <h2>Dataset Overview</h2>

          <p>
            <strong>File:</strong> {analysis.file}
          </p>

          <p>
            <strong>Rows:</strong> {analysis.rows}
          </p>

          <p>
            <strong>Columns:</strong> {analysis.columns}
          </p>

          {/* Column Names */}
          <h3>Column Names</h3>

          <ul>
            {analysis.column_names.map((column) => (
              <li key={column}>{column}</li>
            ))}
          </ul>

          {/* Missing Values */}
          <h3>Missing Values</h3>

          <ul>
            {Object.entries(analysis.missing_values).map(
              ([column, value]) => (
                <li key={column}>
                  {column}: {value}
                </li>
              )
            )}
          </ul>

          {/* Statistical Summary */}
          <h3>Statistical Summary</h3>

          <table border="1">
            <thead>
              <tr>
                <th>Column</th>
                <th>Mean</th>
                <th>Minimum</th>
                <th>Maximum</th>
              </tr>
            </thead>

            <tbody>
              {Object.entries(analysis.statistics).map(
                ([column, values]) => (
                  <tr key={column}>
                    <td>{column}</td>
                    <td>{values.mean}</td>
                    <td>{values.min}</td>
                    <td>{values.max}</td>
                  </tr>
                )
              )}
            </tbody>
          </table>

          {/* Salary Chart */}
          {analysis.data && (
            <div>
              <h3>Salary by Employee</h3>

              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analysis.data}>
                  <CartesianGrid strokeDasharray="3 3" />

                  <XAxis dataKey="Name" />

                  <YAxis />

                  <Tooltip />

                  <Legend />

                  <Bar dataKey="Salary" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* AI Anomaly Detection */}
          <h3>AI Anomaly Detection</h3>

          <p>
            <strong>Numeric Columns:</strong>{" "}
            {analysis.numeric_columns.join(", ")}
          </p>

          <p>
            <strong>Anomalies Detected:</strong>{" "}
            {analysis.anomaly_count}
          </p>

          {/* Anomalous Rows */}
          <h3>Anomalous Rows</h3>

          {analysis.anomalous_rows.length > 0 ? (
            <table border="1">
              <thead>
                <tr>
                  {Object.keys(analysis.anomalous_rows[0]).map(
                    (column) => (
                      <th key={column}>{column}</th>
                    )
                  )}
                </tr>
              </thead>

              <tbody>
                {analysis.anomalous_rows.map((row, index) => (
                  <tr key={index}>
                    {Object.values(row).map(
                      (value, columnIndex) => (
                        <td key={columnIndex}>{value}</td>
                      )
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>No anomalies detected.</p>
          )}
        </div>
      )}
    </div>
  );
}

export default App;