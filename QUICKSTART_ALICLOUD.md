# 阿里云服务器部署快速指南

## 一键部署到 47.108.148.251

### 步骤1：在本地克隆项目

```bash
git clone https://github.com/mumugogoing/blockchain-monitor.git
cd blockchain-monitor
```

### 步骤2：运行部署脚本

```bash
./deploy-to-alicloud.sh
```

脚本会提示您输入：
- 服务器用户名（默认：root）
- 服务器密码

### 步骤3：等待部署完成

脚本会自动完成以下操作：
1. ✓ 检查本地环境
2. ✓ 连接到服务器 47.108.148.251
3. ✓ 安装 Docker（如果未安装）
4. ✓ 上传项目文件
5. ✓ 构建 Docker 镜像
6. ✓ 启动服务

### 步骤4：访问应用

部署成功后，打开浏览器访问：

```
http://47.108.148.251
```

### 登录凭证

| 用户名 | 密码 | 权限 |
|--------|------|------|
| super  | super123 | 管理员 |
| stx    | stx123   | STX监控 |
| stark  | stark123 | Starknet监控 |

---

## 自定义端口部署

如果80端口已被占用，可以使用其他端口：

```bash
PORT=8080 ./deploy-to-alicloud.sh
```

然后访问：`http://47.108.148.251:8080`

---

## 常用管理命令

### 查看服务状态
```bash
ssh root@47.108.148.251 'cd /opt/blockchain-monitor && docker compose ps'
```

### 查看日志
```bash
ssh root@47.108.148.251 'cd /opt/blockchain-monitor && docker compose logs -f'
```

### 重启服务
```bash
ssh root@47.108.148.251 'cd /opt/blockchain-monitor && docker compose restart'
```

### 停止服务
```bash
ssh root@47.108.148.251 'cd /opt/blockchain-monitor && docker compose down'
```

### 更新应用
```bash
git pull origin main
./deploy-to-alicloud.sh
```

---

## 使用 SSH 密钥认证（推荐）

如果您配置了SSH密钥，可以更安全地部署：

```bash
export SSH_KEY=~/.ssh/id_rsa
./deploy-to-alicloud.sh
```

---

## 遇到问题？

详细的故障排除和配置说明，请查看：
- [阿里云部署完整指南](./ALICLOUD_DEPLOYMENT.md)
- [通用部署文档](./DEPLOYMENT.md)

或查看实时日志诊断问题：
```bash
ssh root@47.108.148.251 'cd /opt/blockchain-monitor && docker compose logs'
```

---

## 安全提示

⚠️ **生产环境使用前请务必：**
1. 修改默认密码（在 `src/services/auth.ts` 中）
2. 配置 HTTPS 证书
3. 限制服务器访问权限
4. 定期更新系统和应用

详细安全建议请参考 [ALICLOUD_DEPLOYMENT.md](./ALICLOUD_DEPLOYMENT.md#安全建议)
