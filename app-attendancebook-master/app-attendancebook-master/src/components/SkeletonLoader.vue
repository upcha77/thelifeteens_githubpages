<template>
  <div class="skeleton-loader" :style="{ width: width, height: height }"></div>
</template>

<script>
export default {
  name: "SkeletonLoader",
  props: {
    width: {
      type: String,
      default: "100%",
    },
    height: {
      type: String,
      default: "20px",
    },
  },
};
</script>

<style scoped>
.skeleton-loader {
  background-color: #e0e0e0;
  border-radius: 4px;
  animation: pulse 1.5s infinite ease-in-out;
}

@keyframes pulse {
  0% {
    background-color: #e0e0e0;
  }
  50% {
    background-color: #f0f0f0;
  }
  100% {
    background-color: #e0e0e0;
  }
}
</style>
