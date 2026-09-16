import React, { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

function Visualizations({ analysis, selectedDataset }) {
  const data = analysis || selectedDataset?.analysis;

  const [chartType, setChartType] = useState("numeric");
  const [selectedColumn, setSelectedColumn] = useState("");

  const visualizationData = data?.visualization_data;

  /* --------------------------------------------------
     IDENTIFIER COLUMNS
  -------------------------------------------------- */

  const identifierColumns = useMemo(() => {
    const identifiers = new Set();

    if (Array.isArray(data?.identifier_columns)) {
      data.identifier_columns.forEach((column) => {
        identifiers.add(column);
      });
    }

    if (Array.isArray(data?.column_information)) {
      data.column_information.forEach((column) => {
        if (column?.is_identifier) {
          identifiers.add(column.name);
        }
      });
    }

    return Array.from(identifiers);
  }, [data]);

  /* --------------------------------------------------
     NUMERIC COLUMNS
  -------------------------------------------------- */

  const numericColumns = useMemo(() => {
    const backendColumns = Array.isArray(data?.numeric_columns)
      ? data.numeric_columns
      : [];

    const visualizationColumns =
      visualizationData?.numeric &&
      typeof visualizationData.numeric === "object"
        ? Object.keys(visualizationData.numeric)
        : [];

    const columns =
      backendColumns.length > 0
        ? backendColumns
        : visualizationColumns;

    return columns.filter(
      (column) => !identifierColumns.includes(column)
    );
  }, [
    data,
    visualizationData,
    identifierColumns,
  ]);

  /* --------------------------------------------------
     CATEGORICAL COLUMNS
  -------------------------------------------------- */

  const categoricalColumns = useMemo(() => {
    const backendColumns = Array.isArray(data?.categorical_columns)
      ? data.categorical_columns
      : [];

    const visualizationColumns =
      visualizationData?.categorical &&
      typeof visualizationData.categorical === "object"
        ? Object.keys(visualizationData.categorical)
        : [];

    return backendColumns.length > 0
      ? backendColumns
      : visualizationColumns;
  }, [
    data,
    visualizationData,
  ]);

  /* --------------------------------------------------
     SELECT DEFAULT CHART TYPE
  -------------------------------------------------- */

  useEffect(() => {
    if (!data) {
      setChartType("numeric");
      setSelectedColumn("");
      return;
    }

    if (
      chartType === "numeric" &&
      numericColumns.length === 0 &&
      categoricalColumns.length > 0
    ) {
      setChartType("categorical");
      return;
    }

    if (
      chartType === "categorical" &&
      categoricalColumns.length === 0 &&
      numericColumns.length > 0
    ) {
      setChartType("numeric");
    }
  }, [
    data,
    chartType,
    numericColumns,
    categoricalColumns,
  ]);

  /* --------------------------------------------------
     KEEP SELECTED COLUMN VALID
  -------------------------------------------------- */

  useEffect(() => {
    const availableColumns =
      chartType === "numeric"
        ? numericColumns
        : categoricalColumns;

    if (availableColumns.length === 0) {
      setSelectedColumn("");
      return;
    }

    if (!availableColumns.includes(selectedColumn)) {
      setSelectedColumn(availableColumns[0]);
    }
  }, [
    chartType,
    selectedColumn,
    numericColumns,
    categoricalColumns,
  ]);

  /* --------------------------------------------------
     DETERMINE DISCRETE NUMERIC COLUMN
     
     Examples:
       accommodates = 1,2,3,4,5,6
       bedrooms     = 1,2,3,4
  -------------------------------------------------- */

  const numericIsDiscrete = useMemo(() => {
    if (
      chartType !== "numeric" ||
      !selectedColumn
    ) {
      return false;
    }

    const stats = data?.statistics?.[selectedColumn];

    if (!stats) {
      return false;
    }

    const min = Number(stats.min);
    const max = Number(stats.max);

    if (
      !Number.isFinite(min) ||
      !Number.isFinite(max)
    ) {
      return false;
    }

    return (
      Number.isInteger(min) &&
      Number.isInteger(max) &&
      max - min <= 20
    );
  }, [
    chartType,
    selectedColumn,
    data,
  ]);

  /* --------------------------------------------------
     RAW NUMERIC VISUALIZATION DATA
  -------------------------------------------------- */

  const rawNumericChartData = useMemo(() => {
    if (
      !visualizationData?.numeric ||
      !selectedColumn
    ) {
      return [];
    }

    const rawData =
      visualizationData.numeric[selectedColumn];

    if (!Array.isArray(rawData)) {
      return [];
    }

    return rawData
      .map((item, index) => {
        const label =
          item.range ??
          item.label ??
          item.bin ??
          item.name ??
          item.value ??
          `Group ${index + 1}`;

        const count =
          Number(item.count) ||
          Number(item.amount) ||
          Number(item.frequency) ||
          0;

        return {
          label: String(label),
          count,
        };
      })
      .filter((item) => item.count >= 0);
  }, [
    visualizationData,
    selectedColumn,
  ]);

  /* --------------------------------------------------
     DISCRETE NUMERIC DATA

     IMPORTANT:

     The backend histogram may contain ranges such as:

       0.99 - 1.25
       1.75 - 2.00
       2.75 - 3.00
       3.75 - 4.00

     These are histogram bins.

     For a genuinely discrete column such as
     accommodates, we convert those bins into:

       1
       2
       3
       4
       5
       6

     The count from each non-empty histogram bin
     is assigned to the closest integer.
  -------------------------------------------------- */

  const discreteNumericData = useMemo(() => {
    if (
      !numericIsDiscrete ||
      rawNumericChartData.length === 0
    ) {
      return [];
    }

    const stats = data?.statistics?.[selectedColumn];

    if (!stats) {
      return [];
    }

    const min = Math.ceil(Number(stats.min));
    const max = Math.floor(Number(stats.max));

    if (
      !Number.isFinite(min) ||
      !Number.isFinite(max) ||
      min > max
    ) {
      return [];
    }

    /*
      Create one bucket for every integer value.
    */

    const buckets = new Map();

    for (let value = min; value <= max; value++) {
      buckets.set(value, 0);
    }

    /*
      Extract the first and last numeric values
      from the histogram range.

      Example:

        "0.99 - 1.25"

      becomes:

        [0.99, 1.25]
    */

    rawNumericChartData.forEach((item) => {
      const numbers = item.label.match(
        /-?\d+(?:\.\d+)?/g
      );

      if (!numbers || numbers.length === 0) {
        return;
      }

      const first = Number(numbers[0]);

      const last =
        numbers.length > 1
          ? Number(numbers[numbers.length - 1])
          : first;

      if (
        !Number.isFinite(first) ||
        !Number.isFinite(last)
      ) {
        return;
      }

      /*
        Use the center of the histogram range
        to determine the closest discrete value.
      */

      const midpoint =
        (first + last) / 2;

      let closestValue = Math.round(midpoint);

      /*
        Keep the value inside the real
        min/max range.
      */

      closestValue = Math.max(
        min,
        Math.min(max, closestValue)
      );

      if (buckets.has(closestValue)) {
        buckets.set(
          closestValue,
          buckets.get(closestValue) + item.count
        );
      }
    });

    return Array.from(
      buckets.entries()
    ).map(([value, count]) => ({
      label: String(value),
      count,
    }));
  }, [
    numericIsDiscrete,
    rawNumericChartData,
    data,
    selectedColumn,
  ]);

  /* --------------------------------------------------
     CONTINUOUS NUMERIC DATA

     Continuous columns keep their histogram
     ranges, but we combine 20 bins into roughly
     10 readable groups.
  -------------------------------------------------- */

  const continuousNumericData = useMemo(() => {
    if (
      numericIsDiscrete ||
      rawNumericChartData.length <= 10
    ) {
      return rawNumericChartData;
    }

    const targetBins = 10;

    const groupSize = Math.ceil(
      rawNumericChartData.length /
        targetBins
    );

    const grouped = [];

    for (
      let index = 0;
      index < rawNumericChartData.length;
      index += groupSize
    ) {
      const group =
        rawNumericChartData.slice(
          index,
          index + groupSize
        );

      if (group.length === 0) {
        continue;
      }

      const firstLabel =
        group[0].label;

      const lastLabel =
        group[group.length - 1].label;

      const totalCount =
        group.reduce(
          (total, item) =>
            total +
            Number(item.count || 0),
          0
        );

      grouped.push({
        label:
          group.length === 1
            ? firstLabel
            : `${firstLabel} – ${lastLabel}`,
        count: totalCount,
      });
    }

    return grouped;
  }, [
    rawNumericChartData,
    numericIsDiscrete,
  ]);

  /* --------------------------------------------------
     CATEGORICAL DATA
  -------------------------------------------------- */

  const categoricalChartData = useMemo(() => {
    if (
      !visualizationData?.categorical ||
      !selectedColumn
    ) {
      return [];
    }

    const rawData =
      visualizationData.categorical[
        selectedColumn
      ];

    if (!Array.isArray(rawData)) {
      return [];
    }

    return rawData
      .map((item, index) => {
        const category =
          item.category ??
          item.label ??
          item.name ??
          item.value ??
          `Category ${index + 1}`;

        const count =
          Number(item.count) ||
          Number(item.amount) ||
          Number(item.frequency) ||
          0;

        return {
          label: String(category),
          count,
        };
      })
      .filter((item) => item.count >= 0);
  }, [
    visualizationData,
    selectedColumn,
  ]);

  /* --------------------------------------------------
     FINAL NUMERIC DATA
  -------------------------------------------------- */

  const numericChartData = numericIsDiscrete
    ? discreteNumericData
    : continuousNumericData;

  /* --------------------------------------------------
     FINAL DISPLAY DATA
  -------------------------------------------------- */

  const displayChartData =
    chartType === "numeric"
      ? numericChartData
      : categoricalChartData;

  const chartGroups =
    displayChartData.length;

  /* --------------------------------------------------
     TITLES
  -------------------------------------------------- */

  const chartTitle =
    chartType === "numeric"
      ? `Distribution of ${selectedColumn}`
      : `Frequency of ${selectedColumn}`;

  const chartDescription =
    chartType === "numeric"
      ? numericIsDiscrete
        ? "This chart shows how frequently each numeric value occurs across the complete dataset."
        : "Values are grouped into readable ranges using the complete dataset."
      : "The chart shows how frequently each category occurs across the complete dataset.";

  /* --------------------------------------------------
     NO DATASET
  -------------------------------------------------- */

  if (!data) {
    return (
      <div className="page-container">

        <div className="page-header">
          <div>
            <h1>
              Visualizations
            </h1>

            <p>
              Select a dataset from Upload CSV
              to explore its visualizations.
            </p>
          </div>
        </div>

        <div className="visualization-empty-page">

          <div className="visualization-empty-icon">
            CHART
          </div>

          <h2>
            No Dataset Selected
          </h2>

          <p>
            Upload and analyze a CSV dataset
            first, then return here to explore
            its visualizations.
          </p>

        </div>

      </div>
    );
  }

  /* --------------------------------------------------
     PAGE
  -------------------------------------------------- */

  return (
    <div className="page-container">

      {/* PAGE HEADER */}

      <div className="page-header">

        <div>

          <h1>
            Visualizations
          </h1>

          <p>
            Explore patterns and distributions
            across your complete dataset.
          </p>

        </div>

      </div>

      {/* CURRENT DATASET */}

      <div className="dataset-title-card">

        <span className="dataset-label">
          CURRENT DATASET
        </span>

        <h2>
          {data.file}
        </h2>

        <p>
          {data.rows} rows • {data.columns} columns
        </p>

      </div>

      {/* VISUALIZATION CARD */}

      <div className="visualization-card">

        <div className="visualization-header">

          <div>

            <h2>
              Dataset Visualization
            </h2>

            <p>
              Chart data is calculated from the
              complete dataset rather than the
              10-row preview.
            </p>

          </div>

          <div className="visualization-controls">

            {/* TYPE */}

            <div className="visualization-control">

              <label htmlFor="chart-type">
                Type
              </label>

              <select
                id="chart-type"
                value={chartType}
                onChange={(event) =>
                  setChartType(
                    event.target.value
                  )
                }
              >

                {numericColumns.length > 0 && (
                  <option value="numeric">
                    Numeric Distribution
                  </option>
                )}

                {categoricalColumns.length > 0 && (
                  <option value="categorical">
                    Category Frequency
                  </option>
                )}

              </select>

            </div>

            {/* COLUMN */}

            <div className="visualization-control">

              <label htmlFor="chart-column">
                Column
              </label>

              <select
                id="chart-column"
                value={selectedColumn}
                onChange={(event) =>
                  setSelectedColumn(
                    event.target.value
                  )
                }
                disabled={
                  (
                    chartType === "numeric"
                      ? numericColumns
                      : categoricalColumns
                  ).length === 0
                }
              >

                {(
                  chartType === "numeric"
                    ? numericColumns
                    : categoricalColumns
                ).map((column) => (

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

        </div>

        {/* NO COLUMNS */}

        {numericColumns.length === 0 &&
          categoricalColumns.length === 0 && (

            <div className="chart-empty">

              <strong>
                No visualization columns available
              </strong>

              <span>
                This dataset does not contain
                usable numeric or categorical
                visualization data.
              </span>

            </div>

          )}

        {/* CHART */}

        {selectedColumn &&
          displayChartData.length > 0 && (

            <>

              <div className="chart-heading">

                <h3>
                  {chartTitle}
                </h3>

                <p>
                  {chartDescription}
                </p>

              </div>

              <div className="chart-container">

                <ResponsiveContainer
                  width="100%"
                  height={430}
                >

                  <BarChart
                    data={displayChartData}
                    margin={{
                      top: 30,
                      right: 20,
                      left: 10,
                      bottom:
                        chartType ===
                        "categorical"
                          ? 70
                          : 55,
                    }}
                    barCategoryGap={
                      chartType === "numeric"
                        ? numericIsDiscrete
                          ? "18%"
                          : "10%"
                        : "18%"
                    }
                  >

                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      opacity={0.25}
                    />

                    <XAxis
                      dataKey="label"
                      interval={
                        numericIsDiscrete
                          ? 0
                          : "preserveStartEnd"
                      }
                      angle={
                        chartType === "categorical" ||
                        (
                          chartType === "numeric" &&
                          !numericIsDiscrete
                        )
                          ? -35
                          : 0
                      }
                      textAnchor={
                        chartType === "categorical" ||
                        (
                          chartType === "numeric" &&
                          !numericIsDiscrete
                        )
                          ? "end"
                          : "middle"
                      }
                      height={
                        chartType === "categorical" ||
                        (
                          chartType === "numeric" &&
                          !numericIsDiscrete
                        )
                          ? 85
                          : 45
                      }
                      tick={{
                        fontSize: 12,
                      }}
                    />

                    <YAxis
                      allowDecimals={false}
                      width={55}
                      tick={{
                        fontSize: 12,
                      }}
                      label={{
                        value:
                          "Number of Records",
                        angle: -90,
                        position:
                          "insideLeft",
                        offset: 5,
                      }}
                    />

                    <Tooltip
                      cursor={{
                        opacity: 0.08,
                      }}
                      formatter={(value) => [
                        value,
                        "Records",
                      ]}
                      labelFormatter={(label) =>
                        chartType === "numeric"
                          ? numericIsDiscrete
                            ? `Value: ${label}`
                            : `Range: ${label}`
                          : `Category: ${label}`
                      }
                      contentStyle={{
                        background:
                          "#17182f",
                        border:
                          "1px solid #3d3f73",
                        borderRadius:
                          "10px",
                        color:
                          "#f8fafc",
                      }}
                      labelStyle={{
                        color:
                          "#cbd5e1",
                        marginBottom:
                          "4px",
                      }}
                    />

                    <Bar
                      dataKey="count"
                      name="Records"
                      fill="#6366f1"
                      radius={[
                        8,
                        8,
                        0,
                        0,
                      ]}
                      maxBarSize={
                        numericIsDiscrete
                          ? 70
                          : 80
                      }
                      label={{
                        position: "top",
                        fontSize: 12,
                        fill: "#94a3b8",
                      }}
                    />

                  </BarChart>

                </ResponsiveContainer>

              </div>

            </>

          )}

        {/* NO CHART DATA */}

        {selectedColumn &&
          displayChartData.length === 0 &&
          (
            numericColumns.length > 0 ||
            categoricalColumns.length > 0
          ) && (

            <div className="chart-empty">

              <strong>
                No chart data available
              </strong>

              <span>
                There are no usable values
                available for this column.
              </span>

            </div>

          )}

      </div>

      {/* INFORMATION CARDS */}

      <div className="visualization-info-grid">

        <div className="visualization-info-card">

          <span>
            SELECTED COLUMN
          </span>

          <strong>
            {selectedColumn || "—"}
          </strong>

        </div>

        <div className="visualization-info-card">

          <span>
            DATASET ROWS
          </span>

          <strong>
            {data.rows}
          </strong>

        </div>

        <div className="visualization-info-card">

          <span>
            CHART GROUPS
          </span>

          <strong>
            {chartGroups}
          </strong>

        </div>

        <div className="visualization-info-card">

          <span>
            AVAILABLE COLUMNS
          </span>

          <strong>
            {chartType === "numeric"
              ? numericColumns.length
              : categoricalColumns.length}
          </strong>

        </div>

      </div>

    </div>
  );
}

export default Visualizations;