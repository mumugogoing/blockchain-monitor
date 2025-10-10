#!/bin/bash

# 服务器连接验证脚本
# 用于部署前检查服务器环境

set -e

echo "======================================"
echo "  阿里云服务器环境检查"
echo "======================================"
echo ""

SERVER_IP="${SERVER_IP:-47.108.148.251}"
SERVER_USER="${SERVER_USER:-root}"

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查函数
check_tool() {
    if command -v $1 &> /dev/null; then
        echo -e "${GREEN}✓${NC} $1 已安装"
        return 0
    else
        echo -e "${RED}✗${NC} $1 未安装"
        return 1
    fi
}

echo "检查本地工具..."
echo ""

# 检查必要工具
TOOLS_OK=true
check_tool ssh || TOOLS_OK=false
check_tool rsync || TOOLS_OK=false

echo ""
echo "检查可选工具..."
check_tool sshpass || echo -e "${YELLOW}⚠${NC} sshpass 未安装（使用密码认证时需要）"

echo ""
echo "======================================"

if [ "$TOOLS_OK" = false ]; then
    echo -e "${RED}错误：缺少必要工具${NC}"
    echo ""
    echo "请安装缺失的工具："
    echo "  Ubuntu/Debian: sudo apt-get install ssh rsync sshpass"
    echo "  CentOS/RHEL: sudo yum install openssh-clients rsync sshpass"
    echo "  macOS: brew install rsync sshpass"
    exit 1
fi

echo ""
read -p "是否测试服务器连接? (y/n): " test_connection

if [ "$test_connection" = "y" ] || [ "$test_connection" = "Y" ]; then
    echo ""
    read -p "服务器用户名 (默认: $SERVER_USER): " input_user
    SERVER_USER=${input_user:-$SERVER_USER}
    
    echo ""
    echo "测试连接到 ${SERVER_USER}@${SERVER_IP}..."
    
    if ssh -o ConnectTimeout=10 -o BatchMode=yes -o StrictHostKeyChecking=no ${SERVER_USER}@${SERVER_IP} "echo '连接成功'" 2>/dev/null; then
        echo -e "${GREEN}✓ 服务器连接成功（使用SSH密钥）${NC}"
        echo ""
        echo "推荐使用SSH密钥部署："
        echo "  export SSH_KEY=~/.ssh/id_rsa"
        echo "  ./deploy-to-alicloud.sh"
    else
        echo -e "${YELLOW}⚠ 无法使用SSH密钥连接${NC}"
        echo ""
        echo "可以使用密码认证部署："
        echo "  ./deploy-to-alicloud.sh"
        echo ""
        read -p "是否测试密码认证? (y/n): " test_password
        
        if [ "$test_password" = "y" ] || [ "$test_password" = "Y" ]; then
            if ! command -v sshpass &> /dev/null; then
                echo -e "${RED}错误: sshpass 未安装，无法测试密码认证${NC}"
                exit 1
            fi
            
            read -sp "请输入服务器密码: " password
            echo ""
            
            if sshpass -p "$password" ssh -o ConnectTimeout=10 -o StrictHostKeyChecking=no ${SERVER_USER}@${SERVER_IP} "echo '连接成功'" 2>/dev/null; then
                echo -e "${GREEN}✓ 密码认证成功${NC}"
                echo ""
                echo "可以开始部署："
                echo "  export SSH_PASSWORD='your_password'"
                echo "  ./deploy-to-alicloud.sh"
            else
                echo -e "${RED}✗ 密码认证失败${NC}"
                echo ""
                echo "请检查："
                echo "  1. 服务器IP是否正确"
                echo "  2. 用户名和密码是否正确"
                echo "  3. 服务器SSH端口是否开放（默认22）"
                echo "  4. 阿里云安全组是否允许SSH访问"
                exit 1
            fi
        fi
    fi
    
    echo ""
    echo "检查服务器Docker环境..."
    
    # 检查Docker
    if ssh -o ConnectTimeout=10 -o StrictHostKeyChecking=no ${SERVER_USER}@${SERVER_IP} "command -v docker" &>/dev/null; then
        DOCKER_VERSION=$(ssh -o StrictHostKeyChecking=no ${SERVER_USER}@${SERVER_IP} "docker --version" 2>/dev/null)
        echo -e "${GREEN}✓${NC} Docker 已安装: $DOCKER_VERSION"
    else
        echo -e "${YELLOW}⚠${NC} Docker 未安装（部署脚本会自动安装）"
    fi
    
    # 检查Docker Compose
    if ssh -o ConnectTimeout=10 -o StrictHostKeyChecking=no ${SERVER_USER}@${SERVER_IP} "docker compose version" &>/dev/null; then
        COMPOSE_VERSION=$(ssh -o StrictHostKeyChecking=no ${SERVER_USER}@${SERVER_IP} "docker compose version" 2>/dev/null)
        echo -e "${GREEN}✓${NC} Docker Compose 已安装: $COMPOSE_VERSION"
    else
        echo -e "${YELLOW}⚠${NC} Docker Compose 未安装（部署脚本会自动安装）"
    fi
    
    echo ""
    echo "检查服务器资源..."
    
    # 检查磁盘空间
    DISK_SPACE=$(ssh -o StrictHostKeyChecking=no ${SERVER_USER}@${SERVER_IP} "df -h / | tail -1 | awk '{print \$4}'" 2>/dev/null)
    echo "可用磁盘空间: $DISK_SPACE"
    
    # 检查内存
    MEMORY=$(ssh -o StrictHostKeyChecking=no ${SERVER_USER}@${SERVER_IP} "free -h | grep Mem | awk '{print \$7}'" 2>/dev/null)
    echo "可用内存: $MEMORY"
    
    echo ""
    echo -e "${GREEN}======================================"
    echo "  环境检查完成"
    echo "======================================${NC}"
    echo ""
    echo "可以开始部署："
    echo "  ./deploy-to-alicloud.sh"
fi

echo ""
