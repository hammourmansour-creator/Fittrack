// --------------------------------------
// WeeklyBarChart.jsx
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
        <p style={{ color: "#4b5563", marginTop: "8px" }}>
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
          backgroundColor: "rgba(34,197,94,0.75)",
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
            color: "#111827", // darker
            font: { size: 11 },
          },
        },
        y: {
          beginAtZero: true,
          grid: {
            color: "#e5e7eb",
          },
          ticks: {
            stepSize: 1,
            color: "#111827", // darker
            font: { size: 11 },
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
  