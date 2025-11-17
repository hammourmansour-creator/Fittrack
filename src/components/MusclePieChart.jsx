// --------------------------------------
// MusclePieChart.jsx
// --------------------------------------
// Pie chart showing distribution of workouts
// per category for the last 7 days.
// --------------------------------------

import {
    Chart as ChartJS,
    ArcElement,
    Tooltip,
    Legend,
  } from "chart.js";
  import { Pie } from "react-chartjs-2";
  
  ChartJS.register(ArcElement, Tooltip, Legend);
  
  export default function MusclePieChart({ labels, data }) {
    if (!labels || labels.length === 0) {
      return (
        <p style={{ color: "#64748b", marginTop: "8px" }}>
          Log categorized workouts (Chest, Back, Legs...) to see your muscle focus.
        </p>
      );
    }
  
    const chartData = {
      labels,
      datasets: [
        {
          data,
          backgroundColor: [
            "rgba(34,197,94,0.85)",   // green
            "rgba(59,130,246,0.85)",  // blue
            "rgba(239,68,68,0.85)",   // red
            "rgba(244,114,182,0.85)", // pink
            "rgba(234,179,8,0.85)",   // yellow
            "rgba(139,92,246,0.85)",  // purple
            "rgba(56,189,248,0.85)",  // cyan
            "rgba(248,113,113,0.85)", // light red
            "rgba(148,163,184,0.85)", // gray
          ],
          borderWidth: 1,
        },
      ],
    };
  
    const options = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            color: "#e5e7eb",
            font: {
              size: 11,
            },
          },
        },
        tooltip: {
          callbacks: {
            label: (ctx) => {
              const label = ctx.label || "";
              const value = ctx.parsed || 0;
              return `${label}: ${value} workout${value === 1 ? "" : "s"}`;
            },
          },
        },
      },
    };
  
    return (
      <div style={{ height: "260px", marginTop: "8px" }}>
        <Pie data={chartData} options={options} />
      </div>
    );
  }
  