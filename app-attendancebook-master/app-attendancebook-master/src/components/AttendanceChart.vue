<template>
  <div class="chart-container">
    <canvas ref="chartCanvas"></canvas>
  </div>
</template>

<script>
import Chart from "chart.js/auto";

export default {
  name: "AttendanceChart",
  props: {
    chartData: {
      type: Object,
      required: true,
    },
  },
  data() {
    return {
      chartInstance: null,
    };
  },
  watch: {
    chartData: {
      handler() {
        this.renderChart();
      },
      deep: true,
    },
  },
  mounted() {
    this.renderChart();
  },
  beforeDestroy() {
    if (this.chartInstance) {
      this.chartInstance.destroy();
    }
  },
  methods: {
    renderChart() {
      if (this.chartInstance) {
        this.chartInstance.destroy();
      }

      const ctx = this.$refs.chartCanvas.getContext("2d");
      this.chartInstance = new Chart(ctx, {
        type: "line",
        data: this.chartData,
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: {
            mode: "index",
            intersect: false,
          },
          plugins: {
            legend: {
              position: "bottom",
              labels: {
                usePointStyle: true,
                boxWidth: 8,
                padding: 15,
                font: {
                  size: 11, // 모바일 가독성
                },
              },
            },
            tooltip: {
              bodyFont: {
                size: 13,
              },
              padding: 10,
              cornerRadius: 8,
              displayColors: true,
            },
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                stepSize: 1,
                font: {
                  size: 10,
                },
              },
              grid: {
                color: "#f0f0f0",
              },
            },
            x: {
              ticks: {
                font: {
                  size: 11,
                },
              },
              grid: {
                display: false,
              },
            },
          },
          elements: {
            line: {
              tension: 0.3, // 부드러운 곡선
              borderWidth: 2,
            },
            point: {
              radius: 3,
              hitRadius: 10,
            },
          },
        },
      });
    },
  },
};
</script>

<style scoped>
.chart-container {
  position: relative;
  height: 300px;
  width: 100%;
  background-color: white;
  border-radius: 12px;
  padding: 15px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  margin-bottom: 2em;
}

@media (max-width: 600px) {
  .chart-container {
    height: 250px;
    padding: 10px;
  }
}
</style>
