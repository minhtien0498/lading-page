#!/bin/bash

set -e  # Dừng script nếu có lỗi

# --- Cấu hình ---
REPO_URL="https://github.com/minhtien0498/lading-page.git"
APP_DIR="$HOME/projects/lading-page"
IMAGE_NAME="my-html-web:latest"
DEPLOYMENT_NAME="web-html"
CLUSTER_NAME="demo-cluster"

echo "🚀 Bắt đầu CI/CD local..."

# 1. Clone hoặc pull code
echo "📦 1. Clone hoặc cập nhật project..."
if [ ! -d "$APP_DIR/.git" ]; then
    echo "Chưa có project, tiến hành clone..."
    git clone "$REPO_URL" "$APP_DIR"
else
    echo "Đã có project, pull code mới nhất..."
    cd "$APP_DIR"
    git fetch origin
    git reset --hard origin/docker1
fi

cd "$APP_DIR"

# 2. Tạo Dockerfile nếu chưa có
if [ ! -f Dockerfile ]; then
    echo "⚙️ Tạo Dockerfile..."
    cat <<EOF > Dockerfile
FROM nginx:alpine
COPY . /usr/share/nginx/html
EXPOSE 80
EOF
fi

# 3. Build Docker image
echo "🐳 2. Build Docker image..."
docker build -t $IMAGE_NAME .

# 4. Load image vào kind cluster
echo "📥 3. Load image vào kind cluster ($CLUSTER_NAME)..."
./kind.exe  load docker-image $IMAGE_NAME --name $CLUSTER_NAME

# 5. Kiểm tra deployment
echo "🔁 4. Kiểm tra deployment có tồn tại..."
if kubectl get deployment $DEPLOYMENT_NAME &> /dev/null; then
  echo "♻️ 4.1 Deployment đã có. Restart để dùng image mới..."
  kubectl rollout restart deployment $DEPLOYMENT_NAME
else
  echo "📄 4.2 Chưa có deployment. Tạo mới từ web-deployment.yaml..."
  kubectl apply -f web-deployment.yaml
fi

# 6. Chờ deployment sẵn sàng
echo "⏳ 5. Chờ deployment sẵn sàng..."
kubectl rollout status deployment/$DEPLOYMENT_NAME --timeout=120s

# 7. Port-forward service
echo "🌐 6. Port-forward tới service..."
kubectl port-forward service/web-html-service 8080:80 &
PORT_FORWARD_PID=$!
echo "Port-forward đang chạy ở PID $PORT_FORWARD_PID (nhấn Ctrl+C để dừng)"
wait $PORT_FORWARD_PID
