# Deploying RankdSEO to Your VPS

Complete step-by-step guide to migrate the entire project (database + files + everything) to your private VPS server.

---

## 1. VPS Requirements

| Resource | Minimum | Recommended |
|----------|---------|-------------|
| OS | Ubuntu 22.04+ / Debian 12+ | Ubuntu 24.04 LTS |
| RAM | 2 GB | 4 GB |
| CPU | 1 vCPU | 2 vCPU |
| Disk | 20 GB | 50 GB (screenshots are ~850MB) |
| Node.js | v20.x | v20.x |
| PostgreSQL | 15+ | 15+ |

---

## 2. Prepare Your VPS

SSH into your server and install dependencies:

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install Yarn
npm install -g yarn

# Install PostgreSQL 15
sudo apt install -y postgresql postgresql-contrib

# Install Nginx (reverse proxy)
sudo apt install -y nginx

# Install PM2 (process manager)
npm install -g pm2

# Install Certbot (SSL)
sudo apt install -y certbot python3-certbot-nginx

# Verify installations
node -v    # v20.x
yarn -v
psql --version
nginx -v
pm2 -v
```

---

## 3. Transfer Files from Emergent to VPS

### Option A: Download Backup (Recommended)
1. Go to **Admin Panel → Backups** on your Emergent preview
2. Click **Create Backup Now** (this creates a full backup with DB + files + screenshots)
3. Click **Download** on the latest backup
4. Upload to your VPS:

```bash
# From your local machine
scp backup_2026-03-26T09-05-24.tar.gz user@your-vps-ip:/home/user/
```

5. Extract on VPS:

```bash
cd /home/user
tar xzf backup_2026-03-26T09-05-24.tar.gz
cd backup_2026-03-26T09-05-24/

# You'll see:
# - database.sql    (full PostgreSQL dump)
# - source.tar.gz   (all source code + screenshots)
# - metadata.json   (backup info)
```

### Option B: Use "Save to Github" + Git Clone
1. On Emergent, use the **"Save to Github"** button to push to your repo
2. On your VPS: `git clone https://github.com/your-username/your-repo.git`
3. You'll still need to transfer the database separately (see Step 5)

---

## 4. Set Up the Project

```bash
# Create project directory
sudo mkdir -p /var/www/rankdseo
cd /var/www/rankdseo

# Extract source files from backup
tar xzf /home/user/backup_2026-03-26T09-05-24/source.tar.gz

# Install dependencies
yarn install

# Generate Prisma client
npx prisma generate
```

---

## 5. Set Up PostgreSQL Database

```bash
# Switch to postgres user
sudo -u postgres psql

# Create database and user
CREATE USER rankseo WITH PASSWORD 'YOUR_STRONG_PASSWORD_HERE';
CREATE DATABASE rankseo OWNER rankseo;
GRANT ALL PRIVILEGES ON DATABASE rankseo TO rankseo;
\q

# Restore database from backup
psql -U rankseo -h localhost -d rankseo < /home/user/backup_2026-03-26T09-05-24/database.sql
```

---

## 6. Configure Environment Variables

```bash
# Edit the .env file
nano /var/www/rankdseo/.env
```

Update these values for your production domain:

```env
# Database - UPDATE password
DATABASE_URL="postgresql://rankseo:YOUR_STRONG_PASSWORD_HERE@localhost:5432/rankseo"

# Auth - UPDATE both to your domain
NEXTAUTH_URL="https://yourdomain.com"
NEXTAUTH_SECRET="generate-a-new-secret-with-openssl-rand-base64-32"

# App URLs - UPDATE to your domain
NEXT_PUBLIC_APP_URL="https://yourdomain.com"
NEXT_PUBLIC_BASE_URL="https://yourdomain.com"

# Stripe - Keep your existing keys
STRIPE_SECRET_KEY="sk_live_..."
STRIPE_PUBLISHABLE_KEY="pk_live_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Mailgun - Keep your existing keys
MAILGUN_API_KEY="your-key"
MAILGUN_DOMAIN="your-domain"
MAILGUN_REGION="eu"
MAILGUN_FROM_NAME="RankdSEO"
MAILGUN_FROM_EMAIL="your-email"
EMAIL_FROM="your-email"

# PayPal - Keep your existing keys
PAYPAL_CLIENT_ID="your-client-id"
PAYPAL_CLIENT_SECRET="your-secret"
PAYPAL_MODE="live"
PAYPAL_WEBHOOK_ID="your-webhook-id"
NEXT_PUBLIC_PAYPAL_CLIENT_ID="your-client-id"

# CORS - UPDATE to your domain
CORS_ORIGINS="https://yourdomain.com"

# DataForSEO - Keep your existing keys
DATAFORSEO_LOGIN="your-login"
DATAFORSEO_PASSWORD="your-password"
```

Generate a new NEXTAUTH_SECRET:
```bash
openssl rand -base64 32
```

---

## 7. Build the Application

```bash
cd /var/www/rankdseo

# Build Next.js production bundle
yarn build
```

---

## 8. Set Up PM2 Process Manager

```bash
# Create PM2 ecosystem config
cat > /var/www/rankdseo/ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'rankdseo',
    script: 'node_modules/.bin/next',
    args: 'start -p 3000',
    cwd: '/var/www/rankdseo',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    max_memory_restart: '1G',
    instances: 1,
    autorestart: true,
  }]
};
EOF

# Start the app
pm2 start ecosystem.config.js

# Save PM2 config (auto-start on reboot)
pm2 save
pm2 startup
# Run the command it outputs (sudo env PATH=...)
```

---

## 9. Configure Nginx Reverse Proxy

```bash
sudo nano /etc/nginx/sites-available/rankdseo
```

Paste this configuration:

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    client_max_body_size 1G;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 300s;
    }
}
```

Enable and start:

```bash
sudo ln -s /etc/nginx/sites-available/rankdseo /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
```

---

## 10. Set Up SSL (HTTPS)

```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
# Follow the prompts, enter your email, agree to terms
# Certbot auto-renews via cron
```

---

## 11. Set Up Automated Daily Backups (Cron)

The app has a built-in scheduler that runs backups at 3 AM. But for extra safety, set up a system-level cron:

```bash
# Create backup script
sudo nano /var/www/rankdseo/backup-cron.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/var/www/rankdseo/backups"
TIMESTAMP=$(date +%Y-%m-%d_%H-%M)
mkdir -p "$BACKUP_DIR"

# Database dump
pg_dump -U rankseo -h localhost rankseo > "$BACKUP_DIR/db_$TIMESTAMP.sql"

# Compress with source
cd /var/www/rankdseo
tar czf "$BACKUP_DIR/full_backup_$TIMESTAMP.tar.gz" \
  --exclude='node_modules' \
  --exclude='.next' \
  --exclude='.git' \
  --exclude='backups' \
  "$BACKUP_DIR/db_$TIMESTAMP.sql" \
  app/ lib/ prisma/ components/ public/ scripts/ package.json .env

# Remove temp SQL
rm "$BACKUP_DIR/db_$TIMESTAMP.sql"

# Keep last 30 backups
ls -t "$BACKUP_DIR"/full_backup_*.tar.gz | tail -n +31 | xargs rm -f 2>/dev/null
```

```bash
chmod +x /var/www/rankdseo/backup-cron.sh

# Add to crontab (runs daily at 3 AM)
crontab -e
# Add this line:
0 3 * * * /var/www/rankdseo/backup-cron.sh >> /var/log/rankdseo-backup.log 2>&1
```

---

## 12. Update Webhook URLs

After deployment, update these third-party webhook URLs to point to your new domain:

| Service | Where to Update | New URL |
|---------|----------------|---------|
| **Stripe** | [Stripe Dashboard → Webhooks](https://dashboard.stripe.com/webhooks) | `https://yourdomain.com/api/webhooks/stripe` |
| **PayPal** | [PayPal Developer Dashboard](https://developer.paypal.com/dashboard/applications) | `https://yourdomain.com/api/webhooks/paypal` |
| **Google Search Console** | [Search Console](https://search.google.com/search-console) | Re-verify `yourdomain.com` |
| **Google Analytics** | [GA4 Admin](https://analytics.google.com) | Update stream URL |

---

## 13. Firewall Setup

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

---

## Quick Verification Checklist

After deployment, check:

- [ ] `https://yourdomain.com` loads the homepage
- [ ] SSL certificate is valid (padlock icon)
- [ ] Login works with admin credentials
- [ ] Admin panel → Manage Users shows all 736 users
- [ ] Opportunities page loads with pagination
- [ ] Stripe payment flow works
- [ ] PayPal payment flow works
- [ ] Backup system works from admin panel
- [ ] Emails send correctly (switch Mailgun out of sandbox mode)

---

## Useful Commands

```bash
# Check app status
pm2 status

# View app logs
pm2 logs rankdseo

# Restart app
pm2 restart rankdseo

# Rebuild after code changes
cd /var/www/rankdseo && yarn build && pm2 restart rankdseo

# Check database
psql -U rankseo -h localhost -d rankseo -c "SELECT COUNT(*) FROM \"User\";"

# Check Nginx status
sudo systemctl status nginx

# Renew SSL
sudo certbot renew --dry-run
```
