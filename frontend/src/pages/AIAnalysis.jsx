import React from "react";

function AIAnalysis({ analysis, selectedDataset }) {
  const data = analysis || selectedDataset?.analysis;

  if (!data) {
    return (
      <div className="page-container">
        <div className="page-header">
          <h1>AI Analysis</h1>
          <p>
            Select a dataset from CSV Analysis History to view its AI-powered
            analysis.
          </p>
        </div>

        <div className="empty-analysis-card">
          <div className="empty-analysis-icon">AI</div>

          <h2>No Dataset Selected</h2>

          <p>
            Go to <strong>Upload CSV</strong> and select a previously analyzed
            dataset.
          </p>
        </div>
      </div>
    );
  }

  const anomalyColumns = data.anomaly_columns || [];
  const identifierColumns = data.identifier_columns || [];
  const anomalousRows = data.anomalous_rows || [];

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
        <h1>AI Analysis</h1>

        <p>
          Machine-learning analysis of patterns and potential anomalies in
          your selected dataset.
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


      {/* Model Status */}
      <div className="ai-status-card">

        <div className="ai-status-icon">
          AI
        </div>

        <div className="ai-status-content">

          <span className="ai-status-label">
            MODEL STATUS
          </span>

          <h2>
            {data.anomaly_status || "Not available"}
          </h2>

          <p>
            Isolation Forest was used to identify unusual patterns among
            eligible numeric columns.
          </p>

        </div>

      </div>


      {/* AI Summary Cards */}
      <div className="ai-summary-grid">

        <div className="ai-summary-card">

          <span>ROWS ANALYZED</span>

          <strong>
            {totalRows.toLocaleString()}
          </strong>

        </div>


        <div className="ai-summary-card">

          <span>ANOMALIES DETECTED</span>

          <strong>
            {anomalyCount.toLocaleString()}
          </strong>

        </div>


        <div className="ai-summary-card">

          <span>ANOMALY RATE</span>

          <strong>
            {anomalyPercentage}%
          </strong>

        </div>


        <div className="ai-summary-card">

          <span>FEATURES USED</span>

          <strong>
            {anomalyColumns.length}
          </strong>

        </div>

      </div>


      {/* Features Used */}
      <div className="ai-section-card">

        <div className="ai-section-header">

          <div>
            <h2>Features Used for Anomaly Detection</h2>

            <p>
              Numeric columns considered by the machine-learning model.
            </p>
          </div>

        </div>


        {anomalyColumns.length > 0 ? (

          <div className="ai-column-list">

            {anomalyColumns.map((column) => (
              <div
                className="ai-column-item"
                key={column}
              >
                <span className="ai-column-dot" />

                <span>
                  {column}
                </span>
              </div>
            ))}

          </div>

        ) : (

          <div className="ai-empty-section">
            No eligible numeric columns were available for anomaly detection.
          </div>

        )}

      </div>


      {/* Identifier Handling */}
      <div className="ai-section-card">

        <div className="ai-section-header">

          <div>
            <h2>Identifier Handling</h2>

            <p>
              Columns detected as identifiers are excluded from anomaly
              detection to avoid treating unique IDs as meaningful patterns.
            </p>
          </div>

        </div>


        {identifierColumns.length > 0 ? (

          <div className="ai-column-list">

            {identifierColumns.map((column) => (
              <div
                className="ai-column-item ai-identifier-item"
                key={column}
              >
                <span className="ai-column-dot" />

                <span>
                  {column}
                </span>

                <strong>
                  Excluded
                </strong>
              </div>
            ))}

          </div>

        ) : (

          <div className="ai-empty-section">
            No identifier columns were detected.
          </div>

        )}

      </div>


      {/* Result Interpretation */}
      <div className="ai-section-card">

        <div className="ai-section-header">

          <div>
            <h2>Analysis Result</h2>

            <p>
              Summary of the machine-learning anomaly detection result.
            </p>
          </div>

        </div>


        {anomalyCount === 0 ? (

          <div className="ai-result positive">

            <div className="ai-result-icon">
              ✓
            </div>

            <div>
              <h3>No Anomalies Detected</h3>

              <p>
                The Isolation Forest model did not classify any rows as
                anomalous in the analyzed data.
              </p>
            </div>

          </div>

        ) : (

          <div className="ai-result warning">

            <div className="ai-result-icon">
              !
            </div>

            <div>
              <h3>
                {anomalyCount.toLocaleString()} Potential Anomalies Detected
              </h3>

              <p>
                The model identified rows whose numeric feature patterns
                differed from the majority of the dataset. Review the
                Anomalies page for the individual records and their anomaly
                scores.
              </p>
            </div>

          </div>

        )}

      </div>


      {/* Model Explanation */}
      <div className="ai-section-card">

        <div className="ai-section-header">

          <div>
            <h2>How the AI Analysis Works</h2>

            <p>
              Overview of the current anomaly-detection pipeline.
            </p>
          </div>

        </div>


        <div className="ai-process">

          <div className="ai-process-step">

            <div className="ai-process-number">
              1
            </div>

            <div>
              <h3>Detect Numeric Features</h3>

              <p>
                The analyzer identifies numeric columns in the uploaded CSV.
              </p>
            </div>

          </div>


          <div className="ai-process-step">

            <div className="ai-process-number">
              2
            </div>

            <div>
              <h3>Handle Missing Values</h3>

              <p>
                Missing numeric values are filled using column medians, with
                zero used as a final fallback.
              </p>
            </div>

          </div>


          <div className="ai-process-step">

            <div className="ai-process-number">
              3
            </div>

            <div>
              <h3>Exclude Identifiers</h3>

              <p>
                Columns recognized as identifiers are not used as anomaly
                detection features.
              </p>
            </div>

          </div>


          <div className="ai-process-step">

            <div className="ai-process-number">
              4
            </div>

            <div>
              <h3>Run Isolation Forest</h3>

              <p>
                The model evaluates the eligible numeric data and identifies
                records that appear unusual relative to the dataset.
              </p>
            </div>

          </div>


          <div className="ai-process-step">

            <div className="ai-process-number">
              5
            </div>

            <div>
              <h3>Calculate Anomaly Scores</h3>

              <p>
                Each detected anomalous row receives a model decision score
                that is available on the Anomalies page.
              </p>
            </div>

          </div>

        </div>

      </div>


      {/* Detected Rows Preview */}
      {anomalousRows.length > 0 && (

        <div className="ai-section-card">

          <div className="ai-section-header">

            <div>
              <h2>Detected Anomalies</h2>

              <p>
                Preview of rows identified by the machine-learning model.
              </p>
            </div>

          </div>


          <div className="ai-anomaly-preview">

            <div className="ai-anomaly-count">
              {anomalyCount.toLocaleString()} anomalous rows detected
            </div>

            <p>
              Open the <strong>Anomalies</strong> page to inspect the
              individual records and anomaly scores.
            </p>

          </div>

        </div>

      )}

    </div>
  );
}

export default AIAnalysis;