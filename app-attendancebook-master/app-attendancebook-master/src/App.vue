<template>
  <div id="app">
    <template v-if="isAuthenticated">
      <nav id="nav">
        <a
          href="/guide.html"
          target="_blank"
          class="guide-link"
          title="가이드 보기"
        >
          <span class="guide-icon">?</span>
        </a>
        <router-link to="/attendance">출석</router-link>
        <router-link to="/status">현황</router-link>
        <router-link to="/add-member">추가/조회</router-link>
        <router-link to="/admin">관리</router-link>
      </nav>
      <main>
        <router-view />
      </main>
    </template>
    <PasswordGate v-else @authenticated="onAuthenticated" />
    <GlobalModal />
    <ToastNotification />
  </div>
</template>

<script>
import ToastNotification from "@/components/ToastNotification.vue";
import GlobalModal from "@/components/GlobalModal.vue";
import PasswordGate from "@/components/PasswordGate.vue";
import { studentService } from "@/services/studentService";

export default {
  components: {
    ToastNotification,
    GlobalModal,
    PasswordGate,
  },
  data() {
    return {
      isAuthenticated: false,
    };
  },
  created() {
    this.checkAuth();
  },
  methods: {
    async checkAuth() {
      const storedToken = localStorage.getItem("attendance_token"); // 저장된 암호
      const expiry = localStorage.getItem("attendance_auth_expiry");

      // 1차 검사: 토큰 존재 및 만료 기간 확인
      if (storedToken && expiry && Date.now() < parseInt(expiry)) {
        // 2차 검사: 실제 DB 암호와 일치하는지 확인 (비동기)
        try {
          const passwords = await studentService.fetchPasswords();
          if (passwords.appPassword === storedToken) {
            this.isAuthenticated = true;
          } else {
            // 암호가 변경됨 -> 강제 로그아웃
            this.logout();
          }
        } catch (e) {
          // DB 연결 실패 등의 경우, 일단 기존 토큰 믿고 진행하거나
          // 혹은 안전하게 로그아웃. 여기서는 사용자 경험상 일단 진입(오프라인 대응)하되
          // 보안이 최우선이면 로그아웃이 맞음. 현재는 로그아웃 처리.
          console.error("Auth verification failed", e);
          this.logout();
        }
      } else {
        this.logout();
      }
    },
    logout() {
      this.isAuthenticated = false;
      localStorage.removeItem("attendance_token");
      localStorage.removeItem("attendance_auth_expiry");
      // 관리자 세션도 같이 정리
      sessionStorage.removeItem("admin_auth");
    },
    onAuthenticated() {
      this.isAuthenticated = true;
    },
  },
};
</script>

<style>
/* 기본 스타일 */
:root {
  --primary-color: #282828;
  --secondary-color: #4caf50;
  --danger-color: #d32f2f;
  --warning-color: #ff9800;
  --accent-color: #e91e63;
  --accent-light: #f06292;
  --bg-color: #f4f4f4;
  --text-color: #333;
  --text-light: #888;
  --border-color: #ddd;
  --white: #ffffff;
}

body {
  font-family: "Open Sans", sans-serif;
  background-color: var(--bg-color);
  color: var(--text-color);
  margin: 0;
}
#app {
  padding-top: 60px;
}
main {
  padding: 2em;
}

/* 네비게이션 스타일 */
#nav {
  background-color: #282828;
  text-align: center;
  position: fixed;
  left: 0;
  top: 0;
  width: 100%;
  z-index: 1000;
  height: 60px;
  line-height: 60px;
}
#nav a {
  font-weight: bold;
  color: #fff;
  text-decoration: none;
  padding: 0 1.5em;
  transition: background-color 0.2s ease-in-out;
}
#nav a:hover {
  background-color: #383838;
}
#nav a.router-link-exact-active {
  background-color: #484848;
}

/* 도움말 아이콘 스타일 */
.guide-link {
  position: absolute !important; /* nav a 스타일 오버라이드 */
  left: 15px;
  top: 0;
  height: 60px;
  padding: 0 !important;
  display: flex !important;
  align-items: center;
  justify-content: center;
  background-color: transparent !important;
}
.guide-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background-color: rgba(255, 255, 255, 0.2);
  color: white;
  border-radius: 50%;
  font-weight: bold;
  font-size: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  transition: all 0.2s ease;
}
.guide-link:hover .guide-icon {
  background-color: white;
  color: #282828;
  transform: scale(1.1);
}
</style>
