#!/bin/bash
export DB_HOST=127.0.0.1
export DB_PORT=3306
export DB_USER=gujia
export DB_PASSWORD=gujia_dev_2026
export DB_NAME=gujia
export REDIS_HOST=127.0.0.1
export REDIS_PORT=6379
export JWT_SECRET=gujia_local_dev_jwt_secret_2026_xK9mPqR7vN3wL5tY
export JWT_EXPIRES_IN=7d
export NODE_ENV=development
export FRONTEND_URL=http://localhost:8720
export BACKEND_PUBLIC_URL=http://localhost:8721
export PORT=8721
export CORS_ORIGINS=http://localhost:8720,http://localhost:3000

cd /home/ubuntu/saas/backend
exec npx tsx server/index.ts
