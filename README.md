# Markdown Print Preview (No PDF)

A tiny self hosted web app that converts Markdown into print optimized HTML
and immediately hands off to the browser print preview.

No PDFs. No Adobe. No document editing.

## Features

- Paste Markdown
- Instant preview
- One click print
- Works on desktop and iPad
- Cloudflare Tunnel compatible

## Requirements

- Python 3.10+
- Linux (tested on Raspberry Pi)
- A browser with print support

## Install

```bash
git clone https://github.com/yourname/md-print.git
cd md-print
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## Run locally

```bash
python app.py
```

Open:

```text
http://localhost:7070
```

## Always-on systemd service setup on Raspberry Pi

````markdown
## Run on Raspberry Pi with systemd

This is the recommended way to keep the app running across reboots.

Assumptions
- Repo is located at: /home/pi/md-print
- Virtualenv located at: /home/pi/md-print/.venv
- App listens on port 7070 (adjust if you change it)

1. Create the service file

```bash
sudo nano /etc/systemd/system/md-print.service
````

1. Paste the following

```ini
[Unit]
Description=Markdown Print Preview
After=network.target

[Service]
User=pi
WorkingDirectory=/home/pi/md-print
ExecStart=/home/pi/md-print/.venv/bin/python app.py
Restart=always

[Install]
WantedBy=multi-user.target
```

1. Enable and start

```bash
sudo systemctl daemon-reload
sudo systemctl enable md-print
sudo systemctl start md-print
```

1. Check status and logs

```bash
systemctl status md-print
sudo journalctl -u md-print -n 50 --no-pager
```

1. Verify locally

```bash
curl -i http://localhost:7070/ | head -n 20
```

## Cloudflare Tunnel

Bind the service in your tunnel config:

```yaml
ingress:
  - hostname: md-print.example.com
    service: http://localhost:7070
  - service: http_status:404
```

Restart your tunnel and access via your public hostname.

## Cloudflare Tunnel routing (Published application routes)

This project works well behind a Cloudflare Tunnel. If you manage routes in the Cloudflare dashboard, you must add the hostname here or Cloudflare will return 404 from the tunnel catch all rule.

1. Open Cloudflare Zero Trust dashboard
2. Go to Network, then Connectors
3. Click your tunnel name
4. Click Edit
5. Open the Published application routes tab
6. Click Add a published application route
7. Set:
   - Hostname: print.yourdomain.com
   - Service: <http://localhost:7070>
   - Path: *
8. Save

Notes

- If you also maintain ingress rules in /etc/cloudflared/config.yml, be aware that dashboard managed routes can override expectations. When troubleshooting a 404, always confirm the hostname exists under Published application routes for the tunnel.

## Using the app (from anywhere)

### Basic print from Markdown

- Click Print
- Select your physical printer
- Use browser margins set to default or none
