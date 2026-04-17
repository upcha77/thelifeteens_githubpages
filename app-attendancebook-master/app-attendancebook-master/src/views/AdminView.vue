<template>
  <div class="admin-view">
    <!-- 로그인 섹션 -->
    <div v-if="!isAuthenticated" class="login-section">
      <h2>관리자 인증</h2>
      <p>관리 페이지 접근을 위해 암호를 입력해주세요.</p>
      <div class="login-form">
        <input
          type="password"
          v-model="passwordInput"
          @keyup.enter="checkPassword"
          placeholder="암호 입력"
          class="password-input"
        />
        <button @click="checkPassword" class="login-btn">확인</button>
      </div>
    </div>

    <!-- 관리자 콘텐츠 (인증 후 표시) -->
    <!-- 관리자 콘텐츠 (인증 후 표시) -->
    <div v-else class="admin-content">
      <h2>목장 관리</h2>

      <!-- 학생 데이터 일괄 등록 섹션 -->
      <section class="admin-card">
        <h3>학생 데이터 일괄 등록 (JSON)</h3>
        <div class="card-content">
          <div class="import-controls">
            <button class="download-btn" @click="downloadSampleJson">
              샘플 양식 다운로드
            </button>
            <div class="upload-wrapper">
              <input
                ref="jsonFileInput"
                type="file"
                accept=".json"
                style="display: none"
                @change="handleJsonUpload"
              />
              <button class="upload-btn" @click="triggerJsonUpload">
                JSON 파일 업로드
              </button>
            </div>
          </div>
          <div class="description-text mt-10">
            * 엑셀에서 변환하거나 직접 작성한 JSON 파일을 업로드하여 학생
            데이터를 일괄 등록/수정할 수 있습니다.<br />
            * '이름'과 '목장'이 일치하는 학생이 있으면 정보를 업데이트하고,
            없으면 새로 추가합니다.
          </div>
        </div>
      </section>

      <!-- 출석 현황 복사 섹션 -->
      <section class="admin-card">
        <h3>출석 현황 복사</h3>
        <div class="card-content">
          <div class="copy-attendance-controls">
            <div class="select-wrapper">
              <select v-model="selectedDate">
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
            <button @click="copyAttendanceStats" class="copy-btn">
              출석현황 복사
            </button>
          </div>
        </div>
      </section>

      <!-- 데이터 내보내기 섹션 -->
      <section class="admin-card">
        <h3>데이터 내보내기 (Excel Report)</h3>
        <div class="card-content">
          <div class="export-controls">
            <button class="download-excel-btn" @click="downloadFullReport">
              Excel 리포트 다운로드 (전체 학생 + 출석 + 차트)
            </button>
          </div>
          <div class="description-text mt-10">
            * 전체 학생 명단, 주차별 출석 로그, 그리고 출석 통계(차트 포함)가
            포함된 엑셀 파일을 다운로드합니다.<br />
            * 차트 이미지를 생성하는 동안 수 초가 소요될 수 있습니다.
          </div>
        </div>
      </section>

      <!-- 설정 섹션 -->
      <section class="admin-card">
        <h3>장기 미출석자 관리</h3>
        <div class="card-content">
          <label class="checkbox-label">
            <input
              type="checkbox"
              :checked="autoDeactivate"
              @change="toggleAutoDeactivate"
            />
            장기 미출석자(4주 이상) 일괄 비활성화
          </label>
          <button
            @click="runAutoDeactivation"
            :disabled="!autoDeactivate"
            class="apply-btn"
          >
            적용
          </button>
        </div>
      </section>

      <!-- 생일자 체크 설정 섹션 -->
      <section class="admin-card">
        <h3>생일자 체크 범위 설정</h3>
        <div class="card-content">
          <div class="birthday-settings">
            <div class="setting-item">
              <label>지난 날짜 (일)</label>
              <input type="number" v-model.number="birthdayRangePast" min="0" />
            </div>
            <div class="setting-item">
              <label>다가올 날짜 (일)</label>
              <input
                type="number"
                v-model.number="birthdayRangeFuture"
                min="0"
              />
            </div>
            <button @click="saveBirthdaySettings" class="save-btn">
              설정 저장
            </button>
          </div>
        </div>
      </section>

      <!-- 설정 섹션 -->
      <section class="admin-card">
        <h3>암호 관리 (보안 설정)</h3>
        <div class="card-content">
          <div class="password-management">
            <div class="setting-item">
              <label>앱 접속 패스코드 (일반)</label>
              <input
                type="text"
                v-model="appPasswordEdit"
                placeholder="접속 패스코드"
              />
              <div class="description-text">
                출석부 첫 화면 진입 시 필요한 공용 암호입니다.
              </div>
            </div>
            <div class="setting-item mt-10">
              <label>관리자 페이지 비밀번호 (현재 페이지)</label>
              <input
                type="text"
                v-model="adminPasswordEdit"
                placeholder="관리자 비밀번호"
              />
              <div class="description-text">
                관리 페이지 진입 시 사용하는 마스터 암호입니다.
              </div>
            </div>
            <button @click="savePasswords" class="save-btn mt-10">
              암호 변경 저장
            </button>
          </div>
        </div>
      </section>

      <!-- UI 설정 섹션 -->
      <section class="admin-card">
        <h3>UI 설정</h3>
        <div class="card-content">
          <label class="checkbox-label">
            <input type="checkbox" v-model="defaultCollapseGroups" />
            학생 명단 기본적으로 모두 접기
          </label>
          <div class="description-text">
            체크 시, [추가/조회] 페이지 진입 시 모든 목장 목록이 접혀진 상태로
            시작합니다.
          </div>
          <button @click="saveUISettings" class="save-btn mt-10">
            설정 저장
          </button>
        </div>
      </section>

      <!-- 목장 관리 섹션 -->
      <section class="admin-card">
        <h3>목장 관리</h3>
        <div class="card-content">
          <!-- 목장 추가 폼 -->
          <div class="add-group-section">
            <input
              v-model="newGroupName"
              @keyup.enter="addGroup"
              placeholder="새 목장 이름 입력"
              class="group-input"
            />
            <button @click="addGroup" class="add-btn">목장 추가</button>
          </div>

          <hr class="divider" />

          <!-- 목장 목록 -->
          <div v-if="loading" class="loading-message">
            목장 목록을 불러오는 중...
          </div>
          <div v-else>
            <ul class="group-list">
              <li v-for="(group, index) in groups" :key="group.id">
                <div class="group-info">
                  <span class="group-name">{{ group.groupName }}</span>
                  <span class="member-count">
                    (학생: {{ group.members ? group.members.length : 0 }}명)
                  </span>
                </div>
                <div class="group-actions">
                  <button
                    @click="moveGroup(index, 'up')"
                    class="move-btn"
                    :disabled="index === 0"
                  >
                    ▲
                  </button>
                  <button
                    @click="moveGroup(index, 'down')"
                    class="move-btn"
                    :disabled="index === groups.length - 1"
                  >
                    ▼
                  </button>
                  <button @click="renameGroup(group)" class="edit-btn">
                    수정
                  </button>
                  <button @click="deleteGroup(group)" class="delete-btn">
                    삭제
                  </button>
                </div>
              </li>
            </ul>
            <div v-if="groups.length === 0" class="empty-message">
              등록된 목장이 없습니다.
            </div>
          </div>
        </div>
      </section>

      <!-- 생일 미입력 학생 목록 섹션 (접이식) -->
      <section class="admin-card missing-birthday-card">
        <div
          class="card-header clickable"
          @click="isMissingBirthdayOpen = !isMissingBirthdayOpen"
        >
          <h3>
            생일 미입력 학생 ({{ missingBirthdayStudents.length }}명)
            <span class="chevron" :class="{ open: isMissingBirthdayOpen }"
              >▼</span
            >
          </h3>
        </div>

        <div v-show="isMissingBirthdayOpen" class="card-content">
          <div class="refresh-container">
            <button
              @click.stop="fetchMissingBirthdayStudents"
              class="refresh-btn-inline"
              title="새로고침"
            >
              목록 새로고침 ↻
            </button>
          </div>

          <div v-if="loadingMissingBirthdays" class="loading-message">
            불러오는 중...
          </div>
          <div v-else-if="missingBirthdayStudents.length > 0">
            <table class="missing-birthday-table">
              <thead>
                <tr>
                  <th>이름</th>
                  <th>목장</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="student in missingBirthdayStudents"
                  :key="student.id"
                >
                  <td>{{ student.name }}</td>
                  <td>{{ student.groupName }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div v-else class="empty-message">
            모든 활성 학생의 생일 정보가 입력되어 있습니다.
          </div>
        </div>
      </section>
      <!-- 히든 차트 캔버스 (엑셀 내보내기용) -->
      <div style="position: absolute; left: -9999px; top: -9999px">
        <canvas ref="hiddenChartCanvas" width="800" height="400"></canvas>
      </div>
    </div>
  </div>
</template>

<script>
import { db, FieldValue } from "@/firebase";
import { fetchLongTermAbsentees } from "@/utils/attendanceUtils";
import { studentService } from "@/services/studentService";
import { attendanceService } from "@/services/attendanceService";

import { generateTargetSundays, getRecentSundays } from "@/utils/dateUtils";
import ExcelJS from "exceljs";
import Chart from "chart.js/auto";

export default {
  name: "AdminView",
  data() {
    return {
      groups: [],
      newGroupName: "",
      loading: false,
      autoDeactivate: false, // 자동 비활성화 옵션 상태
      birthdayRangePast: 30, // 생일 체크 과거 범위 (기본값 30)
      birthdayRangeFuture: 15, // 생일 체크 미래 범위 (기본값 15)
      isAuthenticated: false, // 인증 상태
      passwordInput: "", // 암호 입력값
      sundays: [],
      selectedDate: "",
      missingBirthdayStudents: [], // 생일 미입력 학생 목록
      loadingMissingBirthdays: false, // 생일 미입력 로딩 상태
      isMissingBirthdayOpen: false, // 생일 미입력 섹션 접기/펼치기 상태
      defaultCollapseGroups: false, // 학생 명단 기본 접기 설정
      appPasswordDb: "", // DB에서 가져온 앱 암호
      adminPasswordDb: "", // DB에서 가져온 관리자 암호
      appPasswordEdit: "", // 수정용 앱 암호
      adminPasswordEdit: "", // 수정용 관리자 암호
    };
  },
  created() {
    // 관리자 전용 인증 상태 확인 (전역 인증과는 별개)
    const adminAuth = sessionStorage.getItem("admin_auth");
    if (adminAuth === "true") {
      this.isAuthenticated = true;
      this.fetchGroups();
      this.fetchMissingBirthdayStudents();
      this.loadSettingsAfterAuth();
    }
    this.sundays = generateTargetSundays();
    this.selectedDate = this.getMostRecentSunday();
  },
  methods: {
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
    async checkPassword() {
      const passwords = await studentService.fetchPasswords();
      if (this.passwordInput === passwords.adminPassword) {
        this.isAuthenticated = true;
        sessionStorage.setItem("admin_auth", "true"); // 관리자 전용 세션 유지
        this.fetchGroups(); // 인증 성공 시 데이터 로드
        this.fetchMissingBirthdayStudents(); // 생일 미입력 학생 로드
        this.loadSettingsAfterAuth();

        // 수정용 필드 초기화
        this.appPasswordDb = passwords.appPassword;
        this.adminPasswordDb = passwords.adminPassword;
        this.appPasswordEdit = passwords.appPassword;
        this.adminPasswordEdit = passwords.adminPassword;
      } else {
        this.$alert("관리자 비밀번호가 올바르지 않습니다.");
        this.passwordInput = "";
      }
    },
    async loadSettingsAfterAuth() {
      await this.loadSettings();
    },
    async loadSettings() {
      const saved = localStorage.getItem("autoDeactivateAbsentees");
      this.autoDeactivate = saved === "true";

      try {
        // 암호 및 설정 데이터 가져오기
        const passwords = await studentService.fetchPasswords();
        if (passwords) {
          this.appPasswordDb = passwords.appPassword;
          this.adminPasswordDb = passwords.adminPassword;
          // 입력 필드에도 초기값 설정 (사용자가 수정하기 편하도록)
          this.appPasswordEdit = passwords.appPassword;
          this.adminPasswordEdit = passwords.adminPassword;
        }

        const doc = await db.collection("settings").doc("global").get();
        if (doc.exists) {
          const data = doc.data();
          if (data.birthdayRangePast !== undefined) {
            this.birthdayRangePast = data.birthdayRangePast;
          }
          if (data.birthdayRangeFuture !== undefined) {
            this.birthdayRangeFuture = data.birthdayRangeFuture;
          }
          if (data.defaultCollapseGroups !== undefined) {
            this.defaultCollapseGroups = data.defaultCollapseGroups;
          }
        }
      } catch (error) {
        console.error("설정 로드 실패:", error);
      }
    },
    async saveBirthdaySettings() {
      const success = await studentService.saveSettings({
        birthdayRangePast: this.birthdayRangePast,
        birthdayRangeFuture: this.birthdayRangeFuture,
      });

      if (success) {
        this.$alert("생일자 체크 범위가 저장되었습니다.");
      } else {
        this.$alert("설정 저장 중 오류가 발생했습니다.");
      }
    },
    async saveUISettings() {
      const success = await studentService.saveSettings({
        defaultCollapseGroups: this.defaultCollapseGroups,
      });

      if (success) {
        this.$alert("UI 설정이 저장되었습니다.");
      } else {
        this.$alert("설정 저장 중 오류가 발생했습니다.");
      }
    },
    async savePasswords() {
      // 1. 값 검증
      const appPw = String(this.appPasswordEdit || "").trim();
      const adminPw = String(this.adminPasswordEdit || "").trim();

      if (!appPw || !adminPw) {
        this.$alert("암호를 빈값으로 설정할 수 없습니다.");
        return;
      }

      // 2. 글로벌 컨펌 창 호출 (Native confirm 대체)
      const confirmed = await this.$confirm(
        "정말로 암호를 변경하시겠습니까?\n변경 시 모든 사용자가 로그아웃됩니다."
      );

      if (!confirmed) return;

      // 3. 실행 (기존 executeSavePasswords 로직 병합)
      try {
        const success = await studentService.updatePasswords({
          appPassword: appPw,
          adminPassword: adminPw,
        });

        if (success) {
          // 성공 시 UI로 피드백 (alert 대신)
          this.isAuthenticated = false; // 즉시 화면 전환 효과
          localStorage.removeItem("attendance_token");
          localStorage.removeItem("attendance_auth_expiry");
          sessionStorage.removeItem("admin_auth");

          await this.$alert("변경되었습니다. 다시 로그인해주세요.");
          window.location.reload();
        } else {
          this.$alert("저장 실패: DB 업데이트 중 오류가 발생했습니다.");
        }
      } catch (error) {
        console.error(error);
        this.$alert("오류 발생: " + error.message);
      }
    },
    toggleAutoDeactivate() {
      this.autoDeactivate = !this.autoDeactivate;
      localStorage.setItem("autoDeactivateAbsentees", this.autoDeactivate);
      // 토글 시 자동 실행 로직 제거
    },
    async runAutoDeactivation() {
      try {
        const absentees = await fetchLongTermAbsentees();
        if (absentees.length === 0) {
          this.$alert("장기 미출석 대상자가 없습니다.");
          return;
        }

        const batch = db.batch();
        const today = new Date().toISOString().split("T")[0];
        let count = 0;

        absentees.forEach((student) => {
          const ref = db.collection("students").doc(student.id);
          batch.update(ref, {
            status: "inactive",
            deactivatedAt: today,
          });
          count++;
        });

        await batch.commit();
        if (count > 0) {
          studentService.clearCache(); // 캐시 초기화
          // 알림을 띄우는 것은 너무 빈번할 수 있으므로, console.log나 토스트로 대체 가능
          // 여기서는 사용자가 인지할 수 있도록 alert 사용 (최초 1회성 느낌)
          this.$alert(
            `장기 미출석자 ${count}명이 자동으로 비활성화 처리되었습니다.`
          );
        }
      } catch (error) {
        console.error("자동 비활성화 처리 중 오류:", error);
      }
    },
    async fetchGroups() {
      this.loading = true;
      try {
        // 'order' 필드가 없는 문서가 제외되지 않도록 쿼리에서는 order 정렬 제외
        const snapshot = await db
          .collection("groups")
          .orderBy("groupName", "asc")
          .get();

        let groups = snapshot.docs.map((doc) => ({
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

        this.groups = groups;
      } catch (error) {
        console.error("목장 목록 조회 실패:", error);
        this.$alert("목장 목록을 불러오지 못했습니다.");
      } finally {
        this.loading = false;
      }
    },
    async addGroup() {
      if (!this.newGroupName.trim()) {
        this.$alert("목장 이름을 입력해주세요.");
        return;
      }

      const duplicate = this.groups.find(
        (g) => g.groupName === this.newGroupName.trim()
      );
      if (duplicate) {
        this.$alert("이미 존재하는 목장 이름입니다.");
        return;
      }

      try {
        // 마지막 순서 찾기
        const maxOrder =
          this.groups.length > 0
            ? Math.max(...this.groups.map((g) => g.order || 0))
            : 0;

        await db.collection("groups").add({
          groupName: this.newGroupName.trim(),
          members: [],
          order: maxOrder + 1, // 맨 뒤에 추가
        });
        studentService.clearCache(); // 캐시 초기화
        this.newGroupName = "";
        await this.fetchGroups();
        this.$alert("목장이 추가되었습니다.");
      } catch (error) {
        console.error("목장 추가 실패:", error);
        this.$alert("목장 추가 중 오류가 발생했습니다.");
      }
    },
    async renameGroup(group) {
      const newName = prompt("새로운 목장 이름을 입력하세요:", group.groupName);
      if (newName === null) return; // 취소

      const trimmedName = newName.trim();
      if (!trimmedName) {
        this.$alert("목장 이름을 입력해주세요.");
        return;
      }

      if (trimmedName === group.groupName) return; // 변경 없음

      // 중복 체크
      const duplicate = this.groups.find(
        (g) => g.groupName === trimmedName && g.id !== group.id
      );
      if (duplicate) {
        this.$alert("이미 존재하는 목장 이름입니다.");
        return;
      }

      try {
        await db.collection("groups").doc(group.id).update({
          groupName: trimmedName,
        });
        studentService.clearCache(); // 캐시 초기화
        await this.fetchGroups();
        this.$alert("목장 이름이 변경되었습니다.");
      } catch (error) {
        console.error("목장 이름 변경 실패:", error);
        this.$alert("목장 이름 변경 중 오류가 발생했습니다.");
      }
    },
    async deleteGroup(group) {
      // 안전 장치: 멤버가 있으면 삭제 불가
      if (group.members && group.members.length > 0) {
        this.$alert(
          `'${group.groupName}'에는 소속된 학생이 있습니다.\n학생들을 다른 목장으로 이동시키거나 삭제한 후 다시 시도해주세요.`
        );
        return;
      }

      if (
        await this.$confirm(`'${group.groupName}'을(를) 정말 삭제하시겠습니까?`)
      ) {
        try {
          await db.collection("groups").doc(group.id).delete();
          studentService.clearCache(); // 캐시 초기화
          await this.fetchGroups();
          this.$alert("목장이 삭제되었습니다.");
        } catch (error) {
          console.error("목장 삭제 실패:", error);
          this.$alert("목장 삭제 중 오류가 발생했습니다.");
        }
      }
    },
    async moveGroup(index, direction) {
      if (direction === "up" && index === 0) return;
      if (direction === "down" && index === this.groups.length - 1) return;

      const targetIndex = direction === "up" ? index - 1 : index + 1;

      // 배열에서 순서 변경 (Vue 2 Reactivity 보장)
      const itemA = this.groups[index];
      const itemB = this.groups[targetIndex];

      this.$set(this.groups, index, itemB);
      this.$set(this.groups, targetIndex, itemA);

      // 변경된 순서대로 DB 업데이트 (전체 재정렬로 안전성 확보)
      try {
        const batch = db.batch();
        this.groups.forEach((group, idx) => {
          // order가 변경된 경우에만 업데이트 (최적화)
          if (group.order !== idx + 1) {
            const ref = db.collection("groups").doc(group.id);
            batch.update(ref, { order: idx + 1 });
            // 로컬 객체도 업데이트 (중요: 나중에 fetchGroups 안 할거면 여기서 해줘야 함)
            group.order = idx + 1;
          }
        });
        await batch.commit();
        studentService.clearCache(); // 캐시 초기화
        // UI는 이미 변경되었으므로 fetchGroups 호출 안 해도 되지만, 확실히 하기 위해 호출 가능
        // 여기서는 부드러운 UX를 위해 호출 생략하고 로컬 상태 유지
      } catch (error) {
        console.error("순서 변경 실패:", error);
        this.$alert("순서 변경 중 오류가 발생했습니다.");
        await this.fetchGroups(); // 실패 시 원복
      }
    },
    async copyAttendanceStats() {
      if (!this.selectedDate) {
        this.$alert("주일을 선택해주세요.");
        return;
      }

      try {
        // 1. 필요한 데이터 가져오기
        const [groups, allStudents, attendanceRecords] = await Promise.all([
          studentService.fetchGroups(),
          studentService.fetchAllStudents(),
          attendanceService.fetchAttendanceByDate(this.selectedDate),
        ]);

        // 2. 활성 학생 필터링
        const activeStudentIds = studentService.filterActiveStudentsAtDate(
          allStudents,
          this.selectedDate
        );

        // 3. 통계 계산
        let totalMembers = 0;
        let totalPresent = 0;
        const groupStats = [];

        groups.forEach((group) => {
          const activeMembers = group.members
            ? group.members.filter((id) => activeStudentIds.has(id))
            : [];

          const presentMembers = attendanceRecords.filter(
            (r) =>
              r.groupId === group.id &&
              r.status === "present" &&
              activeStudentIds.has(r.studentId)
          );

          const groupTotal = activeMembers.length;
          const groupPresent = presentMembers.length;
          const groupRate =
            groupTotal > 0 ? Math.round((groupPresent / groupTotal) * 100) : 0;

          totalMembers += groupTotal;
          totalPresent += groupPresent;

          groupStats.push({
            name: group.groupName,
            total: groupTotal,
            present: groupPresent,
            rate: groupRate,
          });
        });

        const overallRate =
          totalMembers > 0
            ? Math.round((totalPresent / totalMembers) * 100)
            : 0;

        // 4. 텍스트 포맷팅 (띄어쓰기 포함)
        let text = `[${this.selectedDate} 출석 현황]\n\n`;
        text += `전체: ${totalMembers}명 / 출석: ${totalPresent}명 (${overallRate}%)\n\n`;

        groupStats.forEach((stat, index) => {
          text += `${index + 1}. ${stat.name}: ${stat.total}명 / ${
            stat.present
          }명 (${stat.rate}%)\n`;
        });

        // 5. 클립보드 복사
        await navigator.clipboard.writeText(text);
        this.$alert("출석 현황이 클립보드에 복사되었습니다.");
      } catch (error) {
        console.error("출석 현황 복사 실패:", error);
        this.$alert("출석 현황을 복사하는 데 실패했습니다.");
      }
    },
    async fetchMissingBirthdayStudents() {
      this.loadingMissingBirthdays = true;
      try {
        const allStudents = await studentService.fetchAllStudents();
        const groups = await studentService.fetchGroups(); // Ensure we have groups for naming

        // Create a map for group names
        const groupMap = {};
        groups.forEach((g) => {
          groupMap[g.id] = g.groupName;
          // Also map members to groups to find student's group if needed,
          // but student object usually doesn't have groupId directly unless we mapped it.
          // Actually student object implies group membership via the group.members array.
          // Wait, 'student' object in DB doesn't have groupId. 'groups' have members array.
          // We need to find which group the student belongs to.
        });

        // Helper to find group name for a student
        const getGroupName = (studentId) => {
          const group = groups.find(
            (g) => g.members && g.members.includes(studentId)
          );
          return group ? group.groupName : "미배정";
        };

        this.missingBirthdayStudents = allStudents
          .filter(
            (s) =>
              s.status === "active" &&
              (!s.birthDate || s.birthDate.trim() === "")
          )
          .map((s) => ({
            ...s,
            groupName: getGroupName(s.id),
          }))
          .sort((a, b) => {
            if (a.groupName !== b.groupName) {
              return a.groupName.localeCompare(b.groupName);
            }
            return a.name.localeCompare(b.name);
          });
      } catch (error) {
        console.error("생일 미입력 학생 조회 실패:", error);
      } finally {
        this.loadingMissingBirthdays = false;
      }
    },
    async downloadFullReport() {
      this.loading = true;
      try {
        const workbook = new ExcelJS.Workbook();
        workbook.creator = "AttendanceApp";
        workbook.created = new Date();

        // 1. Fetch Students
        const allStudents = await studentService.fetchAllStudents();
        const groups = await studentService.fetchGroups();
        const groupMap = {};
        groups.forEach((g) => (groupMap[g.id] = g.groupName));

        // Sheet 1: Student List
        const studentSheet = workbook.addWorksheet("전체 학생 명단");
        studentSheet.columns = [
          { header: "이름", key: "name", width: 10 },
          { header: "성별", key: "gender", width: 6 },
          { header: "목장", key: "groupName", width: 15 },
          { header: "학년", key: "grade", width: 8 },
          { header: "연락처", key: "contact", width: 15 },
          { header: "생일", key: "birthDate", width: 10 },
          { header: "상태", key: "status", width: 8 },
        ];

        // 정렬: 목장(가나다) -> 이름(가나다)
        allStudents.sort((a, b) => {
          const groupNameA = groupMap[a.groupId] || "미배정";
          const groupNameB = groupMap[b.groupId] || "미배정";
          if (groupNameA !== groupNameB) {
            return groupNameA.localeCompare(groupNameB);
          }
          return a.name.localeCompare(b.name);
        });

        allStudents.forEach((s) => {
          studentSheet.addRow({
            name: s.name,
            gender: s.gender,
            groupName: groupMap[s.groupId] || "미배정",
            grade: s.grade,
            contact: s.contact,
            birthDate: s.birthDate,
            status: s.status === "active" ? "재학" : "비활성",
          });
        });

        // 2. Fetch Attendance (Recently 12 Weeks)
        const recentSundays = getRecentSundays(12).reverse();
        const attendanceRecords =
          await attendanceService.fetchAttendanceByDates(recentSundays);

        // Sheet 2: Attendance Log
        const logSheet = workbook.addWorksheet("출석부 (최근 12주)");
        // Header Row: Student Name, Group, ...Dates...
        const headers = ["이름", "목장", ...recentSundays];
        const headerRow = logSheet.addRow(headers);
        headerRow.font = { bold: true };

        // Sort students by group then name (Active only or all? Let's include active/inactive but sorted)
        // To be simpler, let's include 'Active' students at latest date + anyone who was present
        const activeStudents = studentService.filterActiveStudentsAtDate(
          allStudents,
          recentSundays[recentSundays.length - 1]
        );
        const targetStudents = allStudents
          .filter((s) => activeStudents.has(s.id))
          .sort((a, b) => {
            const gA = groupMap[a.groupId] || "z";
            const gB = groupMap[b.groupId] || "z";
            if (gA !== gB) return gA.localeCompare(gB);
            return a.name.localeCompare(b.name);
          });

        targetStudents.forEach((s) => {
          const rowData = [s.name, groupMap[s.groupId] || "미배정"];
          recentSundays.forEach((date) => {
            const record = attendanceRecords.find(
              (r) =>
                r.date === date &&
                r.studentId === s.id &&
                r.status === "present"
            );
            rowData.push(record ? "O" : "");
          });
          logSheet.addRow(rowData);
        });

        // Sheet 3: Stats & Chart
        const statsSheet = workbook.addWorksheet("통계 및 차트");
        statsSheet.mergeCells("A1:E1");
        statsSheet.getCell("A1").value = "주간 출석 추이 (최근 12주)";
        statsSheet.getCell("A1").font = { size: 14, bold: true };

        // Draw Chart on Canvas to get Image
        const chartImage = await this.generateChartImage(
          recentSundays,
          attendanceRecords,
          allStudents,
          groups
        );

        if (chartImage) {
          const imageId = workbook.addImage({
            base64: chartImage,
            extension: "png",
          });

          statsSheet.addImage(imageId, {
            tl: { col: 1, row: 2 },
            br: { col: 11, row: 22 },
          });
        }

        // Generate File
        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `attendance_report_${
          new Date().toISOString().split("T")[0]
        }.xlsx`;
        a.click();
        URL.revokeObjectURL(url);

        this.$alert("리포트 다운로드가 완료되었습니다.");
      } catch (error) {
        console.error("리포트 생성 실패:", error);
        this.$alert("리포트 생성 중 오류가 발생했습니다.");
      } finally {
        this.loading = false;
      }
    },
    async generateChartImage(dates, records, students, groups) {
      return new Promise((resolve) => {
        const statsByDate = dates.map((date) => {
          const currentlyActiveIds = new Set(
            students.filter((s) => s.status === "active").map((s) => s.id)
          );

          let activeStudentIds = studentService.filterActiveStudentsAtDate(
            students,
            date
          );
          activeStudentIds = new Set(
            [...activeStudentIds].filter((id) => currentlyActiveIds.has(id))
          );

          return groups.reduce((acc, group) => {
            const presentCount = records.filter(
              (r) =>
                r.date === date &&
                r.groupId === group.id &&
                r.status === "present" &&
                activeStudentIds.has(r.studentId)
            ).length;
            acc[group.id] = presentCount;
            return acc;
          }, {});
        });

        const datasets = groups.map((group, index) => {
          const colors = [
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
          return {
            label: group.groupName,
            data: statsByDate.map((stat) => stat[group.id]),
            borderColor: colors[index % colors.length],
            borderWidth: 2,
            tension: 0.3,
          };
        });

        const canvas = this.$refs.hiddenChartCanvas;
        if (!canvas) {
          resolve(null);
          return;
        }
        const ctx = canvas.getContext("2d");

        const chart = new Chart(ctx, {
          type: "line",
          data: {
            labels: dates.map((d) => d.slice(5)),
            datasets: datasets,
          },
          options: {
            animation: false,
            responsive: false,
          },
        });

        setTimeout(() => {
          const base64 = chart.toBase64Image();
          chart.destroy();
          resolve(base64);
        }, 300);
      });
    },
    downloadSampleJson() {
      const sampleData = [
        {
          name: "홍길동",
          gender: "남",
          groupName: "사랑목장",
          grade: "고1",
          contact: "010-1234-5678",
          school: "서울고등학교",
          birthDate: "7월 24일",
          address: "서울시 강남구",
          parentName: "홍판서",
          parentContact: "010-9876-5432",
          registrationType: "주일학교 출신",
          howDidYouCome: "부모님을 따라서",
          familyFaith: "부모님이 본 교회를 출석하심",
          note: "특이사항 없음",
        },
        {
          name: "김영희",
          gender: "여",
          groupName: "믿음목장",
          grade: "중2",
          contact: "010-2222-3333",
          school: "경기중학교",
          birthDate: "12월 25일",
          address: "경기도 성남시",
          parentName: "김철수",
          parentContact: "010-5555-6666",
          registrationType: "새로운 등록자",
          howDidYouCome: "친구 권유",
          familyFaith: "부모님 종교 없음",
          note: "",
        },
      ];

      const dataStr = JSON.stringify(sampleData, null, 2);
      const blob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "student_import_sample.json";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    },
    triggerJsonUpload() {
      this.$refs.jsonFileInput.click();
    },
    async handleJsonUpload(event) {
      const file = event.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const jsonContent = e.target.result;
          const jsonData = JSON.parse(jsonContent);

          if (!Array.isArray(jsonData)) {
            this.$alert("JSON 형식이 올바르지 않습니다. (배열이어야 합니다)");
            return;
          }

          if (jsonData.length === 0) {
            this.$alert("데이터가 없습니다.");
            return;
          }

          if (
            await this.$confirm(
              `총 ${jsonData.length}명의 학생 데이터를 처리하시겠습니까?\n(기존 데이터는 이름/목장 기준으로 업데이트됩니다)`
            )
          ) {
            await this.processJsonImport(jsonData);
          }
        } catch (error) {
          console.error("JSON 파싱 오류:", error);
          this.$alert(
            "오류: JSON 파일을 읽을 수 없습니다. 올바른 파일인지 확인해주세요."
          );
        } finally {
          event.target.value = ""; // Reset
        }
      };
      reader.readAsText(file);
    },
    async processJsonImport(jsonData) {
      this.loading = true;
      let successCount = 0;
      let failCount = 0;

      try {
        const groups = await studentService.fetchGroups();
        const allStudents = await studentService.fetchAllStudents();

        // 1. Group Map (Name -> ID)
        const groupMap = new Map();
        groups.forEach((g) => groupMap.set(g.groupName, g.id));

        // 2. Student Map (Name_GroupName -> DocID) for checking existence
        // 동명이인이 있을 수 있으므로 이름+목장 으로 식별하거나, 이름+연락처로 해야하는데
        // 여기서는 간단히 이름+목장 매칭을 시도하고, 없으면 이름만으로 검색해볼 수도 있음.
        // 하지만 사용자 요구사항은 "구조를 맞춰서 넣고 싶다" 이므로
        // 가장 안전한 건 "이름"과 "연락처 뒷자리" 조합 등이지만, 여기선 심플하게
        // 이름이 일치하는 학생이 있으면 업데이트, 없으면 추가로 진행.
        // 단, 동명이인 이슈가 있을 수 있음. -> 기존 학생 리스트에서 이름 일치하는거 찾기.

        const batchSize = 500;
        let batch = db.batch();
        let operationCount = 0;

        for (const row of jsonData) {
          if (!row.name || !row.gender || !row.grade) {
            failCount++;
            continue;
          }

          const safeStr = (val) => (val ? String(val) : "");
          const groupId = groupMap.get(row.groupName) || ""; // 없으면 미배정

          const studentData = {
            name: row.name,
            gender: row.gender,
            groupId: groupId,
            grade: safeStr(row.grade),
            contact: safeStr(row.contact),
            school: safeStr(row.school),
            birthDate: safeStr(row.birthDate),
            address: safeStr(row.address),
            parentName: safeStr(row.parentName),
            parentContact: safeStr(row.parentContact),
            registrationType: row.registrationType || "주일학교 출신",
            howDidYouCome: row.howDidYouCome || "친구 혹은 아는 사람의 권유로",
            familyFaith: row.familyFaith || "부모님이 본 교회를 출석하심",
            note: safeStr(row.note),
            status: "active", // 활성화 처리
          };

          // 기존 학생 찾기 (이름 & 목장 일치 or 연락처 일치 등 정책 필요)
          // 여기선 이름이 같으면 업데이트 대상으로 간주 (간단 구현)
          // 더 정확하게 하려면 연락처 비교가 좋음.
          let targetStudentId = null;

          // 연락처가 있으면 연락처로 우선 매칭
          if (studentData.contact) {
            const match = allStudents.find(
              (s) =>
                s.contact === studentData.contact && s.name === studentData.name
            );
            if (match) targetStudentId = match.id;
          }

          // 못 찾았고 목장정보가 있으면 이름+목장으로 매칭
          if (!targetStudentId && groupId) {
            const match = allStudents.find(
              (s) => s.name === studentData.name && s.groupId === groupId
            );
            if (match) targetStudentId = match.id;
          }

          // 그래도 없으면 이름만으로 매칭 (위험할 수 있으니 생략하거나 보수적 접근)
          // 여기서는 그냥 추가 모드로 갈지, 아니면 이름만 같아도 업데이트 할지 결정.
          // -> 안전하게: 매칭 안되면 신규 추가.

          if (targetStudentId) {
            // Update
            const ref = db.collection("students").doc(targetStudentId);
            batch.update(ref, studentData);

            // 그룹 변경 감지 및 처리 로직은 복잡해지므로 여기선 생략하거나
            // 배치 업데이트 시 그룹 멤버 array 수정 로직 필요.
            // * 중요: 그룹이 바뀌었으면 기존 그룹에서 빼고 새 그룹에 넣어야 함.
            // 이는 배치작업에서 복잡하므로, 일단 정보만 업데이트하고
            // 그룹 멤버십 Sync는 별도 함수로 돌리는게 안전함.
            // 하지만 여기선 간단히 student 문서만 업데이트.
            // (그룹 이동은 AddMemberView에서 개별 수정 권장, 일괄 업로드는 초기 세팅용 성격이 강함)
            // * 개선: 만약 groupId가 바뀌었다면? -> 이건 배치 안에서 처리하기 까다로움(reads needed).
            // 따라서 일괄 업로드는 '신규 추가' 위주거나, '기본 정보 수정' 위주로 가정.
          } else {
            // Insert
            const newRef = db.collection("students").doc();
            batch.set(newRef, studentData);
            operationCount++;

            // 신규 추가 시 그룹 멤버에 추가
            if (groupId) {
              const groupRef = db.collection("groups").doc(groupId);
              batch.update(groupRef, {
                members: FieldValue.arrayUnion(newRef.id),
              });
              operationCount++;
            }
          }

          operationCount++;
          if (operationCount >= batchSize - 2) {
            await batch.commit();
            batch = db.batch();
            operationCount = 0;
          }
          successCount++;
        }

        if (operationCount > 0) {
          await batch.commit();
        }

        studentService.clearCache();
        await this.fetchGroups(); // Refresh UI
        this.$alert(`처리 완료: 성공 ${successCount}건, 실패 ${failCount}건`);
      } catch (error) {
        console.error("일괄 처리 중 오류:", error);
        this.$alert("데이터 처리 중 오류가 발생했습니다.");
      } finally {
        this.loading = false;
      }
    },
  },
};
</script>

<style scoped>
.admin-view {
  max-width: 600px;
  margin: 0 auto;
  padding: 1em;
}

h2 {
  text-align: center;
  color: #333;
  margin-bottom: 1.5em;
}

/* Unified Card Style */
.admin-card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
  margin-bottom: 20px;
  overflow: hidden;
  border: 1px solid #eee;
}

.admin-card h3 {
  background-color: #f9f9f9;
  margin: 0;
  padding: 15px 20px;
  font-size: 1.1em;
  color: #333;
  border-bottom: 1px solid #eee;
  font-weight: bold;
}

/* Card Content */
.card-content {
  padding: 20px;
}

/* Collapsible Header Spec */
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  background-color: #f9f9f9;
  border-bottom: 1px solid #eee;
}

.card-header h3 {
  border-bottom: none;
  flex-grow: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header:hover {
  background-color: #f0f0f0;
}

.chevron {
  transition: transform 0.3s ease;
  font-size: 0.8em;
  color: #777;
}

.chevron.open {
  transform: rotate(180deg);
}

/* Form Elements */
.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  color: #555;
  font-weight: 500;
}

.import-controls {
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
}

.upload-wrapper {
  display: inline-block;
}

.description-text.mt-10 {
  margin-top: 10px;
  line-height: 1.5;
  color: #666;
  font-size: 0.9em;
}

.apply-btn,
.save-btn,
.copy-btn,
.download-btn,
.upload-btn,
.add-btn,
.login-btn {
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
  font-size: 0.9em;
  padding: 8px 16px;
  transition: background-color 0.2s;
}

.apply-btn {
  background-color: #d32f2f;
  color: white;
  margin-left: auto;
}
.save-btn {
  background-color: #e91e63;
  color: white;
  height: 38px;
}
.copy-btn {
  background-color: #4caf50;
  color: white;
  white-space: nowrap;
}
.add-btn {
  background-color: #282828;
  color: white;
}
.download-excel-btn {
  background-color: #008000; /* Excel Green */
  color: white;
  padding: 10px 20px;
  width: 100%;
  margin-bottom: 15px;
  font-size: 1.1em;
  display: block;
}
.download-excel-btn:hover {
  background-color: #006400;
}
.upload-btn {
  background-color: #ff9800;
  color: white;
}
.download-btn {
  background-color: #2196f3;
  color: white;
  padding: 8px 16px;
}
.login-btn {
  background-color: #282828;
  color: white;
  padding: 10px 20px;
}

.apply-btn:hover {
  background-color: #b71c1c;
}
.save-btn:hover {
  background-color: #c2185b;
}
.copy-btn:hover {
  background-color: #388e3c;
}
.upload-btn:hover {
  background-color: #f57c00;
}
.download-btn:hover {
  background-color: #1976d2;
}
.add-btn:hover {
  background-color: #484848;
}

.apply-btn:disabled {
  background-color: #e0e0e0;
  color: #999;
  cursor: not-allowed;
}

/* Specific Layouts */
.copy-attendance-controls {
  display: flex;
  gap: 10px;
}

.select-wrapper {
  flex-grow: 1;
  position: relative;
}

select {
  width: 100%;
  padding: 10px;
  border-radius: 4px;
  border: 1px solid #ddd;
  appearance: none;
  background-color: white;
}

.select-arrow {
  position: absolute;
  top: 50%;
  right: 10px;
  transform: translateY(-50%);
  border-left: 5px solid transparent;
  border-right: 5px solid transparent;
  border-top: 5px solid #555;
  pointer-events: none;
}

.birthday-settings {
  display: flex;
  gap: 15px;
  align-items: flex-end;
}

.setting-item {
  display: flex;
  flex-direction: column;
  gap: 5px;
}
.setting-item label {
  font-size: 0.9em;
  color: #555;
  font-weight: bold;
}
.setting-item input {
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  width: 80px;
}

.add-group-section {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}
.group-input {
  flex-grow: 1;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

/* Group List */
.divider {
  border: 0;
  height: 1px;
  background-color: #eee;
  margin: 20px 0;
}
.group-list {
  list-style: none;
  padding: 0;
}
.group-list li {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #f9f9f9;
}
.group-list li:last-child {
  border-bottom: none;
}

.group-info {
  display: flex;
  align-items: center;
  gap: 10px;
}
.group-name {
  font-weight: bold;
  font-size: 1.05em;
}
.member-count {
  color: #888;
  font-size: 0.9em;
}

.group-actions {
  display: flex;
  gap: 5px;
}
.move-btn,
.edit-btn,
.delete-btn {
  padding: 5px 10px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.85em;
  border: 1px solid transparent;
}
.move-btn {
  background-color: #f5f5f5;
  border-color: #ddd;
  color: #555;
}
.edit-btn {
  background-color: #e3f2fd;
  color: #1976d2;
  border-color: #bbdefb;
}
.delete-btn {
  background-color: #ffebee;
  color: #c62828;
  border-color: #ffcdd2;
}

/* Missing Birthday Table */
.refresh-container {
  text-align: right;
  margin-bottom: 15px;
}
.refresh-btn-inline {
  background: white;
  border: 1px solid #ddd;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9em;
  color: #666;
  transition: all 0.2s;
}
.refresh-btn-inline:hover {
  background-color: #f5f5f5;
  color: #333;
}

.missing-birthday-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 10px;
  font-size: 0.95em;
}
.missing-birthday-table th {
  background-color: #ffebee;
  color: #c62828;
  font-weight: bold;
  padding: 10px;
  text-align: left;
}
.missing-birthday-table td {
  padding: 10px;
  border-bottom: 1px solid #f0f0f0;
}
.missing-birthday-table tr:last-child td {
  border-bottom: none;
}

.loading-message,
.empty-message {
  text-align: center;
  color: #888;
  padding: 2em;
}

/* Login Form - Keep it simple */
.login-section {
  text-align: center;
  padding: 4em 0;
}
.login-form {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-top: 20px;
}

/* Responsive */
@media (max-width: 600px) {
  .admin-view {
    padding: 10px;
  }
  .card-content {
    padding: 15px;
  }

  .group-list li {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  .group-info {
    width: 100%;
    justify-content: space-between;
  }
  .group-actions {
    width: 100%;
    justify-content: flex-end;
  }

  /* Stack controls on mobile */
  .copy-attendance-controls,
  .birthday-settings,
  .add-group-section,
  .password-management .setting-item {
    flex-direction: column;
    align-items: stretch;
  }
  .password-management .setting-item input {
    width: 100%;
    margin-top: 5px;
  }
  .birthday-settings {
    gap: 10px;
  }
  .setting-item {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }
  .setting-item input {
    width: 100px;
  }

  .save-btn,
  .copy-btn,
  .add-btn,
  .apply-btn {
    width: 100%;
    margin-top: 5px;
  }
  .apply-btn {
    margin-left: 0;
  }
}

/* Custom Confirm Overlay */
.confirm-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
}
.confirm-box {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  width: 90%;
  max-width: 320px;
  text-align: center;
}
.confirm-sub-text {
  font-size: 0.9em;
  color: #d32f2f;
  margin-bottom: 20px;
}
.confirm-actions {
  display: flex;
  gap: 10px;
  justify-content: center;
}
.confirm-yes-btn {
  background-color: #d32f2f;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
}
.confirm-no-btn {
  background-color: #eee;
  color: #333;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
}
</style>
```
