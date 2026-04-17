<template>
  <div class="birthday-section">
    <div v-if="loading" class="birthday-list">
      <div v-for="n in 3" :key="n" class="birthday-card skeleton-card">
        <div class="birthday-info">
          <SkeletonLoader
            width="120px"
            height="24px"
            style="margin-bottom: 8px"
          />
          <SkeletonLoader
            width="80px"
            height="16px"
            style="margin-bottom: 4px"
          />
          <SkeletonLoader width="150px" height="14px" />
        </div>
      </div>
    </div>
    <div v-else-if="students.length > 0">
      <div class="birthday-list">
        <div
          v-for="student in students"
          :key="student.id"
          class="birthday-card"
        >
          <div class="birthday-info">
            <div class="birthday-header">
              <span class="birthday-name">{{ student.name }}</span>
              <span class="birthday-badge" :class="getDDayClass(student.dDay)">
                {{ formatDDay(student.dDay) }}
              </span>
            </div>
            <span class="birthday-date">{{ student.birthDate }}</span>
            <span class="birthday-details"
              >{{ student.grade }} / {{ getGroupName(student.groupId) }}</span
            >
          </div>
          <div class="birthday-actions">
            <a
              v-if="student.contact"
              :href="`tel:${student.contact}`"
              class="action-btn call-btn"
              >전화</a
            >
            <a
              v-if="student.contact"
              :href="`sms:${student.contact}`"
              class="action-btn sms-btn"
              >문자</a
            >
          </div>
        </div>
      </div>
    </div>
    <div v-else class="empty-message">해당 기간 내 생일인 학생이 없습니다.</div>
  </div>
</template>

<script>
import SkeletonLoader from "@/components/SkeletonLoader.vue";

export default {
  name: "BirthdayList",
  components: {
    SkeletonLoader,
  },
  props: {
    students: {
      type: Array,
      required: true,
    },
    loading: {
      type: Boolean,
      default: false,
    },
    groups: {
      type: Array,
      default: () => [],
    },
  },
  methods: {
    getGroupName(groupId) {
      const group = this.groups.find((g) => g.id === groupId);
      return group ? group.groupName : "미배정";
    },
    formatDDay(dDay) {
      if (dDay === 0) return "D-Day";
      if (dDay > 0) return `D-${dDay}`;
      return `D+${Math.abs(dDay)}`;
    },
    getDDayClass(dDay) {
      if (dDay === 0) return "d-day-today";
      if (dDay > 0) return "d-day-upcoming";
      return "d-day-past";
    },
  },
};
</script>

<style scoped>
.loading-message {
  text-align: center;
  color: var(--text-light);
  padding: 2em;
}
.empty-message {
  text-align: center;
  color: var(--secondary-color);
  padding: 2em;
  background-color: #e8f5e9;
  border-radius: 8px;
  font-weight: bold;
}
.birthday-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 15px;
}
.birthday-card {
  background-color: var(--white);
  padding: 15px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-left: 4px solid var(--accent-color);
}
.skeleton-card {
  border-left-color: var(--border-color);
}
.birthday-info {
  display: flex;
  flex-direction: column;
}
.birthday-header {
  display: flex;
  align-items: center;
  gap: 8px;
}
.birthday-name {
  font-weight: bold;
  font-size: 1.1em;
  color: var(--text-color);
}
.birthday-badge {
  font-size: 0.8em;
  padding: 2px 6px;
  border-radius: 12px;
  font-weight: bold;
  color: white;
}
.d-day-today {
  background-color: var(--accent-color);
}
.d-day-upcoming {
  background-color: var(--accent-light);
}
.d-day-past {
  background-color: var(--text-light);
}
.birthday-date {
  font-size: 0.9em;
  color: #555;
  margin-top: 2px;
}
.birthday-details {
  font-size: 0.85em;
  color: var(--text-light);
  margin-top: 2px;
}
.birthday-actions {
  display: flex;
  gap: 8px;
}
.action-btn {
  text-decoration: none;
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 0.9em;
  font-weight: bold;
  transition: background-color 0.2s;
}
.call-btn {
  background-color: #e3f2fd;
  color: #1976d2;
}
.call-btn:hover {
  background-color: #bbdefb;
}
.sms-btn {
  background-color: #f3e5f5;
  color: #7b1fa2;
}
.sms-btn:hover {
  background-color: #e1bee7;
}
</style>
