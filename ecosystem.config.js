module.exports = {
  apps: [
    {
      name: "gujia-backend",
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
      error_file: "../logs/backend-error.log",
      out_file: "../logs/backend-out.log",
      merge_logs: true
    },
    {
      name: "gujia-frontend",
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
      error_file: "../logs/frontend-error.log",
      out_file: "../logs/frontend-out.log",
      merge_logs: true
    },
    {
      name: "gujia-scrapling",
      script: "app.py",
      interpreter: "python3",
      cwd: "./scrapling-service",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "500M",
      env: {
        PORT: 8722
      },
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      error_file: "../logs/scrapling-error.log",
      out_file: "../logs/scrapling-out.log",
      merge_logs: true
    },
    {
      name: "gujia-scraper",
      script: "app.py",
      interpreter: "python3",
      cwd: "./scraper",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "500M",
      env: {
        PORT: 9000
      },
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      error_file: "../logs/scraper-error.log",
      out_file: "../logs/scraper-out.log",
      merge_logs: true
    },
    {
      name: "gujia-valuation",
      script: "run.py",
      interpreter: "python3",
      cwd: "./valuation-service",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "500M",
      env: {
        PORT: 8723
      },
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      error_file: "../logs/valuation-error.log",
      out_file: "../logs/valuation-out.log",
      merge_logs: true
    }
  ]
};
