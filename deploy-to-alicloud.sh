#!/bin/bash

# 区块链监控系统 - 阿里云服务器部署脚本
# 目标服务器: 47.108.148.251

set -e

echo "======================================"
echo "  区块链监控系统 - 阿里云部署脚本"
echo "======================================"
echo ""
echo "目标服务器: 47.108.148.251"
echo ""

# 配置变量
SERVER_IP="47.108.148.251"
SERVER_USER="${SERVER_USER:-root}"  # 默认使用root，可通过环境变量修改
APP_NAME="blockchain-monitor"
REMOTE_DIR="/opt/${APP_NAME}"
PORT="${PORT:-80}"  # 默认端口80，可通过环境变量修改

# 检查是否提供了SSH密钥或密码
if [ -z "$SSH_KEY" ] && [ -z "$SSH_PASSWORD" ]; then
    echo "请设置SSH认证方式："
    echo "  方式1 - 使用SSH密钥: export SSH_KEY=/path/to/private_key"
    echo "  方式2 - 使用密码: export SSH_PASSWORD=your_password"
    echo ""
    read -p "请输入服务器用户名 (默认: root): " input_user
    SERVER_USER=${input_user:-root}
    echo ""
    read -sp "请输入服务器密码: " SSH_PASSWORD
    echo ""
    export SSH_PASSWORD
fi

# SSH连接测试函数
test_ssh() {
    echo "测试SSH连接..."
    if [ -n "$SSH_KEY" ]; then
        ssh -i "$SSH_KEY" -o ConnectTimeout=10 -o StrictHostKeyChecking=no ${SERVER_USER}@${SERVER_IP} "echo '连接成功'" 2>/dev/null
    else
        sshpass -p "$SSH_PASSWORD" ssh -o ConnectTimeout=10 -o StrictHostKeyChecking=no ${SERVER_USER}@${SERVER_IP} "echo '连接成功'" 2>/dev/null
    fi
}

# 执行远程命令函数
remote_exec() {
    if [ -n "$SSH_KEY" ]; then
        ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no ${SERVER_USER}@${SERVER_IP} "$1"
    else
        sshpass -p "$SSH_PASSWORD" ssh -o StrictHostKeyChecking=no ${SERVER_USER}@${SERVER_IP} "$1"
    fi
}

# 上传文件函数
upload_files() {
    echo "上传项目文件到服务器..."
    if [ -n "$SSH_KEY" ]; then
        rsync -avz --exclude 'node_modules' --exclude '.git' --exclude 'dist' \
            -e "ssh -i $SSH_KEY -o StrictHostKeyChecking=no" \
            ./ ${SERVER_USER}@${SERVER_IP}:${REMOTE_DIR}/
    else
        sshpass -p "$SSH_PASSWORD" rsync -avz --exclude 'node_modules' --exclude '.git' --exclude 'dist' \
            -e "ssh -o StrictHostKeyChecking=no" \
            ./ ${SERVER_USER}@${SERVER_IP}:${REMOTE_DIR}/
    fi
}

# 检查必要工具
echo "检查本地环境..."
if [ -z "$SSH_KEY" ] && ! command -v sshpass &> /dev/null; then
    echo "警告: sshpass 未安装，使用密码认证需要安装 sshpass"
    echo "Ubuntu/Debian: sudo apt-get install sshpass"
    echo "CentOS/RHEL: sudo yum install sshpass"
    echo "macOS: brew install sshpass"
    echo ""
    echo "或者使用SSH密钥认证: export SSH_KEY=/path/to/private_key"
    exit 1
fi

if ! command -v rsync &> /dev/null; then
    echo "错误: rsync 未安装"
    echo "Ubuntu/Debian: sudo apt-get install rsync"
    echo "CentOS/RHEL: sudo yum install rsync"
    exit 1
fi

echo "✓ 本地环境检查通过"
echo ""

# 测试服务器连接
if ! test_ssh; then
    echo "错误: 无法连接到服务器 ${SERVER_IP}"
    echo "请检查："
    echo "  1. 服务器IP是否正确"
    echo "  2. SSH端口是否开放（默认22）"
    echo "  3. 用户名和密码/密钥是否正确"
    exit 1
fi

echo "✓ 服务器连接成功"
echo ""

# 在服务器上检查Docker环境
echo "检查服务器Docker环境..."
if ! remote_exec "command -v docker &> /dev/null"; then
    echo "服务器上未安装Docker，正在安装..."
    remote_exec "curl -fsSL https://get.docker.com | sh && systemctl start docker && systemctl enable docker"
    echo "✓ Docker安装成功"
fi

if ! remote_exec "docker compose version &> /dev/null"; then
    echo "服务器上未安装Docker Compose，正在安装..."
    # 安装Docker Compose V2
    remote_exec "apt-get update && apt-get install -y docker-compose-plugin || yum install -y docker-compose-plugin"
    echo "✓ Docker Compose安装成功"
fi

echo "✓ Docker环境检查通过"
echo ""

# 创建远程目录
echo "准备远程目录..."
remote_exec "mkdir -p ${REMOTE_DIR}"
echo "✓ 远程目录已创建: ${REMOTE_DIR}"
echo ""

# 上传文件
upload_files
echo "✓ 文件上传成功"
echo ""

# 修改端口配置（如果指定了非80端口）
if [ "$PORT" != "80" ]; then
    echo "配置端口为: ${PORT}"
    remote_exec "cd ${REMOTE_DIR} && sed -i 's/\"80:80\"/\"${PORT}:80\"/g' docker-compose.yml"
fi

# 在服务器上构建和启动
echo "在服务器上构建并启动应用..."
remote_exec "cd ${REMOTE_DIR} && docker compose down 2>/dev/null || true"
remote_exec "cd ${REMOTE_DIR} && docker compose build"
remote_exec "cd ${REMOTE_DIR} && docker compose up -d"

echo "✓ 应用启动成功"
echo ""

# 等待服务启动
echo "等待服务启动..."
sleep 5

# 检查容器状态
if remote_exec "cd ${REMOTE_DIR} && docker compose ps | grep -q 'Up'"; then
    echo "======================================"
    echo "  部署成功！"
    echo "======================================"
    echo ""
    echo "服务器信息:"
    echo "  IP地址: ${SERVER_IP}"
    echo "  访问地址: http://${SERVER_IP}:${PORT}"
    echo ""
    echo "登录凭证:"
    echo "  管理员: super / super123"
    echo "  STX用户: stx / stx123"
    echo "  Starknet用户: stark / stark123"
    echo ""
    echo "远程管理命令:"
    echo "  查看日志: ssh ${SERVER_USER}@${SERVER_IP} 'cd ${REMOTE_DIR} && docker compose logs -f'"
    echo "  重启服务: ssh ${SERVER_USER}@${SERVER_IP} 'cd ${REMOTE_DIR} && docker compose restart'"
    echo "  停止服务: ssh ${SERVER_USER}@${SERVER_IP} 'cd ${REMOTE_DIR} && docker compose down'"
    echo ""
    echo "提示: 如需修改端口，可设置环境变量: PORT=8080 ./deploy-to-alicloud.sh"
    echo ""
else
    echo "错误: 容器启动异常"
    echo "查看日志:"
    remote_exec "cd ${REMOTE_DIR} && docker compose logs"
    exit 1
fi
