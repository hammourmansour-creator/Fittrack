// --------------------------------------
// WeeklyBarChart.jsx
// --------------------------------------
// Simple bar chart showing workouts per day
// for the last 7 days.
// --------------------------------------

import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Tooltip,
    Legend,
  } from "chart.js";
  import { Bar } from "react-chartjs-2";
  
  ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);
  
  export default function WeeklyBarChart({ labels, data }) {
    if (!labels || labels.length === 0) {
      return (
        <p style={{ color: "#64748b", marginTop: "8px" }}>
          Log some workouts to see your weekly activity.
        </p>
      );
    }
  
    const chartData = {
      labels,
      datasets: [
        {
          label: "Workouts",
          data,
          backgroundColor: "rgba(34,197,94,0.75)", // green-ish
          borderRadius: 6,
          maxBarThickness: 40,
        },
      ],
    };
  
    const options = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          callbacks: {
            label: (ctx) =>
              `${ctx.parsed.y} workout${ctx.parsed.y === 1 ? "" : "s"}`,
          },
        },
      },
      scales: {
        x: {
          grid: {
            display: false,
          },
          ticks: {
            color: "#e5e7eb",
          },
        },
        y: {
          beginAtZero: true,
          grid: {
            color: "#1f2937",
          },
          ticks: {
            stepSize: 1,
            color: "#9ca3af",
          },
        },
      },
    };
  
    return (
      <div style={{ height: "260px", marginTop: "8px" }}>
        <Bar data={chartData} options={options} />
      </div>
    );
  }
  