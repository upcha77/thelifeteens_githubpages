<template>
  <div class="add-member-view">
    <div class="title-section">
      <h2>{{ isEditing ? "정보 수정" : "학생 추가" }}</h2>
      <button class="scroll-down-btn" @click="scrollToStudentList">
        학생 목록 보기 &#8595;
      </button>
    </div>
    <form class="add-form" @submit.prevent="handleSubmit">
      <div class="form-grid">
        <div class="form-group">
          <label for="name">이름</label>
          <input id="name" v-model="studentData.name" type="text" required />
        </div>
        <div class="form-group">
          <label for="gender">성별</label>
          <select id="gender" v-model="studentData.gender" required>
            <option disabled value="">선택</option>
            <option>남</option>
            <option>여</option>
          </select>
        </div>
        <div class="form-group">
          <label for="group">소속 목장</label>
          <select id="group" v-model="studentData.groupId" required>
            <option disabled value="">목장 선택</option>
            <option
              v-for="group in allGroups"
              :key="group.id"
              :value="group.id"
            >
              {{ group.groupName }}
            </option>
          </select>
        </div>
        <div class="form-group">
          <label for="contact">연락처</label>
          <input id="contact" v-model="studentData.contact" type="text" />
        </div>
        <div class="form-group">
          <label for="school">학교</label>
          <input id="school" v-model="studentData.school" type="text" />
        </div>
        <div class="form-group">
          <label for="grade">학년(나이)</label>
          <input id="grade" v-model="studentData.grade" type="text" required />
        </div>
        <div class="form-group">
          <label for="birthDate">생일 (예: 7월 24일)</label>
          <input id="birthDate" v-model="studentData.birthDate" type="text" />
        </div>
        <div class="form-group">
          <label for="address">주소</label>
          <input id="address" v-model="studentData.address" type="text" />
        </div>
        <div class="form-group">
          <label for="parentName">부모님/보호자 성함</label>
          <input id="parentName" v-model="studentData.parentName" type="text" />
        </div>
        <div class="form-group">
          <label for="parentContact">부모님/보호자 연락처</label>
          <input
            id="parentContact"
            v-model="studentData.parentContact"
            type="text"
          />
        </div>
        <div class="form-group">
          <label for="registrationType">등록 유형</label>
          <select id="registrationType" v-model="studentData.registrationType">
            <option>주일학교 출신</option>
            <option>새로운 등록자</option>
            <option>기타</option>
          </select>
        </div>
        <div class="form-group">
          <label for="howDidYouCome">방문 계기</label>
          <select id="howDidYouCome" v-model="studentData.howDidYouCome">
            <option>친구 혹은 아는 사람의 권유로</option>
            <option>교회 전도 활동을 통해</option>
            <option>부모님을 따라서</option>
            <option>그냥 교회를 가보고 싶어서</option>
            <option>기타</option>
          </select>
        </div>
        <div class="form-group full-width">
          <label for="familyFaith">가정 신앙 환경</label>
          <select id="familyFaith" v-model="studentData.familyFaith">
            <option>부모님이 본 교회를 출석하심</option>
            <option>부모님이 다른 교회에 출석하심</option>
            <option>부모님 종교 없음</option>
            <option>부모님 타종교</option>
            <option>기타</option>
          </select>
        </div>
        <div class="form-group full-width">
          <label for="note">기타 특이사항 및 기도제목</label>
          <textarea id="note" v-model="studentData.note" rows="4"></textarea>
        </div>
      </div>
      <div class="button-group">
        <button
          v-if="isEditing"
          type="button"
          class="cancel-btn"
          @click="cancelEdit"
        >
          취소
        </button>
        <button type="submit" class="submit-btn">
          {{ isEditing ? "정보 수정하기" : "학생 추가하기" }}
        </button>
      </div>
    </form>

    <hr class="divider" />

    <h2 id="student-list-title">전체 학생 명단</h2>
    <div v-if="loading" class="loading-message">학생 명단을 불러오는 중...</div>
    <div v-else>
      <input
        v-model="searchQuery"
        type="text"
        placeholder="이름으로 학생 검색..."
        class="search-input"
      />

      <!-- 트리형 구조 -->
      <div class="student-tree">
        <div
          v-for="groupData in groupedStudents"
          :key="groupData.id"
          class="group-section"
        >
          <!-- 목장 헤더 -->
          <div class="group-header" @click="toggleGroup(groupData.id)">
            <span class="toggle-icon">{{
              isExpanded(groupData.id) ? "▼" : "▶"
            }}</span>
            <span class="group-title">{{ groupData.groupName }}</span>
            <span class="group-count">({{ groupData.students.length }}명)</span>
          </div>

          <!-- 학생 목록 (확장되었을 때만 표시) -->
          <ul v-show="isExpanded(groupData.id)" class="tree-student-list">
            <li
              v-for="student in groupData.students"
              :key="student.id"
              :class="{ 'is-inactive': student.status === 'inactive' }"
            >
              <div class="student-info">
                <span class="student-name">{{ student.name }}</span>
                <span class="student-details">{{ student.grade }}</span>
              </div>
              <div class="button-container">
                <button
                  class="history-btn"
                  @click="openAttendanceHistory(student)"
                  title="출석 히스토리 보기"
                >
                  출석
                </button>
                <button class="edit-btn" @click="editStudent(student)">
                  수정
                </button>
                <button
                  class="deactivate-btn"
                  @click="deactivateStudent(student)"
                >
                  {{ student.status === "inactive" ? "활성화" : "비활성화" }}
                </button>
                <button class="delete-btn" @click="deleteStudent(student)">
                  삭제
                </button>
              </div>
            </li>
          </ul>
        </div>

        <div v-if="groupedStudents.length === 0" class="no-result">
          검색 결과가 없습니다.
        </div>
      </div>
    </div>

    <!-- 출석 히스토리 모달 -->
    <StudentAttendanceModal
      v-if="selectedStudentForHistory"
      :visible="isHistoryModalOpen"
      :student="selectedStudentForHistory"
      @close="closeHistoryModal"
    />
  </div>
</template>

<script>
import { db, FieldValue } from "@/firebase";
import { studentService } from "@/services/studentService";
import StudentAttendanceModal from "@/components/StudentAttendanceModal.vue";

const initialStudentState = {
  name: "",
  gender: "",
  groupId: "",
  contact: "",
  school: "",
  grade: "",
  birthDate: "",
  address: "",
  parentName: "",
  parentContact: "",
  registrationType: "주일학교 출신",
  howDidYouCome: "친구 혹은 아는 사람의 권유로",
  familyFaith: "부모님이 본 교회를 출석하심",
  note: "",
  status: "active",
};

export default {
  name: "AddMemberView",
  components: {
    StudentAttendanceModal,
  },
  data() {
    return {
      studentData: { ...initialStudentState },
      allStudents: [],
      allGroups: [],
      isEditing: false,
      editingStudentId: null,
      originalGroupId: null,
      loading: true,
      searchQuery: "",
      expandedGroups: [], // 확장된 그룹 ID 목록
      isHistoryModalOpen: false,
      selectedStudentForHistory: null,
    };
  },
  computed: {
    groupedStudents() {
      // 1. 검색어 필터링
      const query = this.searchQuery.toLowerCase().trim();
      let filtered = this.allStudents;

      if (query) {
        filtered = this.allStudents.filter((student) =>
          student.name.toLowerCase().includes(query)
        );
      }

      // 2. 그룹별로 분류
      const groupsMap = new Map();

      // 모든 목장 초기화 (빈 목장도 보여줄지 여부는 선택사항이나, 여기서는 학생이 있는 경우만 보여주거나,
      // 전체 목장 틀을 보여주고 학생이 없으면 0명으로 표시하는 것이 트리 구조에 적합)
      // 하지만 검색 시에는 매칭된 학생이 있는 목장만 보여주는게 깔끔함.
      // 검색어가 없을 때는 모든 목장을 보여줌.

      this.allGroups.forEach((group) => {
        groupsMap.set(group.id, {
          id: group.id,
          groupName: group.groupName,
          order: group.order || 9999,
          students: [],
        });
      });

      // 미배정 그룹 추가
      const unassignedId = "unassigned";
      groupsMap.set(unassignedId, {
        id: unassignedId,
        groupName: "미배정",
        order: 10000,
        students: [],
      });

      // 학생 할당
      filtered.forEach((student) => {
        const groupId =
          student.groupId && groupsMap.has(student.groupId)
            ? student.groupId
            : unassignedId;
        groupsMap.get(groupId).students.push(student);
      });

      // 3. 결과 배열로 변환 및 정렬
      let result = Array.from(groupsMap.values());

      // 검색어가 있을 때는 학생이 없는 그룹은 제외 (선택사항)
      if (query) {
        result = result.filter((g) => g.students.length > 0);
      } else {
        // 검색어가 없을 때는 학생이 없어도 목장 목록은 보여줌 (미배정은 학생 없으면 숨김)
        result = result.filter(
          (g) => g.id !== unassignedId || g.students.length > 0
        );
      }

      // 그룹 정렬
      result.sort((a, b) => a.order - b.order);

      // 각 그룹 내 학생 정렬
      result.forEach((group) => {
        group.students.sort((a, b) => {
          if (a.status === "active" && b.status !== "active") return -1;
          if (a.status !== "active" && b.status === "active") return 1;
          return a.name.localeCompare(b.name);
        });
      });

      return result;
    },
  },
  watch: {
    // 검색어가 변경되면 자동으로 모든 그룹 확장
    searchQuery(newVal) {
      if (newVal) {
        this.expandAll();
      }
    },
  },
  created() {
    this.initialize();
  },
  methods: {
    async initialize() {
      this.loading = true;
      try {
        await Promise.all([this.fetchStudents(), this.fetchGroups()]);

        // 설정 조회 및 적용
        const settings = await studentService.fetchSettings();
        const shouldCollapse = settings?.defaultCollapseGroups ?? false;

        if (!shouldCollapse) {
          this.expandAll();
        }
      } catch (error) {
        console.error("데이터 초기화 실패:", error);
      } finally {
        this.loading = false;
      }
    },
    toggleGroup(groupId) {
      const index = this.expandedGroups.indexOf(groupId);
      if (index === -1) {
        this.expandedGroups.push(groupId);
      } else {
        this.expandedGroups.splice(index, 1);
      }
    },
    isExpanded(groupId) {
      return this.expandedGroups.includes(groupId);
    },
    expandAll() {
      this.expandedGroups = [...this.allGroups.map((g) => g.id), "unassigned"];
    },
    scrollToStudentList() {
      const listElement = document.getElementById("student-list-title");
      if (listElement) {
        listElement.scrollIntoView({ behavior: "smooth" });
      }
    },
    async fetchStudents() {
      const snapshot = await db.collection("students").get();
      this.allStudents = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    },
    async fetchGroups() {
      try {
        const snapshot = await db
          .collection("groups")
          .orderBy("groupName", "asc")
          .get();

        const groups = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // 클라이언트 사이드 정렬
        groups.sort((a, b) => {
          const orderA = a.order !== undefined ? a.order : 9999;
          const orderB = b.order !== undefined ? b.order : 9999;
          if (orderA !== orderB) return orderA - orderB;
          return a.groupName.localeCompare(b.groupName);
        });

        this.allGroups = groups;
      } catch (error) {
        console.error("목장 목록 조회 실패:", error);
      }
    },
    getGroupName(groupId) {
      const group = this.allGroups.find((g) => g.id === groupId);
      return group ? group.groupName : "미배정";
    },
    editStudent(student) {
      this.isEditing = true;
      this.editingStudentId = student.id;
      this.originalGroupId = student.groupId;
      this.studentData = { ...initialStudentState, ...student };
      window.scrollTo(0, 0);
    },
    cancelEdit() {
      this.isEditing = false;
      this.editingStudentId = null;
      this.originalGroupId = null;
      this.studentData = { ...initialStudentState };
    },
    async deactivateStudent(student) {
      const newStatus = student.status === "inactive" ? "active" : "inactive";
      const actionText = newStatus === "inactive" ? "비활성화" : "활성화";

      if (
        await this.$confirm(
          `'${student.name}' 학생을 ${actionText}하시겠습니까?`
        )
      ) {
        try {
          const studentRef = db.collection("students").doc(student.id);
          const updateData = { status: newStatus };

          if (newStatus === "inactive") {
            updateData.deactivatedAt = new Date().toISOString().split("T")[0];
          } else {
            updateData.deactivatedAt = FieldValue.delete();
          }

          await studentRef.update(updateData);
          studentService.clearCache(); // 캐시 초기화
          this.$alert(`'${student.name}' 학생이 ${actionText}되었습니다.`);
          await this.fetchStudents();
        } catch (error) {
          console.error(`학생 ${actionText} 중 오류 발생: `, error);
          this.$alert(`학생을 ${actionText}하는 데 실패했습니다.`);
        }
      }
    },
    async deleteStudent(student) {
      if (
        await this.$confirm(
          `'${student.name}' 학생을 정말 삭제하시겠습니까?\n삭제된 데이터는 복구할 수 없습니다.`
        )
      ) {
        try {
          await db.collection("students").doc(student.id).delete();
          if (student.groupId) {
            try {
              const groupRef = db.collection("groups").doc(student.groupId);
              await groupRef.update({
                members: FieldValue.arrayRemove(student.id),
              });
            } catch (groupError) {
              console.warn(
                "그룹 멤버 제거 실패 (그룹이 삭제되었을 수 있음):",
                groupError
              );
            }
          }
          studentService.clearCache(); // 캐시 초기화
          this.$alert(`'${student.name}' 학생이 삭제되었습니다.`);
          await this.fetchStudents();
        } catch (error) {
          console.error("학생 삭제 중 오류 발생: ", error);
          this.$alert("학생을 삭제하는 데 실패했습니다.");
        }
      }
    },
    async handleSubmit() {
      if (this.isEditing) {
        await this.updateStudent();
      } else {
        await this.addStudent();
      }
    },
    async addStudent() {
      if (
        !this.studentData.name.trim() ||
        !this.studentData.groupId ||
        !this.studentData.gender ||
        !this.studentData.grade
      ) {
        this.$alert(
          "이름, 성별, 소속 목장, 학년(나이)는 필수 입력 항목입니다."
        );
        return;
      }
      try {
        const newStudentRef = await db
          .collection("students")
          .add(this.studentData);
        const groupRef = db.collection("groups").doc(this.studentData.groupId);
        await groupRef.update({
          members: FieldValue.arrayUnion(newStudentRef.id),
        });
        studentService.clearCache(); // 캐시 초기화
        this.$alert(
          `'${this.studentData.name}' 학생 정보가 성공적으로 추가되었습니다.`
        );
        this.cancelEdit();
        await this.initialize();
      } catch (error) {
        console.error("학생 추가 중 오류 발생: ", error);
      }
    },
    async updateStudent() {
      try {
        const studentRef = db.collection("students").doc(this.editingStudentId);
        await studentRef.update(this.studentData);

        if (this.originalGroupId !== this.studentData.groupId) {
          if (this.originalGroupId) {
            const oldGroupRef = db
              .collection("groups")
              .doc(this.originalGroupId);
            await oldGroupRef.update({
              members: FieldValue.arrayRemove(this.editingStudentId),
            });
          }
          const newGroupRef = db
            .collection("groups")
            .doc(this.studentData.groupId);
          await newGroupRef.update({
            members: FieldValue.arrayUnion(this.editingStudentId),
          });
        }
        studentService.clearCache(); // 캐시 초기화
        this.$alert(
          `'${this.studentData.name}' 학생 정보가 성공적으로 수정되었습니다.`
        );
        this.cancelEdit();
        await this.initialize();
      } catch (error) {
        console.error("학생 정보 수정 중 오류 발생: ", error);
      }
    },
    openAttendanceHistory(student) {
      this.selectedStudentForHistory = student;
      this.isHistoryModalOpen = true;
    },
    closeHistoryModal() {
      this.isHistoryModalOpen = false;
      this.selectedStudentForHistory = null;
    },
  },
};
</script>

<style scoped>
/* 이전과 동일한 스타일 */
.add-member-view {
  max-width: 800px;
  margin: 0 auto;
  padding: 2em;
}
.title-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1em;
}
.scroll-down-btn {
  background: none;
  border: 1px solid #ddd;
  padding: 8px 12px;
  border-radius: 20px;
  cursor: pointer;
  color: #555;
  font-size: 0.9em;
  transition: all 0.2s;
}
.scroll-down-btn:hover {
  background-color: #f5f5f5;
  border-color: #ccc;
}
.add-form {
  padding: 2em;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  margin-bottom: 3em;
}
h2 {
  text-align: center;
  margin: 0;
  color: #333;
}
.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5em;
}
.form-group {
  display: flex;
  flex-direction: column;
}
.form-group.full-width {
  grid-column: 1 / -1;
}
.form-group label {
  margin-bottom: 0.5em;
  font-weight: 600;
  color: #555;
}
.form-group input,
.form-group select,
.form-group textarea {
  padding: 12px;
  border-radius: 8px;
  border: 1px solid #ddd;
  font-size: 1em;
  transition: border-color 0.2s;
  font-family: inherit;
}
.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #484848;
}
.button-group {
  display: flex;
  gap: 1em;
  margin-top: 2em;
}
.submit-btn,
.cancel-btn {
  flex-grow: 1;
  padding: 15px;
  border: none;
  border-radius: 8px;
  font-size: 1.1em;
  cursor: pointer;
  transition: background-color 0.2s ease-in-out;
}
.submit-btn {
  background-color: #282828;
  color: white;
}
.submit-btn:hover {
  background-color: #484848;
}
.cancel-btn {
  background-color: #ddd;
  color: #333;
}
.cancel-btn:hover {
  background-color: #ccc;
}
.divider {
  border: 0;
  height: 1px;
  background-color: #eee;
  margin: 2em 0;
}
.search-input {
  width: 100%;
  padding: 12px;
  border-radius: 8px;
  border: 1px solid #ddd;
  font-size: 1em;
  margin-bottom: 1.5em;
  box-sizing: border-box;
}

/* 트리 구조 스타일 */
.student-tree {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.group-section {
  background-color: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.group-header {
  padding: 15px;
  background-color: #f9f9f9;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 10px;
  border-bottom: 1px solid #eee;
  transition: background-color 0.2s;
}

.group-header:hover {
  background-color: #f0f0f0;
}

.toggle-icon {
  font-size: 0.8em;
  color: #777;
  width: 20px;
  text-align: center;
}

.group-title {
  font-weight: bold;
  font-size: 1.1em;
  color: #333;
}

.group-count {
  color: #888;
  font-size: 0.9em;
}

.tree-student-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.tree-student-list li {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  border-bottom: 1px solid #f0f0f0;
  transition: background-color 0.2s;
}

.tree-student-list li:last-child {
  border-bottom: none;
}

.tree-student-list li:hover {
  background-color: #fafafa;
}

.student-info {
  display: flex;
  flex-direction: column;
}

.student-name {
  font-weight: bold;
}

.student-details {
  color: #777;
  font-size: 0.9em;
  margin-top: 4px;
}

.button-container {
  display: flex;
  gap: 0.5em;
}

.edit-btn {
  padding: 6px 12px;
  border: 1px solid #ddd;
  background-color: #f8f8f8;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9em;
}

.deactivate-btn {
  padding: 6px 12px;
  border: 1px solid #aaa;
  background-color: #f8f8f8;
  color: #555;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9em;
}
.deactivate-btn:hover {
  background-color: #aaa;
  color: white;
}

.history-btn {
  padding: 6px 12px;
  border: 1px solid #c8e6c9;
  background-color: #e8f5e9;
  color: #2e7d32;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9em;
}

.history-btn:hover {
  background-color: #c8e6c9;
}

.delete-btn {
  padding: 6px 12px;
  border: 1px solid #ffcdd2;
  background-color: #ffebee;
  color: #c62828;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9em;
}
.delete-btn:hover {
  background-color: #ef9a9a;
  color: white;
  border-color: #ef9a9a;
}

.is-inactive {
  background-color: #f7f7f7 !important;
  opacity: 0.6;
}
.is-inactive .student-name {
  text-decoration: line-through;
}

.no-result {
  text-align: center;
  padding: 2em;
  color: #888;
}

@media (max-width: 600px) {
  .add-member-view {
    padding: 10px;
  }

  .title-section {
    flex-direction: column;
    gap: 10px;
    align-items: center;
    text-align: center;
  }

  .add-form {
    padding: 1.5em 1em;
  }

  .form-grid {
    grid-template-columns: 1fr;
    gap: 1em;
  }

  .button-group {
    flex-direction: column;
  }

  .tree-student-list li {
    padding: 10px 5px;
  }

  .button-container {
    gap: 4px;
  }

  .edit-btn,
  .deactivate-btn,
  .delete-btn {
    padding: 5px 8px;
    font-size: 0.8em;
  }
}
</style>
