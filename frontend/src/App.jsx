import { useState } from "react";
import "./App.css";

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

          <h3>Column Names</h3>

          <ul>
            {analysis.column_names.map((column) => (
              <li key={column}>{column}</li>
            ))}
          </ul>

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
        </div>
      )}
    </div>
  );
}

export default App;