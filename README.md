# Markdown Print Preview (No PDF)

A tiny self-hosted web app that converts Markdown into print-friendly HTML
and hands off to the browser print preview.

No PDFs. No Adobe. No document editing.

## Features

- Paste Markdown
- Instant preview
- One-click print
- Task lists and footnotes
- Works on desktop and iPad
- Cloudflare Tunnel friendly

## Requirements

- Python 3.10+
- A browser with print support
- Linux/macOS/Windows (tested on Raspberry Pi)

## Quickstart

```bash
git clone https://github.com/yourname/md-print.git
cd md-print
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python app.py
```

Open:

```text
http://127.0.0.1:54443
```

Windows notes:

- Activate the venv with `.venv\Scripts\activate`
- Use `python app.py`

## Configuration

Environment variables:

| Variable | Default | Description |
| --- | --- | --- |
| `MD_PRINT_HOST` | `127.0.0.1` | Host interface to bind |
| `MD_PRINT_PORT` | `54443` | Port to listen on |
| `MD_PRINT_MAX_CONTENT_LENGTH` | `1000000` | Max request size in bytes |
| `MD_PRINT_ALLOW_HTML` | `false` | Allow raw HTML in input (still sanitized) |

Notes:

- Raw HTML is disabled by default and sanitized even when enabled.
- For LAN or Cloudflare Tunnel access, set `MD_PRINT_HOST=0.0.0.0`.

## Usage

1. Paste Markdown
2. Click Render
3. Click Print

Print styling lives in `static/print.css`.

## Hosting

### systemd (Linux / Raspberry Pi)

Create the service file:

```bash
sudo nano /etc/systemd/system/md-print.service
```

Paste the following:

```ini
[Unit]
Description=Markdown Print Preview
After=network.target

[Service]
User=pi
WorkingDirectory=/home/pi/md-print
Environment=MD_PRINT_HOST=0.0.0.0
Environment=MD_PRINT_PORT=54443
ExecStart=/home/pi/md-print/.venv/bin/python app.py
Restart=always

[Install]
WantedBy=multi-user.target
```

Enable and start:

```bash
sudo systemctl daemon-reload
sudo systemctl enable md-print
sudo systemctl start md-print
```

Check status and logs:

```bash
systemctl status md-print
sudo journalctl -u md-print -n 50 --no-pager
```

Verify locally:

```bash
curl -i http://localhost:54443/ | head -n 20
```

### Cloudflare Tunnel

Bind the service in your tunnel config:

```yaml
ingress:
  - hostname: md-print.example.com
    service: http://localhost:54443
  - service: http_status:404
```

If you manage routes in the Cloudflare dashboard, add the hostname under
Published application routes or Cloudflare will return 404 from the catch-all
rule.

## Security notes

- This app has no authentication. Keep it on a trusted network or put it
  behind Cloudflare Access or another gateway.
- Rendered HTML is sanitized to strip scripts and unsafe attributes.
- Request size is limited via `MD_PRINT_MAX_CONTENT_LENGTH`.

## Tests

```bash
pip install -r requirements-dev.txt
python -m pytest
```
