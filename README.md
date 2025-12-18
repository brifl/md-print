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

## Cloudflare Tunnel

Bind the service in your tunnel config:

```yaml
ingress:
  - hostname: md-print.example.com
    service: http://localhost:54443
  - service: http_status:404
```

Restart your tunnel and access via your public hostname.

## Printing

- Click Print
- Select your physical printer
- Use browser margins set to default or none