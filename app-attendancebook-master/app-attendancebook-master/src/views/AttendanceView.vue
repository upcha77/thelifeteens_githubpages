<template>
  <div class="attendance">
    <!-- 1. 주일 및 목장 선택 -->
    <div class="controls">
      <div class="select-wrapper">
        <select v-model="selectedDate" @change="fetchStudents">
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
      <div class="select-wrapper">
        <select v-model="selectedGroup" @change="fetchStudents">
          <option disabled value="">목장을 선택하세요</option>
          <option v-for="group in groups" :key="group.id" :value="group.id">
            {{ group.groupName }}
          </option>
        </select>
        <div class="select-arrow"></div>
      </div>
    </div>

    <!-- 2. 학생 명단 및 출석 체크 -->
    <div v-if="selectedGroup">
      <div v-if="studentLoading" class="loading-message">
        학생 명단을 불러오는 중입니다...
      </div>
      <div v-else-if="students.length > 0">
        <h3>{{ selectedGroupName }} 학생 명단 ({{ selectedDate }})</h3>

        <!-- 출석 현황 라벨과 전체출석 버튼 -->
        <div class="summary-controls">
          <div class="attendance-summary">
            총원 {{ activeStudentsCount }}명 / 출석 {{ presentCount }}명
          </div>
          <button class="toggle-all-btn" @click="toggleAllAttendance">
            전체출석
          </button>
        </div>

        <div class="student-grid">
          <div
            v-for="student in students"
            :key="student.id"
            class="student-button"
            :class="getAttendanceStatusClass(student)"
            @click="toggleAttendance(student.id)"
          >
            {{ student.name }}
          </div>
        </div>
        <button class="submit-btn" @click="submitAttendance">출석 저장</button>
      </div>
      <div v-else class="loading-message">목장에 소속된 학생이 없습니다.</div>
    </div>
  </div>
</template>

<script>
import { EventBus } from "@/utils/eventBus";
import { generateTargetSundays } from "@/utils/dateUtils";
import { studentService } from "@/services/studentService";
import { attendanceService } from "@/services/attendanceService";

export default {
  name: "AttendanceView",
  data() {
    return {
      groups: [],
      students: [],
      selectedGroup: "",
      selectedGroupName: "",
      sundays: [],
      selectedDate: "",
      loading: true,
      studentLoading: false,
      attendanceData: {},
    };
  },
  computed: {
    activeStudentsCount() {
      // Logic: Count only students who are CURRENTLY active.
      // This ensures consistency with the visual grayed-out state.
      // Inactive students (even if deactivated recently) are excluded from the total count in the UI.
      if (!this.students) return 0;
      return this.students.filter((s) => s.status === "active").length;
    },
    presentCount() {
      return Object.values(this.attendanceData).filter(
        (status) => status === "present"
      ).length;
    },
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
      await this.fetchGroups();
      if (this.groups.length > 0) {
        this.selectedGroup = this.groups[0].id;
        await this.fetchStudents();
      }
    },
    getMostRecentSunday() {
      const today = new Date();
      const dayOfWeek = today.getDay();
      const mostRecentSunday = new Date(today);
      mostRecentSunday.setDate(today.getDate() - dayOfWeek);
      const year = mostRecentSunday.getFullYear();
      const month = String(mostRecentSunday.getMonth() + 1).padStart(2, "0");
      const day = String(mostRecentSunday.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    },

    toggleAllAttendance() {
      // 활성화된 학생들만 기준으로 전체 출석 여부 판단
      const allPresent = this.presentCount === this.activeStudentsCount;

      if (allPresent) {
        this.attendanceData = {};
      } else {
        const newAttendanceData = {};
        this.students.forEach((student) => {
          // 활성화된 학생만 출석 처리
          if (student.status === "active") {
            newAttendanceData[student.id] = "present";
          }
        });
        this.attendanceData = newAttendanceData;
      }
    },

    getAttendanceStatusClass(student) {
      if (this.attendanceData[student.id] === "present") {
        return "status-present";
      }
      return student.status === "inactive"
        ? "status-inactive"
        : "status-unchecked";
    },

    async fetchGroups() {
      this.loading = true;
      try {
        this.groups = await studentService.fetchGroups();
      } catch (error) {
        console.error("목장 목록 조회 실패:", error);
        EventBus.$emit("show-toast", {
          message: "목장 목록을 불러오지 못했습니다.",
          type: "error",
        });
      } finally {
        this.loading = false;
      }
    },
    async fetchStudents() {
      if (!this.selectedGroup || !this.selectedDate) return;
      this.studentLoading = true;
      this.students = [];
      this.attendanceData = {};
      try {
        // 1. Fetch Group Details (to get member list)
        const groupData = await studentService.fetchGroupById(
          this.selectedGroup
        );
        if (!groupData) throw new Error("목장 정보를 찾을 수 없습니다.");

        this.selectedGroupName = groupData.groupName;
        const studentIds = groupData.members;

        if (!studentIds || studentIds.length === 0) {
          this.students = [];
          this.studentLoading = false;
          return;
        }

        // 2. Fetch Students
        this.students = await studentService.fetchStudentsByIds(studentIds);

        // Sort: Active first, then Name
        this.students.sort((a, b) => {
          if (a.status === b.status) {
            return a.name.localeCompare(b.name);
          }
          return a.status === "active" ? -1 : 1;
        });

        // 3. Fetch Attendance
        const attendanceRecords =
          await attendanceService.fetchAttendanceForGroup(
            this.selectedDate,
            studentIds
          );

        attendanceRecords.forEach((record) => {
          if (record.status === "present") {
            this.$set(this.attendanceData, record.studentId, record.status);
          }
        });
      } catch (error) {
        console.error("학생 및 출석 목록을 가져오는 데 실패했습니다:", error);
        EventBus.$emit("show-toast", {
          message: "학생 목록을 불러오지 못했습니다.",
          type: "error",
        });
      } finally {
        this.studentLoading = false;
      }
    },
    async toggleAttendance(studentId) {
      const student = this.students.find((s) => s.id === studentId);
      if (!student) return;

      // Handle inactive student check
      if (student.status === "inactive") {
        if (
          await this.$confirm(
            `'${student.name}' 학생은 현재 비활성화 상태입니다.\n활성화하고 출석 체크하시겠습니까?`
          )
        ) {
          const success = await studentService.reactivateStudent(studentId);
          if (success) {
            this.$set(this.attendanceData, studentId, "present");
            // Refresh student list to update UI (remove grayed out style)
            await this.fetchStudents();
            EventBus.$emit("show-toast", {
              message: "학생이 활성화되고 출석 체크되었습니다.",
              type: "success",
            });
          } else {
            EventBus.$emit("show-toast", {
              message: "학생 활성화에 실패했습니다.",
              type: "error",
            });
          }
        }
        return;
      }

      // Normal toggle for active students
      const currentStatus = this.attendanceData[studentId];
      const nextStatus = currentStatus === "present" ? undefined : "present";

      if (nextStatus) {
        this.$set(this.attendanceData, studentId, nextStatus);
      } else {
        this.$delete(this.attendanceData, studentId);
      }
    },
    async submitAttendance() {
      try {
        await attendanceService.saveAttendance(
          this.selectedDate,
          this.selectedGroup,
          this.attendanceData,
          this.students
        );
        EventBus.$emit("show-toast", {
          message: "출석 정보가 성공적으로 저장되었습니다!",
          type: "success",
        });
      } catch (error) {
        console.error("출석 정보 저장에 실패했습니다:", error);
        EventBus.$emit("show-toast", {
          message: "출석 정보 저장에 실패했습니다.",
          type: "error",
        });
      }
    },
  },
};
</script>

<style scoped>
.controls {
  display: flex;
  gap: 1em;
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
.summary-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5em;
}
.attendance-summary {
  font-size: 1.2em;
  font-weight: bold;
  color: var(--text-color);
}
.toggle-all-btn {
  padding: 8px 16px;
  border: 1px solid var(--primary-color);
  background-color: var(--primary-color);
  color: white;
  border-radius: 20px;
  cursor: pointer;
  font-weight: bold;
  transition: all 0.2s;
}
.toggle-all-btn:hover {
  background-color: #484848;
}
.student-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 10px;
}
.student-button {
  padding: 20px 10px;
  border-radius: 8px;
  text-align: center;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
}
.status-unchecked {
  background-color: transparent;
  color: #555;
  border: 2px solid var(--border-color);
}
.status-unchecked:hover {
  background-color: #f0f0f0;
}
.status-inactive {
  background-color: #f5f5f5;
  color: #999;
  border: 2px dashed var(--border-color);
  font-style: italic;
}
.status-inactive:hover {
  background-color: #e0e0e0;
  border-color: #ccc;
}
.status-present {
  background-color: var(--secondary-color);
  color: white;
  border: 2px solid var(--secondary-color);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}
.submit-btn {
  display: block;
  width: 100%;
  padding: 15px;
  background-color: var(--primary-color);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1.1em;
  cursor: pointer;
  margin-top: 1.5em;
  transition: background-color 0.2s ease-in-out;
}
.submit-btn:hover {
  background-color: #484848;
}
</style>
