<template>
  <div class="status-view">
    <h2>주차별 출석 현황</h2>
    <div class="controls">
      <div class="select-wrapper">
        <select v-model="selectedDate" @change="fetchAttendanceData">
          <option disabled value="">주일을 선택하세요</option>
          <option
            v-for="sunday in sundays"
            :key="sunday.date"
            :value="sunday.date"
          >
            {{ sunday.label }}
          </option>
        </select>
        <div class="select-arrow"></div>
      </div>
    </div>

    <div v-if="loading" class="skeleton-table">
      <div class="skeleton-header">
        <SkeletonLoader width="100%" height="40px" />
      </div>
      <div v-for="n in 5" :key="n" class="skeleton-row">
        <SkeletonLoader width="100%" height="30px" />
      </div>
    </div>
    <div v-else-if="stats.length > 0">
      <table class="status-table">
        <thead>
          <tr>
            <th>목장</th>
            <th>출석</th>
            <th>재적</th>
            <th>출석률</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="stat in stats" :key="stat.groupId">
            <td>{{ stat.groupName }}</td>
            <td>{{ stat.presentCount }}</td>
            <td>{{ stat.totalMembers }}</td>
            <td>{{ stat.attendanceRate }}%</td>
          </tr>
        </tbody>
        <tfoot>
          <tr class="total-row">
            <td>전체</td>
            <td>{{ overallStats.presentCount }}</td>
            <td>{{ overallStats.totalMembers }}</td>
            <td>{{ overallStats.attendanceRate }}%</td>
          </tr>
        </tfoot>
      </table>
    </div>
    <div v-else class="loading-message">
      해당 주차의 출석 데이터가 없습니다.
    </div>

    <!-- 차트 섹션 -->
    <hr class="divider" />
    <div class="chart-header">
      <h2 class="chart-title">5주 추이</h2>
      <div class="chart-controls">
        <button
          :class="['mode-btn', { active: chartMode === 'count' }]"
          @click="setChartMode('count')"
        >
          인원수
        </button>
        <button
          :class="['mode-btn', { active: chartMode === 'rate' }]"
          @click="setChartMode('rate')"
        >
          출석률
        </button>
      </div>
    </div>
    <div v-if="chartLoading" class="skeleton-chart">
      <SkeletonLoader width="100%" height="250px" />
    </div>
    <AttendanceChart v-else-if="chartData" :chartData="chartData" />

    <!-- 생일자 섹션 -->
    <hr class="divider" />
    <h2 class="birthday-title">
      생일자 체크 (D-{{ birthdayRangePast }} ~ D+{{ birthdayRangeFuture }})
    </h2>
    <BirthdayList
      :students="birthdays"
      :loading="birthdayLoading"
      :groups="groups"
    />

    <!-- 장기 결석자 섹션 -->
    <hr class="divider" />
    <h2 class="absentee-title">장기 결석자 (최근 4주)</h2>
    <AbsenteeList
      :students="absentees"
      :loading="absenteeLoading"
      :groups="groups"
    />
  </div>
</template>

<script>
import { generateTargetSundays, getRecentSundays } from "@/utils/dateUtils";
import { studentService } from "@/services/studentService";
import { attendanceService } from "@/services/attendanceService";
import BirthdayList from "@/components/BirthdayList.vue";
import AbsenteeList from "@/components/AbsenteeList.vue";
import SkeletonLoader from "@/components/SkeletonLoader.vue";
import AttendanceChart from "@/components/AttendanceChart.vue";

const CHART_COLORS = [
  "#FF6384",
  "#36A2EB",
  "#FFCE56",
  "#4BC0C0",
  "#9966FF",
  "#FF9F40",
  "#8AC926",
  "#1982C4",
  "#6A4C93",
  "#FF595E",
];

export default {
  name: "StatusView",
  components: {
    BirthdayList,
    AbsenteeList,
    SkeletonLoader,
    AttendanceChart,
  },
  data() {
    return {
      sundays: [],
      selectedDate: "",
      loading: false,
      groups: [],
      stats: [],
      absentees: [],
      absenteeLoading: false,
      birthdays: [],
      birthdayLoading: false,
      chartData: null,
      chartLoading: false,
      chartMode: "count", // 'count' or 'rate'
      rawChartStats: null,
      overallStats: {
        presentCount: 0,
        totalMembers: 0,
        attendanceRate: 0,
      },
      birthdayRangePast: 30,
      birthdayRangeFuture: 15,
    };
  },
  created() {
    this.sundays = generateTargetSundays();
    this.selectedDate = this.getMostRecentSunday();
  },
  mounted() {
    this.initialize();
  },
  methods: {
    async initialize() {
      await this.fetchAttendanceData();
      this.fetchChartData(); // 병렬로 실행해도 됨
      this.fetchLongTermAbsentees();
      this.fetchBirthdays();
    },
    getMostRecentSunday() {
      const today = new Date();
      const dayOfWeek = today.getDay();
      const mostRecentSunday = new Date(today);
      mostRecentSunday.setDate(today.getDate() - dayOfWeek);
      // Simple format YYYY-MM-DD
      const year = mostRecentSunday.getFullYear();
      const month = String(mostRecentSunday.getMonth() + 1).padStart(2, "0");
      const day = String(mostRecentSunday.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    },
    async fetchAttendanceData() {
      if (!this.selectedDate) return;
      this.loading = true;
      this.stats = [];
      try {
        // 0. Fetch Groups
        this.groups = await studentService.fetchGroups();

        // 1. Fetch All Students
        const allStudents = await studentService.fetchAllStudents();

        // 2. Filter Active Students at Date
        // 2. Filter Active Students at Date
        let activeStudentIds = studentService.filterActiveStudentsAtDate(
          allStudents,
          this.selectedDate
        );

        // EXTRA RULE: If selectedDate is the most recent Sunday (this week),
        // strict filter out anyone who is CURRENTLY inactive.
        // This ensures "Total Members" matches the Attendance View immediately after deactivation.
        const mostRecentSunday = this.getMostRecentSunday();
        if (this.selectedDate === mostRecentSunday) {
          const currentlyActiveIds = new Set(
            allStudents.filter((s) => s.status === "active").map((s) => s.id)
          );
          // Intersect to keep only those valid by date AND currently active
          activeStudentIds = new Set(
            [...activeStudentIds].filter((id) => currentlyActiveIds.has(id))
          );
        }

        // 3. Fetch Attendance
        const attendanceRecords = await attendanceService.fetchAttendanceByDate(
          this.selectedDate
        );

        // 4. Calculate Stats
        const statsMap = this.groups.map((group) => {
          const activeMembers = group.members
            ? group.members.filter((memberId) => activeStudentIds.has(memberId))
            : [];

          const groupRecords = attendanceRecords.filter(
            (r) =>
              r.groupId === group.id &&
              r.status === "present" &&
              activeStudentIds.has(r.studentId)
          );

          const totalMembers = activeMembers.length;
          const presentCount = groupRecords.length;
          const attendanceRate =
            totalMembers > 0
              ? ((presentCount / totalMembers) * 100).toFixed(1)
              : 0;

          return {
            groupId: group.id,
            groupName: group.groupName,
            presentCount,
            totalMembers,
            attendanceRate,
          };
        });

        this.stats = statsMap;

        // 5. Overall Stats
        const totalPresent = this.stats.reduce(
          (sum, stat) => sum + stat.presentCount,
          0
        );
        const totalMembers = this.stats.reduce(
          (sum, stat) => sum + stat.totalMembers,
          0
        );
        const overallRate =
          totalMembers > 0
            ? ((totalPresent / totalMembers) * 100).toFixed(1)
            : 0;

        this.overallStats = {
          presentCount: totalPresent,
          totalMembers: totalMembers,
          attendanceRate: overallRate,
        };
      } catch (error) {
        console.error("Error fetching status data:", error);
      } finally {
        this.loading = false;
      }
    },
    setChartMode(mode) {
      if (this.chartMode === mode) return;
      this.chartMode = mode;
      this.updateChartData();
    },
    async fetchChartData() {
      this.chartLoading = true;
      try {
        const recentSundays = getRecentSundays(5).reverse();

        // 병렬로 데이터 가져오기
        const [attendanceRecords, allStudents] = await Promise.all([
          attendanceService.fetchAttendanceByDates(recentSundays),
          studentService.fetchAllStudents(),
        ]);

        // 날짜별 라벨
        const labels = recentSundays.map((date) =>
          date.slice(5).replace("-", "/")
        );

        // 현재 활성 상태인 학생 ID 식별
        const currentlyActiveIds = new Set(
          allStudents.filter((s) => s.status === "active").map((s) => s.id)
        );

        // 데이터 가공 (날짜별, 그룹별 통계 미리 계산)
        const statsByDate = recentSundays.map((date) => {
          let activeStudentIds = studentService.filterActiveStudentsAtDate(
            allStudents,
            date
          );

          // 추가 필터: 현재 비활성 상태인 학생은 과거 통계에서도 제외
          activeStudentIds = new Set(
            [...activeStudentIds].filter((id) => currentlyActiveIds.has(id))
          );

          const groupStats = {};
          this.groups.forEach((group) => {
            const activeMembers = group.members
              ? group.members.filter((id) => activeStudentIds.has(id))
              : [];

            const presentCount = attendanceRecords.filter(
              (r) =>
                r.date === date &&
                r.groupId === group.id &&
                r.status === "present" &&
                activeStudentIds.has(r.studentId)
            ).length;

            const totalMembers = activeMembers.length;
            const rate =
              totalMembers > 0
                ? Math.round((presentCount / totalMembers) * 100)
                : 0;

            groupStats[group.id] = {
              count: presentCount,
              rate: rate,
            };
          });
          return groupStats;
        });

        this.rawChartStats = {
          labels,
          statsByDate,
        };

        this.updateChartData();
      } catch (error) {
        console.error("차트 데이터 로드 실패:", error);
      } finally {
        this.chartLoading = false;
      }
    },
    updateChartData() {
      if (!this.rawChartStats) return;

      const { labels, statsByDate } = this.rawChartStats;

      const datasets = this.groups.map((group, index) => {
        const data = statsByDate.map((stat) => stat[group.id][this.chartMode]);

        return {
          label: group.groupName,
          data: data,
          borderColor: CHART_COLORS[index % CHART_COLORS.length],
          backgroundColor: CHART_COLORS[index % CHART_COLORS.length],
          borderWidth: 2,
          tension: 0.3,
          pointRadius: 3,
        };
      });

      this.chartData = {
        labels,
        datasets,
      };
    },
    async fetchLongTermAbsentees() {
      this.absenteeLoading = true;
      this.absentees = [];
      try {
        const recentSundays = getRecentSundays(4);
        const attendanceRecords =
          await attendanceService.fetchAttendanceByDates(recentSundays);
        this.absentees = await studentService.fetchLongTermAbsentees(
          recentSundays,
          attendanceRecords
        );
      } catch (error) {
        console.error("Error fetching absentees:", error);
      } finally {
        this.absenteeLoading = false;
      }
    },
    async fetchBirthdays() {
      this.birthdayLoading = true;
      this.birthdays = [];
      try {
        // Fetch settings first
        const settings = await studentService.fetchSettings();
        if (settings) {
          if (settings.birthdayRangePast !== undefined) {
            this.birthdayRangePast = settings.birthdayRangePast;
          }
          if (settings.birthdayRangeFuture !== undefined) {
            this.birthdayRangeFuture = settings.birthdayRangeFuture;
          }
        }

        this.birthdays = await studentService.fetchBirthdays(
          this.birthdayRangePast,
          this.birthdayRangeFuture
        );
      } catch (error) {
        console.error("Error fetching birthdays:", error);
      } finally {
        this.birthdayLoading = false;
      }
    },
  },
};
</script>

<style scoped>
.status-view {
  max-width: 900px;
  margin: 0 auto;
}
.controls {
  margin-bottom: 2em;
}
/* Select Styling */
.select-wrapper {
  position: relative;
  width: 100%;
}
select {
  width: 100%;
  padding: 12px 15px;
  border-radius: 8px;
  border: 1px solid var(--border-color);
  font-size: 1em;
  background-color: var(--white);
  appearance: none;
  cursor: pointer;
  transition: border-color 0.2s;
}
select:focus {
  outline: none;
  border-color: var(--primary-color);
}
.select-arrow {
  position: absolute;
  top: 50%;
  right: 15px;
  transform: translateY(-50%);
  width: 0;
  height: 0;
  border-left: 6px solid transparent;
  border-right: 6px solid transparent;
  border-top: 6px solid var(--text-light);
  pointer-events: none;
}

.loading-message {
  text-align: center;
  color: var(--text-light);
  padding: 2em;
}
.skeleton-table {
  background-color: var(--white);
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
}
.skeleton-header {
  margin-bottom: 10px;
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 10px;
}
.skeleton-row {
  margin-bottom: 10px;
}

.status-table {
  width: 100%;
  border-collapse: collapse;
  background-color: var(--white);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  border-radius: 8px;
  overflow: hidden;
}
.status-table th,
.status-table td {
  padding: 15px 20px;
  text-align: left;
  border-bottom: 1px solid #f0f0f0;
}
.status-table th {
  background-color: #fafafa;
  font-weight: 600;
  color: var(--text-color);
}
.status-table tbody tr:hover {
  background-color: #f5f5f5;
}
.status-table tbody tr:last-child td {
  border-bottom: none;
}
.status-table tfoot tr {
  background-color: #e8f5e9;
  font-weight: bold;
  border-top: 2px solid #c8e6c9;
}
.status-table tfoot td {
  color: var(--secondary-color);
}
.divider {
  border: 0;
  height: 1px;
  background-color: var(--border-color);
  margin: 3em 0 2em;
}
.birthday-title {
  color: var(--accent-color);
  margin-bottom: 1em;
}
.absentee-title {
  color: var(--danger-color);
  margin-bottom: 1em;
}
.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1em;
}
.chart-title {
  color: #333;
  margin: 0;
}
.chart-controls {
  display: flex;
  gap: 5px;
}
.mode-btn {
  padding: 6px 12px;
  border: 1px solid #ddd;
  background-color: #f5f5f5;
  border-radius: 20px;
  cursor: pointer;
  font-size: 0.9em;
  color: #666;
  transition: all 0.2s;
}
.mode-btn.active {
  background-color: var(--primary-color);
  color: white;
  border-color: var(--primary-color);
  font-weight: bold;
}
.skeleton-chart {
  background-color: white;
  border-radius: 12px;
  padding: 15px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  margin-bottom: 2em;
}

@media (max-width: 600px) {
  .status-view {
    padding: 0 10px;
  }

  .status-table th,
  .status-table td {
    padding: 10px 5px;
    font-size: 0.9em;
    text-align: center;
  }

  .status-table th:first-child,
  .status-table td:first-child {
    text-align: left;
    padding-left: 10px;
  }

  .chart-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }

  .chart-controls {
    width: 100%;
    justify-content: flex-end;
  }

  .mode-btn {
    padding: 4px 10px;
    font-size: 0.85em;
  }
}
</style>
