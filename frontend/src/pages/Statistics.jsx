import React from "react";

function Statistics({ analysis, selectedDataset }) {
  const data = analysis || selectedDataset?.analysis;

  if (!data) {
    return (
      <div className="page-container">
        <div className="page-header">
          <h1>Statistical Analysis</h1>
          <p>
            Select a dataset from CSV Analysis History to view its statistics.
          </p>
        </div>

        <div className="empty-analysis-card">
          <div className="empty-analysis-icon">Σ</div>

          <h2>No Dataset Selected</h2>

          <p>
            Go to <strong>Upload CSV</strong> and select a previously analyzed
            dataset.
          </p>
        </div>
      </div>
    );
  }

  const statistics = data.statistics || {};
  const statisticColumns = Object.keys(statistics);

  return (
    <div className="page-container">

      {/* Page Header */}
      <div className="page-header">
        <h1>Statistical Analysis</h1>

        <p>
          Statistical summary of numeric columns in your dataset.
        </p>
      </div>


      {/* Current Dataset */}
      <div className="dataset-title-card">

        <div>
          <span className="dataset-label">CURRENT DATASET</span>

          <h2>{data.file}</h2>

          <p>
            {data.rows.toLocaleString()} rows
            {" • "}
            {data.columns} columns
          </p>
        </div>

      </div>


      {/* No Numeric Columns */}
      {statisticColumns.length === 0 && (
        <div className="empty-analysis-card">

          <div className="empty-analysis-icon">
            Σ
          </div>

          <h2>No Numeric Columns</h2>

          <p>
            This dataset does not contain numeric columns for statistical
            analysis.
          </p>

        </div>
      )}


      {/* Statistics Table */}
      {statisticColumns.length > 0 && (
        <div className="statistics-card">

          <div className="statistics-header">

            <div>
              <h2>Statistical Summary</h2>

              <p>
                Descriptive statistics calculated for each numeric column.
              </p>
            </div>

            <div className="statistics-count">
              {statisticColumns.length}{" "}
              {statisticColumns.length === 1
                ? "Numeric Column"
                : "Numeric Columns"}
            </div>

          </div>


          <div className="statistics-table-wrapper">

            <table className="statistics-table">

              <thead>
                <tr>
                  <th>Column</th>
                  <th>Mean</th>
                  <th>Median</th>
                  <th>Minimum</th>
                  <th>Maximum</th>
                  <th>Std. Deviation</th>
                </tr>
              </thead>


              <tbody>

                {statisticColumns.map((column) => {

                  const stats = statistics[column];

                  return (
                    <tr key={column}>

                      <td className="statistics-column-name">
                        {column}
                      </td>

                      <td>
                        {stats.mean ?? "—"}
                      </td>

                      <td>
                        {stats.median ?? "—"}
                      </td>

                      <td>
                        {stats.min ?? "—"}
                      </td>

                      <td>
                        {stats.max ?? "—"}
                      </td>

                      <td>
                        {stats.std ?? "—"}
                      </td>

                    </tr>
                  );
                })}

              </tbody>

            </table>

          </div>

        </div>
      )}


      {/* Individual Statistic Cards */}
      {statisticColumns.length > 0 && (
        <div className="statistics-detail-section">

          <div className="statistics-section-heading">

            <h2>Column Details</h2>

            <p>
              Detailed statistical information for each numeric column.
            </p>

          </div>


          <div className="statistics-detail-grid">

            {statisticColumns.map((column) => {

              const stats = statistics[column];

              return (
                <div
                  className="statistics-detail-card"
                  key={column}
                >

                  <div className="statistics-detail-title">
                    <span>NUMERIC COLUMN</span>

                    <h3>{column}</h3>
                  </div>


                  <div className="stat-value-grid">

                    <div className="stat-value">
                      <span>Mean</span>
                      <strong>{stats.mean ?? "—"}</strong>
                    </div>

                    <div className="stat-value">
                      <span>Median</span>
                      <strong>{stats.median ?? "—"}</strong>
                    </div>

                    <div className="stat-value">
                      <span>Minimum</span>
                      <strong>{stats.min ?? "—"}</strong>
                    </div>

                    <div className="stat-value">
                      <span>Maximum</span>
                      <strong>{stats.max ?? "—"}</strong>
                    </div>

                    <div className="stat-value">
                      <span>Std. Deviation</span>
                      <strong>{stats.std ?? "—"}</strong>
                    </div>

                  </div>

                </div>
              );
            })}

          </div>

        </div>
      )}

    </div>
  );
}

export default Statistics;