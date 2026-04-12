#!/usr/bin/env bash
set -euo pipefail
APP_ROOT=/var/www/dashboard-sa
EMBED_SECRET="${EMBED_SECRET:-$(openssl rand -hex 32)}"

mkdir -p "$APP_ROOT"
tar -xzf /tmp/deploy.tgz -C "$APP_ROOT"
(cd "$APP_ROOT/server" && npm ci --omit=dev)

umask 077
cat > /etc/dashboard-sa.env <<EOF
PORT=8787
EMBED_SECRET=${EMBED_SECRET}
SUPABASE_URL=https://msqglwmdsizgnfqsutrp.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1zcWdsd21kc2l6Z25mcXN1dHJwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3ODcxNzAsImV4cCI6MjA4NzM2MzE3MH0.R4xVh0e6lxBRyA9afUvzbF3ldb59EfoQqAlX0sBTuM4
SUPABASE_EMBED_USER_EMAIL=CHANGE_ME_EMBED_EMAIL
SUPABASE_EMBED_USER_PASSWORD=CHANGE_ME_EMBED_PASSWORD
CORS_ORIGINS=http://svdashboard.duckdns.org,https://svdashboard.duckdns.org,http://130.94.58.90,http://localhost:5173
EOF
chmod 0600 /etc/dashboard-sa.env

cat > /etc/nginx/sites-available/dashboard-sa <<'NGINX'
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name svdashboard.duckdns.org 130.94.58.90 _;
    root /var/www/dashboard-sa/dist;
    index index.html;

    add_header Content-Security-Policy "frame-ancestors *" always;

    location = /health {
        proxy_pass http://127.0.0.1:8787/health;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:8787;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
NGINX
chmod 0644 /etc/nginx/sites-available/dashboard-sa

cat > /etc/systemd/system/dashboard-api.service <<'UNIT'
[Unit]
Description=dashboard-sa embed API
After=network.target

[Service]
Type=simple
WorkingDirectory=/var/www/dashboard-sa/server
EnvironmentFile=/etc/dashboard-sa.env
ExecStart=/usr/bin/node src/index.mjs
Restart=on-failure
RestartSec=5
User=root

[Install]
WantedBy=multi-user.target
UNIT
chmod 0644 /etc/systemd/system/dashboard-api.service

rm -f /etc/nginx/sites-enabled/default
ln -sf /etc/nginx/sites-available/dashboard-sa /etc/nginx/sites-enabled/dashboard-sa
nginx -t
systemctl daemon-reload
systemctl enable --now nginx
systemctl enable --now dashboard-api

echo "=== EMBED_SECRET (save for iframe URLs) ==="
grep ^EMBED_SECRET= /etc/dashboard-sa.env
echo "=== Edit embed user credentials ==="
echo "nano /etc/dashboard-sa.env  # set SUPABASE_EMBED_USER_EMAIL and SUPABASE_EMBED_USER_PASSWORD"
echo "systemctl restart dashboard-api"
