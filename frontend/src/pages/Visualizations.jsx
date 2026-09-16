import React, { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

function Visualizations({ analysis, selectedDataset }) {
  const data = analysis || selectedDataset?.analysis;

  const numericColumns = data?.numeric_columns || [];

  const [selectedColumn, setSelectedColumn] = useState(
    numericColumns[0] || ""
  );

  /*
   * Make sure the selected column still exists when
   * the user switches between datasets.
   */
  const activeColumn = numericColumns.includes(selectedColumn)
    ? selectedColumn
    : numericColumns[0] || "";

  /*
   * Convert the saved preview into chart data.
   *
   * The backend currently returns the first 10 rows
   * through "preview", so the chart uses those rows.
   */
  const chartData = useMemo(() => {
    if (!data?.preview || !activeColumn) {
      return [];
    }

    return data.preview
      .map((row, index) => {
        const value = Number(row[activeColumn]);

        if (!Number.isFinite(value)) {
          return null;
        }

        return {
          index: index + 1,
          value,
        };
      })
      .filter(Boolean);
  }, [data, activeColumn]);

  if (!data) {
    return (
      <div className="page-container">

        <div className="page-header">
          <h1>Data Visualizations</h1>

          <p>
            Select a dataset from CSV Analysis History to view its
            visualizations.
          </p>
        </div>

        <div className="empty-analysis-card">

          <div className="empty-analysis-icon">
            CHART
          </div>

          <h2>No Dataset Selected</h2>

          <p>
            Go to <strong>Upload CSV</strong> and select a previously
            analyzed dataset.
          </p>

        </div>

      </div>
    );
  }

  return (
    <div className="page-container">

      {/* Page Header */}
      <div className="page-header">

        <h1>Data Visualizations</h1>

        <p>
          Explore numeric data from your selected dataset through
          interactive charts.
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


      {/* No Numeric Data */}
      {numericColumns.length === 0 && (
        <div className="empty-analysis-card">

          <div className="empty-analysis-icon">
            CHART
          </div>

          <h2>No Numeric Data Available</h2>

          <p>
            This dataset does not contain numeric columns that can be
            visualized.
          </p>

        </div>
      )}


      {/* Visualization */}
      {numericColumns.length > 0 && (
        <>
          {/* Chart Controls */}
          <div className="visualization-card">

            <div className="visualization-header">

              <div>
                <h2>Numeric Column Visualization</h2>

                <p>
                  Select a numeric column to visualize its values.
                </p>
              </div>

              <div className="visualization-control">

                <label htmlFor="column-select">
                  Column
                </label>

                <select
                  id="column-select"
                  value={activeColumn}
                  onChange={(event) =>
                    setSelectedColumn(event.target.value)
                  }
                >
                  {numericColumns.map((column) => (
                    <option
                      key={column}
                      value={column}
                    >
                      {column}
                    </option>
                  ))}
                </select>

              </div>

            </div>


            {/* Chart */}
            <div className="chart-container">

              {chartData.length > 0 ? (
                <ResponsiveContainer
                  width="100%"
                  height={400}
                >

                  <BarChart
                    data={chartData}
                    margin={{
                      top: 20,
                      right: 20,
                      left: 10,
                      bottom: 20,
                    }}
                  >

                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="rgba(148, 163, 184, 0.12)"
                    />

                    <XAxis
                      dataKey="index"
                      tick={{
                        fill: "#94a3b8",
                        fontSize: 11,
                      }}
                      axisLine={{
                        stroke: "rgba(148, 163, 184, 0.2)",
                      }}
                      tickLine={false}
                    />

                    <YAxis
                      tick={{
                        fill: "#94a3b8",
                        fontSize: 11,
                      }}
                      axisLine={{
                        stroke: "rgba(148, 163, 184, 0.2)",
                      }}
                      tickLine={false}
                    />

                    <Tooltip
                      contentStyle={{
                        background: "#17152d",
                        border:
                          "1px solid rgba(129, 140, 248, 0.35)",
                        borderRadius: "10px",
                        color: "#f8fafc",
                      }}
                      labelFormatter={(label) =>
                        `Row ${label}`
                      }
                      formatter={(value) => [
                        value,
                        activeColumn,
                      ]}
                    />

                    <Bar
                      dataKey="value"
                      fill="#6366f1"
                      radius={[5, 5, 0, 0]}
                    />

                  </BarChart>

                </ResponsiveContainer>
              ) : (
                <div className="chart-empty">
                  No valid numeric values are available for this
                  column.
                </div>
              )}

            </div>

          </div>


          {/* Visualization Information */}
          <div className="visualization-info-grid">

            <div className="visualization-info-card">

              <span>SELECTED COLUMN</span>

              <strong>
                {activeColumn}
              </strong>

            </div>


            <div className="visualization-info-card">

              <span>VALUES DISPLAYED</span>

              <strong>
                {chartData.length}
              </strong>

            </div>


            <div className="visualization-info-card">

              <span>AVAILABLE NUMERIC COLUMNS</span>

              <strong>
                {numericColumns.length}
              </strong>

            </div>

          </div>

        </>
      )}

    </div>
  );
}

export default Visualizations;