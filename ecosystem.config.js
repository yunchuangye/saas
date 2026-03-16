module.exports = {
  apps: [
    {
      name: "gujia-backend",
      script: "pnpm",
      args: "run start",
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
      error_file: "./logs/backend-error.log",
      out_file: "./logs/backend-out.log",
      merge_logs: true
    },
    {
      name: "gujia-frontend",
      script: "pnpm",
      args: "run start",
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
      error_file: "./logs/frontend-error.log",
      out_file: "./logs/frontend-out.log",
      merge_logs: true
    }
  ]
};
