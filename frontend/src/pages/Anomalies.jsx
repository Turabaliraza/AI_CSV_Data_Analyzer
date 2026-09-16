import React from "react";

function Anomalies({ analysis, selectedDataset }) {
  const data = analysis || selectedDataset?.analysis;

  if (!data) {
    return (
      <div className="page-container">
        <div className="page-header">
          <h1>Anomaly Detection</h1>

          <p>
            Select a dataset from CSV Analysis History to inspect detected
            anomalies.
          </p>
        </div>

        <div className="empty-analysis-card">
          <div className="empty-analysis-icon">
            !
          </div>

          <h2>No Dataset Selected</h2>

          <p>
            Go to <strong>Upload CSV</strong> and select a previously analyzed
            dataset.
          </p>
        </div>
      </div>
    );
  }

  const anomalousRows = data.anomalous_rows || [];
  const anomalyColumns = data.anomaly_columns || [];

  const anomalyCount = data.anomaly_count || 0;
  const totalRows = data.rows || 0;

  const anomalyPercentage =
    totalRows > 0
      ? ((anomalyCount / totalRows) * 100).toFixed(2)
      : "0.00";

  return (
    <div className="page-container">

      {/* Page Header */}
      <div className="page-header">
        <h1>Anomaly Detection</h1>

        <p>
          Inspect records identified as unusual by the machine-learning
          anomaly detection model.
        </p>
      </div>


      {/* Current Dataset */}
      <div className="dataset-title-card">

        <div>
          <span className="dataset-label">
            CURRENT DATASET
          </span>

          <h2>{data.file}</h2>

          <p>
            {data.rows.toLocaleString()} rows
            {" • "}
            {data.columns} columns
          </p>
        </div>

      </div>


      {/* Summary Cards */}
      <div className="anomaly-summary-grid">

        <div className="anomaly-summary-card">

          <span>TOTAL ROWS</span>

          <strong>
            {totalRows.toLocaleString()}
          </strong>

        </div>


        <div className="anomaly-summary-card">

          <span>ANOMALIES</span>

          <strong>
            {anomalyCount.toLocaleString()}
          </strong>

        </div>


        <div className="anomaly-summary-card">

          <span>ANOMALY RATE</span>

          <strong>
            {anomalyPercentage}%
          </strong>

        </div>


        <div className="anomaly-summary-card">

          <span>MODEL STATUS</span>

          <strong className="anomaly-status-text">
            {data.anomaly_status || "Not available"}
          </strong>

        </div>

      </div>


      {/* Detection Information */}
      <div className="anomaly-info-card">

        <div className="anomaly-info-header">

          <div>
            <h2>Detection Features</h2>

            <p>
              Numeric columns used by the anomaly detection model.
            </p>
          </div>

        </div>


        {anomalyColumns.length > 0 ? (

          <div className="anomaly-feature-list">

            {anomalyColumns.map((column) => (
              <span
                className="anomaly-feature"
                key={column}
              >
                {column}
              </span>
            ))}

          </div>

        ) : (

          <div className="anomaly-empty-message">
            No eligible numeric columns were available for anomaly detection.
          </div>

        )}

      </div>


      {/* No Anomalies */}
      {anomalyCount === 0 && (

        <div className="anomaly-result-card no-anomalies">

          <div className="anomaly-result-icon">
            ✓
          </div>

          <div>
            <h2>No Anomalies Detected</h2>

            <p>
              The model did not identify any rows as anomalous in this
              dataset.
            </p>
          </div>

        </div>

      )}


      {/* Anomaly Table */}
      {anomalyCount > 0 && (

        <div className="anomaly-table-card">

          <div className="anomaly-table-header">

            <div>
              <h2>Detected Anomalous Records</h2>

              <p>
                Records classified as unusual by Isolation Forest.
              </p>
            </div>

            <div className="anomaly-count-badge">
              {anomalyCount.toLocaleString()} anomalies
            </div>

          </div>


          <div className="anomaly-table-wrapper">

            <table className="anomaly-table">

              <thead>

                <tr>

                  <th>#</th>

                  {data.column_names?.map((column) => (
                    <th key={column}>
                      {column}
                    </th>
                  ))}

                  <th>
                    Anomaly Score
                  </th>

                </tr>

              </thead>


              <tbody>

                {anomalousRows.map((row, index) => (

                  <tr key={index}>

                    <td className="anomaly-row-number">
                      {index + 1}
                    </td>


                    {data.column_names?.map((column) => (

                      <td key={column}>

                        {row[column] === null ||
                        row[column] === undefined
                          ? "—"
                          : String(row[column])}

                      </td>

                    ))}


                    <td>

                      <span className="anomaly-score">
                        {row.anomaly_score ?? "—"}
                      </span>

                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        </div>

      )}

    </div>
  );
}

export default Anomalies;