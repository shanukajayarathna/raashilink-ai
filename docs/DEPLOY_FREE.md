# Free Deployment Guide

This project is best deployed for free as:

- Frontend: Vercel or Cloudflare Pages
- Backend: Oracle Cloud Always Free Ubuntu VM
- Database: MongoDB Atlas M0 free cluster
- Cache: disabled initially with `REDIS_ENABLED=false`

If you are deploying the backend to Railway instead of a VM, follow `docs/DEPLOY_RAILWAY.md`.

If you want zero cost without buying a domain, use a free subdomain (for example DuckDNS) and deploy frontend+backend on a single VM.

## Fastest All-Free Path (Single VM)

Use the one-shot setup script in `deploy/setup-free-vm.sh`.

1. Create an Ubuntu VM (Oracle Always Free) and SSH into it.
2. Run:

```bash
git clone https://github.com/shanukajayarathna/raashilink-ai.git
cd raashilink-ai
chmod +x deploy/setup-free-vm.sh
REPO_URL=https://github.com/shanukajayarathna/raashilink-ai.git DOMAIN=<your-free-subdomain> ENABLE_HTTPS=true ./deploy/setup-free-vm.sh
```

3. Edit `/var/www/raashilink.ai/.env` and set real values for `MONGODB_URI` and `JWT_SECRET`.
4. Restart API after env changes:

```bash
cd /var/www/raashilink.ai
pm2 restart raashilink-api
```

If you are not using a domain yet, run with `DOMAIN` empty and provide `PUBLIC_API_BASE=http://<server-ip>/api/v1`.

That combination matches the current app shape: a Vite frontend plus a long-running Node/Express backend that uses Socket.IO, file uploads, MongoDB, and Python subprocesses.

## Architecture

- `app.example.com` -> Vercel or Cloudflare Pages for the frontend
- `api.example.com` -> Oracle Cloud Ubuntu VM running the backend behind Nginx + PM2
- MongoDB Atlas -> external managed database

## 1. Prepare MongoDB Atlas

1. Create a free Atlas cluster.
2. Create a database user.
3. Add your backend VM IP to Atlas network access.
4. Copy the connection string into `MONGODB_URI`.

## 2. Frontend Deployment

Use Vercel if you want the easiest setup.

### Vercel settings

- Framework preset: `Vite`
- Build command: `npm run build`
- Output directory: `dist`

### Frontend environment variables

- `VITE_API_URL=https://api.example.com`
- `VITE_GOOGLE_CLIENT_ID=...` if Google login is enabled
- Firebase `VITE_*` values only if phone auth is enabled

After the first deployment, connect your custom domain such as `app.example.com`.

## 3. Oracle Cloud Always Free VM

Create an Ubuntu VM and point `api.example.com` to its public IP.

### Base packages

```bash
sudo apt update
sudo apt install -y nginx python3 python3-venv python3-pip build-essential curl git
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pm2
```

### Deploy the app

```bash
sudo mkdir -p /var/www/raashilink.ai
sudo chown -R $USER:$USER /var/www/raashilink.ai
cd /var/www/raashilink.ai
git clone <your-repo-url> .
npm install
python3 -m venv .venv
source .venv/bin/activate
pip install -r server/python/requirements.txt
cp .env.production.example .env
```

Edit `.env` with your real production values before starting the server.

### Start with PM2

```bash
pm2 start deploy/ecosystem.config.cjs
pm2 save
pm2 startup
```

### Nginx reverse proxy

```bash
sudo cp deploy/nginx/raashilink-api.conf /etc/nginx/sites-available/raashilink-api.conf
sudo nano /etc/nginx/sites-available/raashilink-api.conf
sudo ln -s /etc/nginx/sites-available/raashilink-api.conf /etc/nginx/sites-enabled/raashilink-api.conf
sudo nginx -t
sudo systemctl reload nginx
```

Replace `api.example.com` in the config with your real API domain first.

### HTTPS with Let's Encrypt

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d api.example.com
```

## 4. Production Environment Values

The fastest safe baseline is:

```env
NODE_ENV=production
PORT=5000
FRONTEND_URL=https://app.example.com
MONGODB_URI=mongodb+srv://...
JWT_SECRET=replace_with_a_long_random_secret
PYTHON_BIN=/var/www/raashilink.ai/.venv/bin/python
REDIS_ENABLED=false
VITE_API_URL=https://api.example.com
```

Add optional provider variables only if those features are in use.

## 5. Health Checks

Verify the backend from the VM:

```bash
curl http://127.0.0.1:5000/api/v1/health
```

Verify the public API:

```bash
curl https://api.example.com/api/v1/health
```

## 6. What Not To Do

- Do not deploy the backend as a static Vercel project.
- Do not rely on local MongoDB for internet deployment.
- Do not enable Redis unless you have an actual hosted Redis endpoint.
- Do not keep uploads or secrets in git.

## 7. Notes For This Repository

- The backend starts from `server/app.js`.
- Python subprocess calls depend on `PYTHON_BIN` being valid on the server.
- File uploads are served from `/uploads` by the backend, so they work through the same API domain.
- Frontend chat streaming now accepts `VITE_API_URL` in either host form (`https://api.example.com`) or full API base form (`https://api.example.com/api/v1`).

## 8. Recommended First Launch Order

1. Deploy MongoDB Atlas.
2. Deploy the backend VM and confirm `/api/v1/health` works.
3. Deploy the frontend with `VITE_API_URL` pointing at the backend.
4. Test login, chat, horoscope, and uploads.
