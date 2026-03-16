module.exports = {
  apps: [
    {
      name: "gujia-backend",
      // 直接用 node 执行编译产物，不依赖 pnpm 路径
      script: "dist/server/index.js",
      cwd: "./backend",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
        PORT: 8721
      },
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      error_file: "./backend/logs/backend-error.log",
      out_file: "./backend/logs/backend-out.log",
      merge_logs: true
    },
    {
      name: "gujia-frontend",
      // 直接用 next 的 JS 入口，不依赖 pnpm 或 shell 脚本
      script: "node_modules/next/dist/bin/next",
      args: "start --port 8720",
      cwd: "./frontend",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
        PORT: 8720
      },
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      error_file: "./frontend/logs/frontend-error.log",
      out_file: "./frontend/logs/frontend-out.log",
      merge_logs: true
    }
  ]
};
