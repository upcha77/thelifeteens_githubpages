<template>
  <div class="absentee-section">
    <div v-if="loading" class="absentee-list">
      <div v-for="n in 3" :key="n" class="absentee-card skeleton-card">
        <div class="absentee-info">
          <SkeletonLoader
            width="120px"
            height="24px"
            style="margin-bottom: 8px"
          />
          <SkeletonLoader width="150px" height="14px" />
        </div>
      </div>
    </div>
    <div v-else-if="students.length > 0">
      <div class="absentee-list">
        <div
          v-for="student in students"
          :key="student.id"
          class="absentee-card"
        >
          <div class="absentee-info">
            <span class="absentee-name">{{ student.name }}</span>
            <span class="absentee-details"
              >{{ student.grade }} / {{ getGroupName(student.groupId) }}</span
            >
          </div>
          <div class="absentee-actions">
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
    <div v-else class="empty-message">
      최근 4주간 결석한 학생이 없습니다. (모두 출석을 잘 하고 있네요!)
    </div>
  </div>
</template>

<script>
import SkeletonLoader from "@/components/SkeletonLoader.vue";

export default {
  name: "AbsenteeList",
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
.absentee-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 15px;
}
.absentee-card {
  background-color: var(--white);
  padding: 15px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-left: 4px solid var(--danger-color);
}
.skeleton-card {
  border-left-color: var(--border-color);
}
.absentee-info {
  display: flex;
  flex-direction: column;
}
.absentee-name {
  font-weight: bold;
  font-size: 1.1em;
  color: var(--text-color);
}
.absentee-details {
  font-size: 0.9em;
  color: var(--text-light);
  margin-top: 4px;
}
.absentee-actions {
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
