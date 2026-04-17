import Vue from "vue";
import App from "./App.vue";
import router from "./router";
import { auth } from "./firebase";
import { EventBus } from "./utils/eventBus"; // EventBus import

Vue.config.productionTip = false;

// Global Alert/Confirm Helpers
Vue.prototype.$alert = (message, title = "알림") => {
  return new Promise((resolve) => {
    // GlobalModal listens to 'global-alert'
    // We pass a resolve wrapper so GlobalModal can call it when confirmed
    // However, clean way is: GlobalModal emits events or returns promise if mounted imperatively?
    // Since GlobalModal is component-based event listener, we need a way to pass the resolve function
    // or use a structured event payload that GlobalModal understands it needs to handle the callback.
    // Actually GlobalModal implementation I wrote returns a Promise but it is local method.
    // We need to trigger it.

    // Better interaction:
    // EventBus.$emit("global-alert", { message, title, resolve });
    // GlobalModal receives { resolve } and calls resolve(true) on close.
    // Let's stick to the implementation expected by GlobalModal.vue I just wrote.

    // Wait, GlobalModal methods return Promise, but emitting event is fire-and-forget unless we pass handlers.
    // So let's pass a callback or rely on the fact that GlobalModal manages its own promise?
    // The previous GlobalModal code:
    // showAlert(...) { ... return new Promise(...) }
    // But that method is on the instance. Emitting event just triggers the method but the return value is lost.

    // Correction: We need to pass the 'resolve' function in the event payload.
    EventBus.$emit("global-alert", {
      message,
      title,
      resolve, // Passing the resolve function to the component
    });
  });
};

Vue.prototype.$confirm = (message, title = "확인") => {
  return new Promise((resolve) => {
    EventBus.$emit("global-confirm", {
      message,
      title,
      resolve, // Passing resolve (reject is usually not needed if we resolve(false))
    });
  });
};

let app;

// Firebase의 인증 상태가 바뀔 때마다 이 함수가 실행됩니다.

auth.onAuthStateChanged((user) => {
  console.log("인증 상태 변경:", user ? `User ${user.uid}` : "No user");

  // 유저가 있고, 앱이 아직 생성되지 않았을 때만 앱을 생성합니다.
  if (user && !app) {
    console.log("앱을 마운트합니다.");
    app = new Vue({
      router,
      render: (h) => h(App),
    }).$mount("#app");
  } else if (!user) {
    console.log("NOUSER");
  }
});
