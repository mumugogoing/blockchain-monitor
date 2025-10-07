#!/bin/bash

# Blockchain Monitor 一键部署脚本

echo "======================================"
echo "  区块链监控系统 - 一键部署脚本"
echo "======================================"
echo ""

# 检查 Docker 是否安装
if ! command -v docker &> /dev/null; then
    echo "错误: Docker 未安装"
    echo "请先安装 Docker: https://docs.docker.com/get-docker/"
    exit 1
fi

# 检查 Docker Compose 是否安装
if ! docker compose version &> /dev/null; then
    echo "错误: Docker Compose 未安装"
    echo "请先安装 Docker Compose: https://docs.docker.com/compose/install/"
    exit 1
fi

echo "✓ Docker 环境检查通过"
echo ""

# 停止并删除旧容器
echo "停止旧容器..."
docker compose down 2>/dev/null

# 构建镜像
echo "构建 Docker 镜像..."
docker compose build

if [ $? -ne 0 ]; then
    echo "错误: Docker 镜像构建失败"
    exit 1
fi

echo "✓ Docker 镜像构建成功"
echo ""

# 启动容器
echo "启动容器..."
docker compose up -d

if [ $? -ne 0 ]; then
    echo "错误: 容器启动失败"
    exit 1
fi

echo "✓ 容器启动成功"
echo ""

# 等待服务启动
echo "等待服务启动..."
sleep 5

# 检查容器状态
if docker compose ps | grep -q "Up"; then
    echo "======================================"
    echo "  部署成功！"
    echo "======================================"
    echo ""
    echo "访问地址: http://localhost"
    echo ""
    echo "登录凭证:"
    echo "  管理员: super / super123"
    echo "  STX用户: stx / stx123"
    echo "  Starknet用户: stark / stark123"
    echo ""
    echo "查看日志: docker compose logs -f"
    echo "停止服务: docker compose down"
    echo ""
else
    echo "错误: 容器启动异常"
    echo "请运行 'docker compose logs' 查看详细日志"
    exit 1
fi
