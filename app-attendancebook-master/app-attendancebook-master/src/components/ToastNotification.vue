<template>
  <transition name="toast-fade">
    <div v-if="visible" class="toast-notification" :class="type">
      <div class="toast-content">
        <span class="toast-icon">{{ icon }}</span>
        <span class="toast-message">{{ message }}</span>
      </div>
    </div>
  </transition>
</template>

<script>
import { EventBus } from "@/utils/eventBus";

export default {
  name: "ToastNotification",
  data() {
    return {
      visible: false,
      message: "",
      type: "info", // 'success', 'error', 'info'
      timeout: null,
    };
  },
  computed: {
    icon() {
      switch (this.type) {
        case "success":
          return "✓";
        case "error":
          return "!";
        default:
          return "ℹ";
      }
    },
  },
  created() {
    EventBus.$on("show-toast", this.showToast);
  },
  beforeDestroy() {
    EventBus.$off("show-toast", this.showToast);
  },
  methods: {
    showToast({ message, type = "info", duration = 3000 }) {
      this.message = message;
      this.type = type;
      this.visible = true;

      if (this.timeout) {
        clearTimeout(this.timeout);
      }

      this.timeout = setTimeout(() => {
        this.visible = false;
      }, duration);
    },
  },
};
</script>

<style scoped>
.toast-notification {
  position: fixed;
  bottom: 30px;
  left: 50%;
  transform: translateX(-50%);
  padding: 12px 24px;
  border-radius: 50px;
  color: white;
  font-weight: bold;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 9999;
  display: flex;
  align-items: center;
  min-width: 300px;
  justify-content: center;
}

.toast-content {
  display: flex;
  align-items: center;
  gap: 10px;
}

.toast-icon {
  font-size: 1.2em;
}

.success {
  background-color: #4caf50;
}

.error {
  background-color: #f44336;
}

.info {
  background-color: #2196f3;
}

/* Transition effects */
.toast-fade-enter-active,
.toast-fade-leave-active {
  transition: all 0.3s ease;
}

.toast-fade-enter,
.toast-fade-leave-to {
  opacity: 0;
  transform: translate(-50%, 20px);
}
</style>
