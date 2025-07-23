#!/bin/bash

# Tên image & deployment
IMAGE_NAME="my-html-web:latest"
DEPLOYMENT_NAME="web-html"
CLUSTER_NAME="demo-cluster"

echo "🚀 Bắt đầu CI/CD local..."

echo "📦 1. Build Docker image..."
docker build -t $IMAGE_NAME .

echo "🐳 2. Load image vào kind cluster ($CLUSTER_NAME)..."
./kind load docker-image $IMAGE_NAME --name $CLUSTER_NAME

echo "🔁 3. Kiểm tra deployment có tồn tại..."
if kubectl get deployment $DEPLOYMENT_NAME &> /dev/null; then
  echo "♻️ 4. Deployment đã có. Restart để dùng image mới..."
  kubectl rollout restart deployment $DEPLOYMENT_NAME
else
  echo "📄 4. Chưa có deployment. Tạo mới từ web-deployment.yaml..."
  kubectl apply -f web-deployment.yaml
fi

echo "⏳ 5. Chờ deployment sẵn sàng..."
kubectl rollout status deployment/$DEPLOYMENT_NAME --timeout=120s

echo "🌐 6. Port-forward tới service..."
# Giữ session mở cho đến khi nhấn Ctrl+C
exec kubectl port-forward service/web-html-service 8080:80


echo "✅ CI/CD local hoàn tất!"
kubectl get pods

echo "Port-forward đang chạy ở PID $PORT_FORWARD_PID"
