# Personal site

Bilingual, dependency-free static site. Russian: `/`, English: `/en/`.
The GitHub profile README is intentionally unchanged.

## Editing and checking

Edit copy and project links in `build_site.py`, then run:

```sh
python3 build_site.py
node --check script.js
python3 -m http.server 31006 --bind 127.0.0.1
```

`styles.css` is handwritten; no bundler, formatter, or linter is configured.
The layout uses a white background, neutral grays, system fonts, and one text
column. No remote fonts, decorative effects, or animation dependencies are used.
Only About, Projects, and Contact are public; the introductory blog is removed.
`script.js` preserves section anchors when switching languages and saves the
selected language in localStorage. Fresh visits to `/` restore English if chosen;
explicit `/en/` links remain accessible. Without JavaScript or storage, both
static routes and the ordinary language link still work (preference persistence
requires storage and JavaScript).

Run `node check-site.cjs` against the preview on port 31006 (not the live service).
Override `SITE_URL` or `PLAYWRIGHT_MODULE` via environment variables when needed.
Checks cover both languages at 1440, 768, 390, and 320 pixels, content, metadata,
anchor targets, keyboard navigation, language persistence, and storage/JS fallbacks.
Screenshots go in the ignored `artifacts/review/` directory.

Project copy was checked against GitHub source, not inferred from project names:
- Kinetics App: `rust/src/integrate.rs`, `frontend/src/compute/worker.ts`, and the
  React frontend. This repository currently has no root README.
- unc_tools: README, `unc_tools/unc_regression.py`, and `default_functions.py`.
- LeafView: README, `Cargo.toml`, and `src/main.rs` (PDF navigation, zoom, watchers).

Editing and previewing do not publish changes. Use the existing asset-copy step
below only when deployment is requested; no infrastructure changes are needed.

## Hosting

```
HTTPS savateykin.ru
  -> Caddy on Frankfurt
  -> private Docker bridge 172.19.0.1:18092
  -> systemd socket proxy to Frankfurt 127.0.0.1:18092
  -> reverse SSH tunnel
  -> local 127.0.0.1:31005
```

Only public assets are served from `/home/yaroslav/services/savateykin/public`.
The Git checkout and its `.git` directory are NOT served.
No analytics, remote fonts, or third-party JavaScript are loaded.

Local user units:
- `~/.config/systemd/user/savateykin-site.service`
- `~/.config/systemd/user/savateykin-tunnel.service`

Frankfurt units:
- `/etc/systemd/system/savateykin-proxy.socket`
- `/etc/systemd/system/savateykin-proxy.service`

All are enabled for startup, with restart behavior; user lingering is enabled.
The local machine must remain powered on and connected for the tunnel to work.

Publish updated assets:

```sh
python3 build_site.py
# Save the previous public assets outside the document root before publishing.
backup="/home/yaroslav/services/savateykin/backups/$(date -u +%Y%m%dT%H%M%SZ)"
mkdir -p "$backup"
cp -a /home/yaroslav/services/savateykin/public/. "$backup/"
cp index.html styles.css script.js favicon.svg robots.txt sitemap.xml /home/yaroslav/services/savateykin/public/
cp en/index.html /home/yaroslav/services/savateykin/public/en/
```

Caddy configuration: `/root/services/caddy/Caddyfile` on Frankfurt.
Backup before the domain switch:
`/root/services/caddy/Caddyfile.before-savateykin-20261029-062655`.
Only the apex route was changed. `eleven.savateykin.ru` retains its original
upstream. Other applications and their existing tunnels were not restarted.

## Rollback

For an asset-only release, copy the saved backup files back into
`/home/yaroslav/services/savateykin/public/`; no service restart is required.
The infrastructure rollback below is only needed when retiring the hosting setup.

Restore ONLY the `savateykin.ru` route to its previous upstream
`172.19.0.1:18081`, then validate and reload Caddy. The dated backup records the
previous configuration; don't blindly restore it after unrelated later changes.
Stop and disable the two local `savateykin-*` user services and the Frankfurt
`savateykin-proxy.socket` if retiring this site. No shared tunnel needs changes.
