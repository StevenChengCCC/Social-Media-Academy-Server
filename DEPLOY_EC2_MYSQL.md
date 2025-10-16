# 部署指南（EC2 + Nginx + SSL + MySQL RDS）

## 1) 在 RDS 创建 MySQL 并建库建用户
```sql
CREATE DATABASE sma DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'sma_user'@'%' IDENTIFIED BY 'your_password_here';
GRANT ALL PRIVILEGES ON sma.* TO 'sma_user'@'%';
FLUSH PRIVILEGES;
```

## 2) 在 EC2 安装 Node/Nginx/certbot
```bash
sudo apt-get update -y
sudo apt-get install -y nginx snapd
sudo snap install core && sudo snap refresh core
sudo snap install --classic certbot
sudo ln -s /snap/bin/certbot /usr/bin/certbot

curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
node -v && npm -v
```

## 3) 上传并启动 API
```bash
rsync -av . ubuntu:<EC2_IP>:/opt/sma-api
ssh ubuntu@<EC2_IP>
cd /opt/sma-api
npm ci || npm install
cp .env.example .env  # 填入 RDS 与 Cognito 参数
npm run migrate
npm run dev  # 先前台验证
```

## 4) 配置 Nginx + 证书（替换域名）
```bash
sudo tee /etc/nginx/sites-available/sma-api <<'EOF'
server {
    listen 80;
    server_name api.socialmediaacademy.click;

    location /.well-known/acme-challenge/ { root /var/www/html; }
    location / { return 301 https://$host$request_uri; }
}

server {
    listen 443 ssl http2;
    server_name api.socialmediaacademy.click;

    ssl_certificate     /etc/letsencrypt/live/api.socialmediaacademy.click/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.socialmediaacademy.click/privkey.pem;

    add_header X-Content-Type-Options nosniff;
    add_header X-Frame-Options DENY;
    add_header Referrer-Policy no-referrer-when-downgrade;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF
sudo ln -s /etc/nginx/sites-available/sma-api /etc/nginx/sites-enabled/sma-api
sudo nginx -t && sudo systemctl reload nginx

sudo certbot --nginx -d api.socialmediaacademy.click --non-interactive --agree-tos -m you@example.com
```

## 5) 作为服务运行（systemd）
```bash
sudo usermod -a -G www-data ubuntu
sudo chown -R www-data:www-data /opt/sma-api

sudo tee /etc/systemd/system/sma-api.service <<'EOF'
[Unit]
Description=Social Media Academy API
After=network.target

[Service]
Type=simple
WorkingDirectory=/opt/sma-api
ExecStart=/usr/bin/node src/server.js
Restart=always
Environment=NODE_ENV=production
EnvironmentFile=/opt/sma-api/.env
User=www-data
Group=www-data

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable --now sma-api
systemctl status sma-api
```

## 6) 前端对接
- Amplify 环境变量：VITE_API_URL=https://api.socialmediaacademy.click
- 前端请求示例：fetch(import.meta.env.VITE_API_URL + '/api/courses')

## 7) 测试
```bash
curl -s https://api.socialmediaacademy.click/healthz
curl -s https://api.socialmediaacademy.click/api/courses
# 登录接口用 Cognito ID Token：
curl -H "Authorization: Bearer <ID_TOKEN>" https://api.socialmediaacademy.click/api/me
```