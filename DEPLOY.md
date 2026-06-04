# Deploy Repka to production (repka.school)

This stack is designed to **coexist** with the AbuZhuma project on the same
server, behind a shared system nginx + Let's Encrypt. All container ports bind
to `127.0.0.1` only — public traffic comes through nginx by `server_name`.

## Port map (no conflicts with AbuZhuma)

| Service  | AbuZhuma | Repka prod    |
|----------|----------|---------------|
| frontend | :3000    | 127.0.0.1:3006 |
| backend  | :8080    | 127.0.0.1:8086 |
| postgres | :5434    | 127.0.0.1:5436 |
| redis    | :6379    | 127.0.0.1:6382 |
| nginx    | shared   | shared        |

---

## 0. Pre-requisites on the server

- Ubuntu 22.04 / 24.04 (or Debian 12), root or sudo access.
- DNS A/AAAA records for `repka.school` and `www.repka.school` pointing at
  the server's public IP. Verify with `dig +short repka.school`.

## 1. One-time bootstrap

SSH in and run the install script. It is idempotent — safe to re-run.

```bash
# As root (or via sudo).
sudo bash <(curl -fsSL https://raw.githubusercontent.com/AbuZhuma/repka-piar/main/infrastructure/scripts/install-server.sh)
```

Or, after cloning manually:

```bash
sudo git clone https://github.com/AbuZhuma/repka-piar.git /srv/repka
cd /srv/repka
sudo bash infrastructure/scripts/install-server.sh
```

What it does:

1. Installs `nginx`, `certbot`, `docker`, `docker-compose-plugin` (if missing).
2. Creates `/srv/repka`, owned by your user.
3. Copies `.env.production.example` → `.env.production` (you fill secrets).
4. Installs the nginx vhost for `repka.school` (not yet active — needs TLS).
5. Installs a `systemd` unit so the stack restarts on boot.
6. Installs `/usr/local/bin/deploy-repka` which calls the deploy script.

## 2. Fill secrets

```bash
sudoedit /srv/repka/.env.production
```

Replace **all** `change_me_*` values. Generate strong secrets like:

```bash
# Password
openssl rand -base64 24
# JWT_SECRET and IP_HASH_SALT (long, URL-safe)
openssl rand -base64 48
```

## 3. Get a TLS certificate

DNS must already resolve to this server. Then:

```bash
sudo certbot --nginx -d repka.school -d www.repka.school \
  --non-interactive --agree-tos -m admin@repka.school
```

Certbot patches the nginx vhost in place — keep its edits, the included
template already references `/etc/letsencrypt/live/repka.school/`.

## 4. First deploy

```bash
deploy-repka
```

The script will:

1. `git pull origin main`.
2. Build backend + frontend Docker images, tagged with the commit SHA.
3. `docker compose up -d` (postgres + redis + backend + frontend).
4. Apply DB migrations automatically (the backend does it on startup).
5. Wait for `https://repka.school/api/health` to respond 200.
6. Record the tag in `.deploy-tags` so rollback works later.

Verify:

```bash
curl -I https://repka.school
curl  https://repka.school/api/health
```

Default admin credentials are whatever you set in `.env.production`
(`ADMIN_EMAIL` / `ADMIN_PASSWORD`). The backend re-syncs the password from env
on every restart, so you can rotate it by editing env + `deploy-repka --no-build`.

## 5. Day-to-day deploys

After pushing to `main`:

```bash
ssh deploy@repka.school
deploy-repka                 # default: pull main, rebuild, restart
deploy-repka feature-branch  # deploy a specific branch
deploy-repka --no-build      # fast restart with existing images
deploy-repka --rollback      # revert to the previous successful tag
```

The script keeps the last 5 successful image tags so rollback is fast.

## 6. Useful operations

```bash
# Tail logs
docker compose -f /srv/repka/infrastructure/docker-compose.prod.yml \
  --env-file /srv/repka/.env.production logs -f backend frontend

# DB shell
docker compose -f /srv/repka/infrastructure/docker-compose.prod.yml \
  --env-file /srv/repka/.env.production exec postgres \
  psql -U repka -d repka

# Manual stop / start
sudo systemctl stop repka
sudo systemctl start repka
sudo systemctl status repka

# Wipe and restart from scratch (DESTROYS DATA)
sudo systemctl stop repka
docker volume rm repka_postgres_data repka_redis_data repka_uploads_data
sudo systemctl start repka
```

## 7. Coexistence with AbuZhuma

Both projects share the host nginx and Docker. They are isolated by:

- **Ports**: Repka uses 8086/3006/5436/6382. AbuZhuma uses 8080/3000/5434/6379.
- **Docker networks**: Repka has `repka_internal`, AbuZhuma has its own.
- **Volumes**: Named `repka_*` vs `abuzhuma_*` — no collisions.
- **nginx vhosts**: separate files in `/etc/nginx/sites-enabled/`, dispatched by
  `server_name` (repka.school vs abuzhuma.com).
- **Rate-limit zones**: each project's nginx config uses uniquely-prefixed zone
  names (`repka_api`, `abuzhuma_api`).

If you change Repka's port map, update **both**:

- `.env.production` (`BACKEND_HOST_PORT`, `FRONTEND_HOST_PORT`, etc.)
- `infrastructure/nginx/repka.school.conf` (the upstream `server 127.0.0.1:…`
  values).

## 8. Backups (basic)

For now, schedule a daily postgres dump via cron:

```cron
# /etc/cron.d/repka-backup
0 3 * * * deploy docker compose -f /srv/repka/infrastructure/docker-compose.prod.yml --env-file /srv/repka/.env.production exec -T postgres pg_dump -U repka repka | gzip > /srv/repka/backups/db-$(date +\%F).sql.gz
```

(Create `/srv/repka/backups` first and rotate old files with `find -mtime +14 -delete`.)

## 9. Troubleshooting

- **`deploy-repka` fails on health**: tail backend logs with the command above.
  Most often it's a wrong `JWT_SECRET` length (must be ≥ 32 bytes) or a bad
  `DATABASE_URL`.
- **502 from nginx**: containers are down — `systemctl status repka` and
  `docker compose ps` to see what crashed.
- **Frontend serves old API URL**: rebuild the frontend image — Next.js bakes
  `NEXT_PUBLIC_*` at build time. `deploy-repka` (without `--no-build`) handles it.
- **certbot says "port in use"**: nginx must be reloaded with the vhost
  enabled *before* certbot runs.
