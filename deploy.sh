#!/bin/bash

set -e  # Dừng nếu có lỗi

# Cấu hình
REPO_URL="https://github.com/minhtien0498/lading-page.git"
APP_NAME="landing-page"
CONTAINER_NAME="landing-page-container"
APP_DIR="$HOME/projects/$APP_NAME"

echo "📦 Đang kiểm tra thư mục project..."

# Clone nếu chưa tồn tại
if [ ! -d "$APP_DIR" ]; then
    echo "🚀 Chưa có project, tiến hành clone..."
    git clone $REPO_URL $APP_DIR
else
    echo "✅ Đã có project, pull code mới nhất..."
    cd $APP_DIR
    git pull origin main
fi

cd $APP_DIR

# Tạo Dockerfile nếu chưa có
if [ ! -f Dockerfile ]; then
    echo "⚙️ Tạo Dockerfile..."
    cat <<EOF > Dockerfile
FROM nginx:alpine
COPY . /usr/share/nginx/html
EXPOSE 80
EOF
fi

echo "🐳 Build Docker image..."
docker build -t $APP_NAME:latest .

echo "🧹 Dừng & xóa container cũ nếu có..."
docker stop $CONTAINER_NAME || true
docker rm $CONTAINER_NAME || true

echo "🚀 Chạy container mới..."
docker run -d -p 8080:80 --name $CONTAINER_NAME $APP_NAME:latest

echo "✅ DONE! Website đang chạy tại: http://localhost:8080"