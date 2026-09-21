import React from "react";
import { useNavigate } from "react-router-dom";

function Upload({
  datasetHistory,
  selectedDataset,
  setSelectedDataset,
  setAnalysis,
}) {
  const navigate = useNavigate();

  const handleDatasetClick = (dataset) => {
    setSelectedDataset(dataset);
    setAnalysis(dataset.analysis);

    navigate("/overview");
  };

  return (
    <div className="page-container">

      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1>
              CSV{" "}
            <span className="gradient-text">
               Analysis History
            </span>
          </h1>
          <p>
            View and explore analysis from previously uploaded CSV datasets.
          </p>
        </div>
      </div>

      {/* History Card */}
      <div className="history-card">

        <div className="history-header">
          <div>
            <h2>Previously Analyzed Datasets</h2>
            <p>
              Select a dataset to view its existing analysis.
            </p>
          </div>

          <div className="dataset-count">
            {datasetHistory.length}{" "}
            {datasetHistory.length === 1 ? "Dataset" : "Datasets"}
          </div>
        </div>

        {/* Empty State */}
        {datasetHistory.length === 0 && (
          <div className="empty-history">

            <div className="empty-history-icon">
              CSV
            </div>

            <h3>No CSV datasets yet</h3>

            <p>
              Upload and analyze your first CSV from the Dashboard.
            </p>

            <button
              type="button"
              className="history-upload-button"
              onClick={() => navigate("/dashboard")}
            >
              Upload CSV
            </button>

          </div>
        )}

        {/* Dataset List */}
        {datasetHistory.length > 0 && (
          <div className="dataset-list">

            {datasetHistory.map((dataset, index) => {
              const analysis = dataset.analysis;

              const isSelected =
                selectedDataset &&
                selectedDataset.id === dataset.id;

              return (
                <button
                  key={dataset.id || index}
                  type="button"
                  className={`dataset-item ${
                    isSelected ? "dataset-item-selected" : ""
                  }`}
                  onClick={() => handleDatasetClick(dataset)}
                >

                  <div className="dataset-icon">
                    CSV
                  </div>

                  <div className="dataset-info">

                    <h3>
                      {analysis?.file || dataset.fileName}
                    </h3>

                    <p>
                      {analysis?.rows ?? 0} rows
                      {" • "}
                      {analysis?.columns ?? 0} columns
                    </p>

                  </div>

                  <div className="dataset-metrics">

                    <div className="dataset-metric">
                      <span>Missing</span>
                      <strong>
                        {analysis?.total_missing_values ?? 0}
                      </strong>
                    </div>

                    <div className="dataset-metric">
                      <span>Anomalies</span>
                      <strong>
                        {analysis?.anomaly_count ?? 0}
                      </strong>
                    </div>

                  </div>

                  <div className="dataset-arrow">
                    →
                  </div>

                </button>
              );
            })}

          </div>
        )}

      </div>

    </div>
  );
}

export default Upload;