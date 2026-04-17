<template>
  <div v-if="visible" class="global-modal-overlay">
    <div class="global-modal-box">
      <!-- Title -->
      <h3 v-if="title" class="modal-title">{{ title }}</h3>

      <!-- Message (HTML support option logic can be added, but simple text for safety) -->
      <p class="modal-message">{{ message }}</p>

      <!-- Actions -->
      <div class="modal-actions">
        <!-- Confirm Button -->
        <button
          ref="confirmBtn"
          @click="onConfirm"
          class="modal-confirm-btn"
          :class="{ 'only-confirm': type === 'alert' }"
        >
          {{ confirmText }}
        </button>

        <!-- Cancel Button (Only for confirm type) -->
        <button
          v-if="type === 'confirm'"
          @click="onCancel"
          class="modal-cancel-btn"
        >
          {{ cancelText }}
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { EventBus } from "@/utils/eventBus";

export default {
  name: "GlobalModal",
  data() {
    return {
      visible: false,
      type: "alert", // 'alert' or 'confirm'
      title: "",
      message: "",
      confirmText: "확인",
      cancelText: "취소",
      resolve: null,
      reject: null,
    };
  },
  created() {
    // Listen for events
    EventBus.$on("global-alert", this.showAlert);
    EventBus.$on("global-confirm", this.showConfirm);
  },
  beforeDestroy() {
    EventBus.$off("global-alert", this.showAlert);
    EventBus.$off("global-confirm", this.showConfirm);
  },
  methods: {
    showAlert({ title = "", message, confirmText = "확인", resolve }) {
      this.type = "alert";
      this.title = title;
      this.message = message;
      this.confirmText = confirmText;
      this.visible = true;
      this.resolve = resolve;
    },
    showConfirm({
      title = "",
      message,
      confirmText = "확인",
      cancelText = "취소",
      resolve,
    }) {
      this.type = "confirm";
      this.title = title;
      this.message = message;
      this.confirmText = confirmText;
      this.cancelText = cancelText;
      this.visible = true;
      this.resolve = resolve;
    },
    onConfirm() {
      this.visible = false;
      if (this.resolve) {
        this.resolve(true);
      }
      this.reset();
    },
    onCancel() {
      this.visible = false;
      if (this.resolve) {
        this.resolve(false); // resolve false for confirm cancellation (like native confirm)
      }
      this.reset();
    },
    reset() {
      this.title = "";
      this.message = "";
      this.resolve = null;
      this.reject = null;
    },
  },
};
</script>

<style scoped>
.global-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5); /* Dimmed background */
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10000; /* Highest priority */
}

.global-modal-box {
  background: white;
  padding: 24px;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  width: 85%;
  max-width: 360px;
  text-align: center;
  animation: fadeIn 0.2s ease-out;
}

.modal-title {
  margin: 0 0 12px 0;
  font-size: 1.2em;
  font-weight: bold;
  color: #333;
}

.modal-message {
  margin: 0 0 24px 0;
  color: #555;
  font-size: 1em;
  line-height: 1.5;
  white-space: pre-line; /* Handle newlines */
}

.modal-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.modal-confirm-btn {
  background-color: #282828;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  font-weight: bold;
  cursor: pointer;
  flex: 1;
  transition: background-color 0.2s;
}
.modal-confirm-btn:hover {
  background-color: #444;
}

.modal-cancel-btn {
  background-color: #e0e0e0;
  color: #333;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  font-weight: bold;
  cursor: pointer;
  flex: 1;
  transition: background-color 0.2s;
}
.modal-cancel-btn:hover {
  background-color: #d5d5d5;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
