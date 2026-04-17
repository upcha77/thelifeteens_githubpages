<template>
  <div class="password-gate">
    <div class="login-card">
      <div class="logo">
        <span class="logo-icon">🔒</span>
        <h1>출석부 접속 인증</h1>
      </div>
      <p class="description">
        교회 출석부 서비스 접근을 위해 암호를 입력해 주세요.
      </p>

      <div class="input-group">
        <input
          type="password"
          v-model="passwordInput"
          @keyup.enter="handleAuth"
          placeholder="암호를 입력하세요"
          class="password-input"
          ref="passInput"
        />
        <button @click="handleAuth" class="auth-btn">접속하기</button>
      </div>

      <p v-if="error" class="error-msg">{{ error }}</p>
    </div>
  </div>
</template>

<script>
import { studentService } from "@/services/studentService";

export default {
  name: "PasswordGate",
  data() {
    return {
      passwordInput: "",
      error: "",
      appPassword: null,
    };
  },
  async created() {
    // DB에서 접속 암호 미리 로드
    const passwords = await studentService.fetchPasswords();
    this.appPassword = passwords.appPassword;
  },
  mounted() {
    this.$refs.passInput.focus();
  },
  methods: {
    async handleAuth() {
      // DB 정보를 아직 못 불러왔을 경우를 위한 재시도 로직 포함
      if (!this.appPassword) {
        const passwords = await studentService.fetchPasswords();
        this.appPassword = passwords.appPassword;
      }

      if (this.passwordInput === this.appPassword) {
        this.error = "";
        // localStorage에 인증 토큰(현재 암호) 저장 (한 달 유지)
        const expiry = Date.now() + 30 * 24 * 60 * 60 * 1000;
        localStorage.setItem("attendance_token", this.passwordInput); // 암호 자체를 토큰으로 사용
        localStorage.setItem("attendance_auth_expiry", expiry.toString());
        this.$emit("authenticated");
      } else {
        this.error = "암호가 올바르지 않습니다. 다시 확인해 주세요.";
        this.passwordInput = "";
      }
    },
  },
};
</script>

<style scoped>
.password-gate {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: calc(100vh - 60px);
  padding: 20px;
  background-color: var(--bg-color);
}

.login-card {
  background: white;
  padding: 40px;
  border-radius: 16px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 400px;
  text-align: center;
}

.logo {
  margin-bottom: 24px;
}

.logo-icon {
  font-size: 48px;
  display: block;
  margin-bottom: 12px;
}

h1 {
  font-size: 1.5rem;
  color: var(--primary-color);
  margin: 0;
}

.description {
  color: var(--text-light);
  margin-bottom: 32px;
  line-height: 1.5;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.password-input {
  padding: 14px 16px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  font-size: 1rem;
  outline: none;
  transition: border-color 0.2s;
}

.password-input:focus {
  border-color: var(--primary-color);
}

.auth-btn {
  padding: 14px;
  background-color: var(--primary-color);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.2s;
}

.auth-btn:hover {
  background-color: #484848;
}

.error-msg {
  color: var(--danger-color);
  margin-top: 16px;
  font-size: 0.9rem;
}
</style>
