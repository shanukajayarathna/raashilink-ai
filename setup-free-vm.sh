#!/usr/bin/env bash
set -euo pipefail

# One-shot setup for a fully free deployment on Ubuntu VM:
# - Node.js + PM2 + Python venv
# - Build frontend and serve via Nginx
# - Run backend on localhost:5000 behind Nginx
# - Optional HTTPS if DOMAIN is set and DNS already points to this server

APP_DIR="${APP_DIR:-/var/www/raashilink.ai}"
REPO_URL="${REPO_URL:-}"
DOMAIN="${DOMAIN:-}"
PUBLIC_API_BASE="${PUBLIC_API_BASE:-}"
ENABLE_HTTPS="${ENABLE_HTTPS:-false}"

if [[ -z "$REPO_URL" ]]; then
  echo "ERROR: REPO_URL is required"
  echo "Example: REPO_URL=https://github.com/<owner>/<repo>.git"
  exit 1
fi

if [[ -z "$PUBLIC_API_BASE" ]]; then
  if [[ -n "$DOMAIN" ]]; then
    PUBLIC_API_BASE="https://${DOMAIN}/api/v1"
  else
    echo "ERROR: PUBLIC_API_BASE is required when DOMAIN is empty"
    echo "Example: PUBLIC_API_BASE=http://<server-ip>/api/v1"
    exit 1
  fi
fi

echo "[1/9] Installing base packages"
sudo apt update
sudo apt install -y nginx python3 python3-venv python3-pip build-essential curl git

echo "[2/9] Installing Node.js 20 and PM2"
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pm2

echo "[3/9] Preparing application directory"
sudo mkdir -p "$APP_DIR"
sudo chown -R "$USER":"$USER" "$APP_DIR"

if [[ ! -d "$APP_DIR/.git" ]]; then
  echo "[4/9] Cloning repository"
  git clone "$REPO_URL" "$APP_DIR"
else
  echo "[4/9] Repository exists, pulling latest"
  git -C "$APP_DIR" pull --ff-only
fi

cd "$APP_DIR"

echo "[5/9] Installing JavaScript dependencies"
npm install

echo "[6/9] Setting up Python virtual environment"
python3 -m venv .venv
source .venv/bin/activate
pip install --upgrade pip
pip install -r server/python/requirements.txt

if [[ ! -f "$APP_DIR/.env" ]]; then
  echo "[7/9] Creating .env from .env.production.example"
  cp .env.production.example .env
fi

echo "[7/9] Updating production URL hints in .env"
sed -i "s|^VITE_API_URL=.*|VITE_API_URL=${PUBLIC_API_BASE}|" .env || true
if [[ -n "$DOMAIN" ]]; then
  sed -i "s|^FRONTEND_URL=.*|FRONTEND_URL=https://${DOMAIN}|" .env || true
fi
sed -i "s|^PYTHON_BIN=.*|PYTHON_BIN=${APP_DIR}/.venv/bin/python|" .env || true

echo "IMPORTANT: Edit $APP_DIR/.env now and set real MONGODB_URI + JWT_SECRET before going live"

echo "[8/9] Building frontend"
npm run build

echo "[8/9] Starting backend with PM2"
pm2 delete raashilink-api >/dev/null 2>&1 || true
pm2 start deploy/ecosystem.config.cjs --name raashilink-api
pm2 save

echo "[9/9] Writing Nginx site config"
NGINX_SITE="/etc/nginx/sites-available/raashilink"

if [[ -n "$DOMAIN" ]]; then
  SERVER_NAME="$DOMAIN"
else
  SERVER_NAME="_"
fi

sudo tee "$NGINX_SITE" >/dev/null <<EOF
server {
    listen 80;
    server_name ${SERVER_NAME};

    root ${APP_DIR}/dist;
    index index.html;
    client_max_body_size 25m;

    location /api/ {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 3600;
        proxy_send_timeout 3600;
    }

    location /uploads/ {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    location / {
        try_files \$uri /index.html;
    }
}
EOF

sudo ln -sf "$NGINX_SITE" /etc/nginx/sites-enabled/raashilink
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx

if [[ "$ENABLE_HTTPS" == "true" ]]; then
  if [[ -z "$DOMAIN" ]]; then
    echo "ERROR: ENABLE_HTTPS=true requires DOMAIN to be set"
    exit 1
  fi
  echo "[Optional] Installing HTTPS certificate"
  sudo apt install -y certbot python3-certbot-nginx
  sudo certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos -m "admin@${DOMAIN}" --redirect
fi

echo
echo "Setup complete"
echo "Health: curl http://127.0.0.1:5000/api/v1/health"
if [[ -n "$DOMAIN" ]]; then
  echo "Public health: curl http://${DOMAIN}/api/v1/health"
else
  echo "Public health: curl http://<server-ip>/api/v1/health"
fi
echo "Do not forget to edit $APP_DIR/.env with real secrets if still placeholder values are present."
