# Portainer Quick Start Guide

Quick guide to deploy TapMeIn on Portainer in 5 minutes.

## Step 1: Prepare Your Environment Variables

Before deploying, generate secure secrets:

```bash
# On Linux/Mac or Windows WSL, run:
openssl rand -base64 64

# Or use an online generator:
# https://randomkeygen.com/
```

## Step 2: Access Portainer

1. Navigate to your Portainer instance
2. Select your environment (usually "local")
3. Go to **Stacks** → **Add stack**

## Step 3: Create the Stack

### Option A: Upload Files

1. **Name**: `tapmeinnfc`
2. Click **Upload** and select `docker-compose.portainer.yml`
3. Skip to Step 4

### Option B: Paste Compose File

1. **Name**: `tapmeinnfc`
2. Click **Web editor**
3. Paste the contents of `docker-compose.portainer.yml`

## Step 4: Configure Environment Variables

Click **Add an environment variable** and add these (at minimum):

### Required Variables

| Variable | Example Value | Description |
|----------|---------------|-------------|
| `MONGO_USERNAME` | `admin` | MongoDB username |
| `MONGO_PASSWORD` | `SecurePass123!` | MongoDB password (change this!) |
| `JWT_SECRET` | `[64-char random string]` | JWT signing secret |
| `JWT_REFRESH_SECRET` | `[64-char random string]` | Refresh token secret |
| `SESSION_SECRET` | `[64-char random string]` | Session secret |
| `BASE_URL` | `https://tapmeinnfc.com` | Your domain |
| `ADMIN_EMAIL` | `admin@example.com` | Admin email |
| `ADMIN_PASSWORD` | `ChangeMe123!` | Admin password |

### Optional Variables (for full features)

| Variable | Example | Description |
|----------|---------|-------------|
| `STRIPE_SECRET_KEY` | `sk_live_...` | Stripe payments |
| `SENDGRID_API_KEY` | `SG....` | Email service |
| `TWILIO_ACCOUNT_SID` | `AC...` | SMS service |
| `IPINFO_API_KEY` | `abc123` | Geolocation |

## Step 5: Deploy

1. Scroll down and click **Deploy the stack**
2. Wait 1-2 minutes for containers to start
3. Check container status - all should show "running"

## Step 6: Verify Deployment

### Check Health

```bash
curl http://your-server-ip:3000/api/health
```

Expected response:
```json
{
  "status": "OK",
  "timestamp": "2025-10-03T...",
  "environment": "production"
}
```

### Access the Application

Open browser: `http://your-server-ip:3000`

You should see the TapMeIn login page.

### Login as Admin

- Email: Your `ADMIN_EMAIL` value
- Password: Your `ADMIN_PASSWORD` value

**IMPORTANT**: Change the admin password immediately after first login!

## Step 7: Configure SSL (Production)

For production use, add a reverse proxy with SSL:

### Using Nginx Proxy Manager (Recommended for Portainer)

1. In Portainer, install **Nginx Proxy Manager** from App Templates
2. Access NPM at `http://your-server-ip:81`
3. Add a new proxy host:
   - **Domain**: `tapmeinnfc.com`
   - **Forward Hostname**: `tapmeinnfc-app-prod` (or container name)
   - **Forward Port**: `3000`
   - **SSL**: Request Let's Encrypt certificate

### Using Traefik Labels

Edit your stack and add to the `app` service:

```yaml
labels:
  - "traefik.enable=true"
  - "traefik.http.routers.tapmeinnfc.rule=Host(`tapmeinnfc.com`)"
  - "traefik.http.routers.tapmeinnfc.entrypoints=websecure"
  - "traefik.http.routers.tapmeinnfc.tls.certresolver=letsencrypt"
```

## Troubleshooting

### Container Keeps Restarting

1. Go to **Containers** → Click on `tapmeinnfc-app-prod`
2. Click **Logs**
3. Look for error messages

Common issues:
- Missing environment variables
- MongoDB connection failed
- Invalid secrets

### Can't Access Application

1. Check container is running: **Containers** tab
2. Check port mapping: Should show `3000:3000`
3. Check firewall: Ensure port 3000 is open
4. Check health: Container should show "healthy" status

### Database Connection Error

1. Ensure `mongodb` container is running
2. Check `MONGO_USERNAME` and `MONGO_PASSWORD` match
3. View MongoDB logs: **Containers** → `tapmeinnfc-mongo-prod` → **Logs**

## Managing Your Deployment

### View Logs

1. **Containers** → Select container
2. Click **Logs**
3. Enable **Auto-refresh** to see live logs

### Update Application

1. **Stacks** → Select `tapmeinnfc`
2. Click **Editor**
3. Toggle **Re-pull image and redeploy**
4. Click **Update the stack**

### Backup Database

1. **Containers** → `tapmeinnfc-mongo-prod`
2. Click **Console** → Connect to `/bin/bash`
3. Run backup command:
   ```bash
   mongodump -u admin -p your-password --authenticationDatabase admin -d tapmeinnfc -o /tmp/backup
   ```
4. Copy to host via **Volumes** tab

### Scale for High Traffic

1. **Stacks** → `tapmeinnfc` → **Editor**
2. Add under the `app` service:
   ```yaml
   deploy:
     replicas: 3
   ```
3. Update the stack

## Environment Variables Reference

### Minimal Production Setup

```
MONGO_USERNAME=admin
MONGO_PASSWORD=your-secure-password
MONGO_DATABASE=tapmeinnfc
JWT_SECRET=generate-64-char-random-string
JWT_REFRESH_SECRET=generate-64-char-random-string
SESSION_SECRET=generate-64-char-random-string
BASE_URL=https://tapmeinnfc.com
ADMIN_EMAIL=admin@tapmeinnfc.com
ADMIN_PASSWORD=secure-password
```

### Full Production Setup

Add to the above:

```
# Email (SendGrid)
SENDGRID_API_KEY=your-key
FROM_EMAIL=noreply@tapmeinnfc.com

# SMS (Twilio)
TWILIO_ACCOUNT_SID=your-sid
TWILIO_AUTH_TOKEN=your-token
TWILIO_PHONE_NUMBER=+1234567890

# Payments (Stripe)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Features
ENABLE_SMS=true
ENABLE_WEBHOOKS=true
```

## Next Steps

1. ✅ Change admin password
2. ✅ Configure SSL certificate
3. ✅ Set up email service (SendGrid)
4. ✅ Configure Stripe for payments
5. ✅ Set up automated backups
6. ✅ Configure monitoring/alerts

## Support

- **Logs**: Check container logs in Portainer
- **Health**: `http://your-ip:3000/api/health`
- **Database**: Use Portainer console to access MongoDB

## Security Checklist

- [ ] Changed default admin password
- [ ] Generated strong secrets (64+ characters)
- [ ] Configured SSL/HTTPS
- [ ] Firewall configured (only 80/443 exposed)
- [ ] Database password is strong
- [ ] Regular backup schedule configured
- [ ] Monitoring/alerts configured

---

**Ready to go!** Your TapMeIn instance should now be running and accessible.
