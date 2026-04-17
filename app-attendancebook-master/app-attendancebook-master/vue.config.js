const { defineConfig } = require("@vue/cli-service");
module.exports = defineConfig({
  publicPath: process.env.NODE_ENV === "production" ? "/thelifeteens_githubpages/" : "/",
  transpileDependencies: true,
  pages: {
    index: {
      entry: "src/main.js",
      template: "public/index.html",
      filename: "index.html",
      title: "더랍지구촌 청소년부 출석부",
    },
  },
});
