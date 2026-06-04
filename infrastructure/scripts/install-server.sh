#!/usr/bin/env bash
# One-time server bootstrap for repka.school.
#
# Idempotent — safe to re-run. Run on a fresh Ubuntu 22.04/24.04 (or Debian 12)
# server as a user with sudo. Expects to run *alongside* the existing AbuZhuma
# stack: it never overwrites that project's nginx vhost, only adds repka.school.
#
# Usage:
#   curl -fsSL https://raw.githubusercontent.com/<owner>/<repo>/main/infrastructure/scripts/install-server.sh | bash
# Or, after cloning the repo:
#   sudo bash infrastructure/scripts/install-server.sh
#
# What it does:
#   1. apt update + install nginx, certbot, docker (if missing), git
#   2. create /srv/repka, set ownership
#   3. clone or update the repo
#   4. copy .env.production.example → .env.production if absent (and prompt to edit)
#   5. install nginx vhost (does NOT enable yet — needs TLS certs first)
#   6. install systemd unit so the stack restarts on boot
#   7. print the next steps (certbot, env edit, deploy)

set -euo pipefail

REPO_URL="${REPO_URL:-https://github.com/CHANGE_ME/repka-piar.git}"
APP_DIR="${APP_DIR:-/srv/repka}"
APP_USER="${APP_USER:-${SUDO_USER:-$USER}}"
DOMAIN="${DOMAIN:-repka.school}"
DEPLOY_BIN="${DEPLOY_BIN:-/usr/local/bin/deploy-repka}"

require_root() {
    if [ "$(id -u)" -ne 0 ]; then
        echo "This script must be run as root (use sudo)." >&2
        exit 1
    fi
}

log() { printf '\033[1;32m==>\033[0m %s\n' "$*"; }
warn() { printf '\033[1;33m[!] %s\033[0m\n' "$*"; }

require_root

log "Updating apt and installing base packages"
apt-get update -y
apt-get install -y \
    ca-certificates curl gnupg lsb-release \
    nginx certbot python3-certbot-nginx \
    git ufw

if ! command -v docker >/dev/null 2>&1; then
    log "Installing Docker Engine"
    install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    chmod a+r /etc/apt/keyrings/docker.gpg
    cat >/etc/apt/sources.list.d/docker.list <<EOF
deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable
EOF
    apt-get update -y
    apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    systemctl enable --now docker
fi

log "Adding $APP_USER to the docker group"
usermod -aG docker "$APP_USER" || true

log "Preparing $APP_DIR (owned by $APP_USER)"
mkdir -p "$APP_DIR"
chown -R "$APP_USER":"$APP_USER" "$APP_DIR"

if [ ! -d "$APP_DIR/.git" ]; then
    log "Cloning repo into $APP_DIR"
    sudo -u "$APP_USER" git clone "$REPO_URL" "$APP_DIR"
else
    log "Repo already present at $APP_DIR — pulling latest"
    sudo -u "$APP_USER" git -C "$APP_DIR" fetch --all --prune
fi

log "Setting up .env.production (if missing)"
if [ ! -f "$APP_DIR/.env.production" ]; then
    cp "$APP_DIR/.env.production.example" "$APP_DIR/.env.production"
    chmod 600 "$APP_DIR/.env.production"
    chown "$APP_USER":"$APP_USER" "$APP_DIR/.env.production"
    warn "Created $APP_DIR/.env.production from the example — EDIT IT before deploying:"
    warn "  - POSTGRES_PASSWORD, JWT_SECRET, IP_HASH_SALT, ADMIN_PASSWORD"
fi

log "Installing nginx vhost for $DOMAIN"
install -m 0644 "$APP_DIR/infrastructure/nginx/repka.school.conf" "/etc/nginx/sites-available/$DOMAIN.conf"
if [ ! -L "/etc/nginx/sites-enabled/$DOMAIN.conf" ]; then
    ln -sf "/etc/nginx/sites-available/$DOMAIN.conf" "/etc/nginx/sites-enabled/$DOMAIN.conf"
fi

log "Installing systemd unit so the stack restarts on boot"
install -m 0644 "$APP_DIR/infrastructure/systemd/repka.service" "/etc/systemd/system/repka.service"
sed -i "s|@APP_USER@|$APP_USER|g; s|@APP_DIR@|$APP_DIR|g" /etc/systemd/system/repka.service
systemctl daemon-reload
systemctl enable repka.service

log "Installing /usr/local/bin/deploy-repka shim"
cat >"$DEPLOY_BIN" <<EOF
#!/usr/bin/env bash
exec sudo -u "$APP_USER" "$APP_DIR/infrastructure/scripts/deploy-repka.sh" "\$@"
EOF
chmod +x "$DEPLOY_BIN"

cat <<EOF

----------------------------------------------------------------------
Bootstrap complete.

Next steps:

1. Edit secrets:
     sudoedit $APP_DIR/.env.production

2. Issue Let's Encrypt cert (DNS must already point at this server):
     sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN \\
       --non-interactive --agree-tos -m admin@$DOMAIN

3. First deploy:
     deploy-repka

4. Verify:
     curl -I https://$DOMAIN

5. (Optional) Firewall:
     sudo ufw allow OpenSSH
     sudo ufw allow 'Nginx Full'
     sudo ufw enable

The stack will auto-restart on reboot (systemctl status repka).
----------------------------------------------------------------------
EOF
