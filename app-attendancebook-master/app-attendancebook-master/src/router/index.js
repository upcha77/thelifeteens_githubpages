import Vue from "vue";
import VueRouter from "vue-router";
import AttendanceView from "../views/AttendanceView.vue";
import StatusView from "../views/StatusView.vue";
import AddMemberView from "../views/AddMemberView.vue";

Vue.use(VueRouter);

const routes = [
  {
    path: "/",
    redirect: "/attendance",
  },
  {
    path: "/attendance",
    name: "Attendance",
    component: AttendanceView,
  },
  {
    path: "/status",
    name: "Status",
    component: StatusView,
  },
  {
    path: "/add-member",
    name: "AddMember",
    component: AddMemberView,
  },
  {
    path: "/admin",
    name: "Admin",
    component: () => import("../views/AdminView.vue"),
  },
];

const router = new VueRouter({
  mode: "history",
  base: process.env.BASE_URL,
  routes,
});

export default router;
