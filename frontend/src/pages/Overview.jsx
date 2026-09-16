import React from "react";

function Overview({ analysis, selectedDataset }) {
  const data = analysis || selectedDataset?.analysis;

  if (!data) {
    return (
      <div className="page-container">
        <div className="page-header">
          <h1>Dataset Overview</h1>
          <p>
            Select a dataset from CSV Analysis History to view its analysis.
          </p>
        </div>

        <div className="empty-analysis-card">
          <div className="empty-analysis-icon">CSV</div>

          <h2>No Dataset Selected</h2>

          <p>
            Go to <strong>Upload CSV</strong> and select a previously analyzed
            dataset.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">

      {/* Page Header */}
      <div className="page-header">
        <h1>Dataset Overview</h1>

        <p>
          High-level information about your analyzed dataset.
        </p>
      </div>

      {/* Dataset Identity */}
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


      {/* KPI Cards */}
      <div className="overview-kpi-grid">

        <div className="overview-kpi-card">
          <span>Total Rows</span>

          <strong>
            {data.rows.toLocaleString()}
          </strong>
        </div>


        <div className="overview-kpi-card">
          <span>Total Columns</span>

          <strong>
            {data.columns}
          </strong>
        </div>


        <div className="overview-kpi-card">
          <span>Missing Values</span>

          <strong>
            {data.total_missing_values.toLocaleString()}
          </strong>
        </div>


        <div className="overview-kpi-card">
          <span>Duplicate Rows</span>

          <strong>
            {data.duplicate_rows.toLocaleString()}
          </strong>
        </div>

      </div>


      {/* Column Types */}
      <div className="overview-section-card">

        <div className="overview-section-header">
          <div>
            <h2>Column Types</h2>

            <p>
              Classification of columns detected in the dataset.
            </p>
          </div>
        </div>


        <div className="column-type-grid">

          <div className="column-type-card">
            <span>Numeric</span>

            <strong>
              {data.numeric_columns?.length || 0}
            </strong>
          </div>


          <div className="column-type-card">
            <span>Categorical</span>

            <strong>
              {data.categorical_columns?.length || 0}
            </strong>
          </div>


          <div className="column-type-card">
            <span>Boolean</span>

            <strong>
              {data.boolean_columns?.length || 0}
            </strong>
          </div>


          <div className="column-type-card">
            <span>Date / Time</span>

            <strong>
              {data.datetime_columns?.length || 0}
            </strong>
          </div>


          <div className="column-type-card">
            <span>Identifiers</span>

            <strong>
              {data.identifier_columns?.length || 0}
            </strong>
          </div>

        </div>

      </div>


      {/* Column Information */}
      <div className="overview-section-card">

        <div className="overview-section-header">
          <div>
            <h2>Column Information</h2>

            <p>
              Details detected for each column in the dataset.
            </p>
          </div>
        </div>


        <div className="column-table-wrapper">

          <table className="column-table">

            <thead>
              <tr>
                <th>Column</th>
                <th>Data Type</th>
                <th>Missing</th>
                <th>Unique Values</th>
                <th>Identifier</th>
                <th>Anomaly Detection</th>
              </tr>
            </thead>


            <tbody>

              {data.column_information?.map((column, index) => (

                <tr key={column.name || index}>

                  <td className="column-name">
                    {column.name}
                  </td>

                  <td>
                    <span className="dtype-badge">
                      {column.dtype}
                    </span>
                  </td>

                  <td>
                    {column.missing}
                  </td>

                  <td>
                    {column.unique_values}
                  </td>

                  <td>
                    {column.is_identifier ? (
                      <span className="status-badge identifier">
                        Yes
                      </span>
                    ) : (
                      <span className="status-badge neutral">
                        No
                      </span>
                    )}
                  </td>

                  <td>
                    {column.used_for_anomaly_detection ? (
                      <span className="status-badge active">
                        Included
                      </span>
                    ) : (
                      <span className="status-badge neutral">
                        Excluded
                      </span>
                    )}
                  </td>

                </tr>

              ))}

            </tbody>

          </table>

        </div>

      </div>


      {/* Dataset Preview */}
      <div className="overview-section-card">

        <div className="overview-section-header">

          <div>
            <h2>Dataset Preview</h2>

            <p>
              First {data.preview?.length || 0} rows of the dataset.
            </p>
          </div>

        </div>


        <div className="preview-table-wrapper">

          <table className="preview-table">

            <thead>
              <tr>
                {data.column_names?.map((column) => (
                  <th key={column}>
                    {column}
                  </th>
                ))}
              </tr>
            </thead>


            <tbody>

              {data.preview?.map((row, rowIndex) => (

                <tr key={rowIndex}>

                  {data.column_names?.map((column) => (

                    <td key={column}>

                      {row[column] === null ||
                      row[column] === undefined
                        ? "—"
                        : String(row[column])}

                    </td>

                  ))}

                </tr>

              ))}

            </tbody>

          </table>

        </div>

      </div>

    </div>
  );
}

export default Overview;