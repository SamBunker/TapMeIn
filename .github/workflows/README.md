# GitHub Actions Workflows

This directory contains GitHub Actions workflows for automated deployment.

## Available Workflows

### 1. `deploy-portainer.yml` - Simple Deployment
**Use this for**: Basic webhook trigger

**Features**:
- ✅ Triggers Portainer webhook on push to main
- ✅ Simple and straightforward
- ✅ Basic health check

**Usage**: Automatically runs on push to `main` branch

---

### 2. `deploy-portainer-secure.yml` - Secure Deployment (Recommended)
**Use this for**: Production deployment with secrets

**Features**:
- ✅ Hides webhook URL in GitHub Secrets
- ✅ Commit information logging
- ✅ Retry logic for health checks
- ✅ Deployment verification
- ✅ Better error handling

**Setup Required**:
1. Go to repository **Settings** → **Secrets and variables** → **Actions**
2. Add new secret:
   - **Name**: `PORTAINER_WEBHOOK_URL`
   - **Value**: `http://192.168.0.148:9000/api/stacks/webhooks/203560cc-cdf9-48b4-83df-aae57dbd6572`

**Usage**: Automatically runs on push to `main` branch

---

### 3. `deploy-portainer-advanced.yml` - Advanced Deployment
**Use this for**: Full production with monitoring

**Features**:
- ✅ Pre-deployment health check
- ✅ Post-deployment verification
- ✅ Smoke tests
- ✅ Detailed logging
- ✅ Manual trigger support
- ✅ Skip health check option
- ✅ Timeout protection
- ✅ Ignores documentation changes

**Usage**:
- **Automatic**: Runs on push to `main` (ignores `.md` file changes)
- **Manual**: Go to **Actions** tab → **Deploy to Portainer (Advanced)** → **Run workflow**

---

## Setup Instructions

### 1. Configure Self-Hosted Runner

Your workflow uses `runs-on: self-hosted`, which requires a GitHub Actions runner on your local machine.

**Install GitHub Actions Runner** (on your machine at 192.168.0.148):

```bash
# 1. Go to your GitHub repository
# 2. Settings → Actions → Runners → New self-hosted runner
# 3. Follow the setup instructions for Windows/Linux

# For Windows (PowerShell):
# Download and extract the runner
mkdir actions-runner; cd actions-runner
Invoke-WebRequest -Uri https://github.com/actions/runner/releases/download/v2.311.0/actions-runner-win-x64-2.311.0.zip -OutFile actions-runner-win-x64-2.311.0.zip
Add-Type -AssemblyName System.IO.Compression.FileSystem
[System.IO.Compression.ZipFile]::ExtractToDirectory("$PWD/actions-runner-win-x64-2.311.0.zip", "$PWD")

# Configure the runner
./config.cmd --url https://github.com/YOUR-USERNAME/TapMeIn --token YOUR-TOKEN

# Run the runner
./run.cmd

# Or install as a service (recommended)
./svc.sh install
./svc.sh start
```

---

### 2. Add GitHub Secrets (Recommended)

**For secure deployment**:

1. Go to repository: **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**
3. Add:
   - **Name**: `PORTAINER_WEBHOOK_URL`
   - **Value**: `http://192.168.0.148:9000/api/stacks/webhooks/203560cc-cdf9-48b4-83df-aae57dbd6572`

---

### 3. Enable Workflows

All workflows are enabled by default. You can disable individual workflows:

1. Go to **Actions** tab
2. Select the workflow
3. Click **⋯** → **Disable workflow**

---

## Testing Your Setup

### Test 1: Manual Trigger
1. Go to **Actions** tab
2. Select **Deploy to Portainer (Advanced)**
3. Click **Run workflow**
4. Watch the logs

### Test 2: Push to Main
```bash
git add .
git commit -m "test: trigger deployment"
git push origin main
```

Watch the deployment in **Actions** tab.

### Test 3: Verify Webhook
```bash
# Test webhook manually
curl -X POST http://192.168.0.148:9000/api/stacks/webhooks/203560cc-cdf9-48b4-83df-aae57dbd6572
```

---

## Workflow Comparison

| Feature | Simple | Secure | Advanced |
|---------|--------|--------|----------|
| Webhook trigger | ✅ | ✅ | ✅ |
| Health check | Basic | Retry logic | Full verification |
| Secrets support | ❌ | ✅ | ✅ |
| Pre-deploy check | ❌ | ❌ | ✅ |
| Smoke tests | ❌ | ❌ | ✅ |
| Manual trigger | ✅ | ✅ | ✅ (with options) |
| Commit info | ❌ | ✅ | ✅ |
| Detailed logging | ❌ | ✅ | ✅ |
| Timeout protection | ❌ | ✅ | ✅ |
| Ignores docs | ❌ | ❌ | ✅ |

---

## Troubleshooting

### Workflow not triggering
**Check**:
- Push is to `main` branch
- Workflow file has no syntax errors
- Actions are enabled in repository settings

### Webhook fails
**Check**:
- Portainer is accessible from runner machine
- Webhook URL is correct
- Network allows connection to 192.168.0.148:9000

### Health check fails
**Check**:
- Container is running: `docker ps | grep tapmeinnfc`
- Port 3001 is accessible
- Check logs: `docker logs tapmeinnfc-app-prod`

### Runner offline
**Check**:
- Runner service is running
- GitHub connection is active
- Runner token hasn't expired

---

## Recommended Setup

For production, use this configuration:

1. **Use**: `deploy-portainer-advanced.yml`
2. **Delete or disable**: Other workflow files
3. **Add secrets**: `PORTAINER_WEBHOOK_URL`
4. **Configure runner**: As a service
5. **Test**: Manual trigger first

---

## Example Deployment Flow

```
Developer pushes to main
    ↓
GitHub Actions triggers
    ↓
Workflow checks current health
    ↓
Triggers Portainer webhook
    ↓
Portainer pulls new image
    ↓
Portainer restarts stack
    ↓
Workflow waits 60 seconds
    ↓
Workflow checks health endpoint
    ↓
Workflow runs smoke tests
    ↓
✅ Deployment complete!
```

---

## Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Self-hosted Runners](https://docs.github.com/en/actions/hosting-your-own-runners)
- [Portainer Webhooks](https://docs.portainer.io/user/docker/stacks/webhooks)

---

**Questions?** Check the main [DEPLOYMENT.md](../../DEPLOYMENT.md) or [PORTAINER_QUICK_START.md](../../PORTAINER_QUICK_START.md)
