<template>
  <div v-if="visible" class="modal-overlay" @click.self="close">
    <div class="modal-content">
      <div class="modal-header">
        <h3>{{ student.name }} 학생 출석 기록</h3>
        <button class="close-btn" @click="close">&times;</button>
      </div>

      <div class="modal-body">
        <div v-if="loading" class="loading-message">기록을 불러오는 중...</div>
        <div v-else>
          <!-- Summary Stats -->
          <div class="summary-card">
            <div class="stat-item">
              <span class="label">총 출석 횟수</span>
              <span class="value">{{ attendanceRecords.length }}회</span>
            </div>
            <div class="stat-item">
              <span class="label">최근 출석</span>
              <span class="value">{{ latestDate }}</span>
            </div>
          </div>

          <!-- Chart Section -->
          <div class="chart-container">
            <h4>월별 출석 현황 (최근 12개월)</h4>
            <LineChart
              v-if="chartData"
              :data="chartData"
              :options="chartOptions"
              class="chart"
            />
          </div>

          <!-- Recent List Section -->
          <div class="list-container">
            <h4>최근 출석 상세</h4>
            <ul class="attendance-log">
              <li v-for="record in attendanceRecords" :key="record.date">
                <span class="date">{{ formatDate(record.date) }}</span>
                <span class="badge" :class="record.status">출석</span>
              </li>
            </ul>
            <div v-if="attendanceRecords.length === 0" class="no-data">
              출석 기록이 없습니다.
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { attendanceService } from "@/services/attendanceService";
import { Line } from "vue-chartjs";
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Filler,
} from "chart.js";

ChartJS.register(
  Title,
  Tooltip,
  Legend,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Filler
);

export default {
  name: "StudentAttendanceModal",
  components: { LineChart: Line },
  props: {
    visible: {
      type: Boolean,
      required: true,
    },
    student: {
      type: Object,
      required: true,
    },
  },
  data() {
    return {
      loading: false,
      attendanceRecords: [],
      chartData: null,
      chartOptions: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1,
            },
            suggestedMax: 5, // 한 달 최대 5주
          },
        },
        plugins: {
          legend: {
            display: false,
          },
        },
        elements: {
          line: {
            tension: 0.4, // 부드러운 곡선
          },
        },
      },
    };
  },
  computed: {
    latestDate() {
      if (this.attendanceRecords.length > 0) {
        return this.attendanceRecords[0].date;
      }
      return "-";
    },
  },
  watch: {
    visible: {
      immediate: true,
      handler(newVal) {
        if (newVal && this.student && this.student.id) {
          this.fetchHistory();
        }
      },
    },
  },
  mounted() {
    if (this.visible && this.student && this.student.id) {
      this.fetchHistory();
    }
  },
  methods: {
    close() {
      this.$emit("close");
    },
    formatDate(dateStr) {
      // YYYY-MM-DD -> YYYY.MM.DD
      return dateStr.replace(/-/g, ".");
    },
    async fetchHistory() {
      this.loading = true;
      try {
        const records = await attendanceService.fetchStudentAttendance(
          this.student.id
        );
        this.attendanceRecords = records;
        this.generateChartData(records);
      } catch (error) {
        console.error("Failed to load history", error);
      } finally {
        this.loading = false;
      }
    },
    generateChartData(records) {
      // Last 12 months
      const months = [];
      const counts = [];
      const today = new Date();

      for (let i = 11; i >= 0; i--) {
        const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, "0");
        const key = `${yyyy}-${mm}`; // Filter key

        months.push(`${d.getMonth() + 1}월`); // Label

        // Count records starting with this key
        const count = records.filter((r) => r.date.startsWith(key)).length;
        counts.push(count);
      }

      this.chartData = {
        labels: months,
        datasets: [
          {
            label: "출석 횟수",
            backgroundColor: "rgba(76, 175, 80, 0.2)", // 영역 채우기 색상
            borderColor: "#4caf50", // 선 색상
            pointBackgroundColor: "#fff",
            pointBorderColor: "#4caf50",
            pointRadius: 4,
            fill: true, // 영역 채우기 활성화
            data: counts,
          },
        ],
      };
    },
  },
};
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background-color: white;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  border-radius: 12px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
}

.modal-header {
  padding: 15px 20px;
  background-color: #f9f9f9;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.2em;
  color: #333;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #777;
}

.modal-body {
  padding: 20px;
  overflow-y: auto;
}

.summary-card {
  display: flex;
  background-color: #f0f8ff;
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 20px;
}

.stat-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  border-right: 1px solid #ddeeff;
}
.stat-item:last-child {
  border-right: none;
}

.stat-item .label {
  font-size: 0.9em;
  color: #667788;
  margin-bottom: 5px;
}

.stat-item .value {
  font-size: 1.2em;
  font-weight: bold;
  color: #1976d2;
}

.chart-container {
  height: 250px;
  margin-bottom: 20px;
}
.chart-container h4 {
  margin-top: 0;
  margin-bottom: 10px;
  color: #444;
  font-size: 1em;
}

.list-container h4 {
  margin-top: 0;
  margin-bottom: 10px;
  color: #444;
  font-size: 1em;
}

.attendance-log {
  list-style: none;
  padding: 0;
  margin: 0;
  max-height: 150px;
  overflow-y: auto;
  border: 1px solid #eee;
  border-radius: 8px;
}

.attendance-log li {
  display: flex;
  justify-content: space-between;
  padding: 10px 15px;
  border-bottom: 1px solid #f9f9f9;
}
.attendance-log li:last-child {
  border-bottom: none;
}

.badge {
  background-color: #e8f5e9;
  color: #2e7d32;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 0.8em;
  font-weight: bold;
}

.no-data {
  text-align: center;
  color: #999;
  padding: 20px;
  background-color: #f9f9f9;
  border-radius: 8px;
}

.loading-message {
  text-align: center;
  padding: 2em;
  color: #666;
}
</style>
