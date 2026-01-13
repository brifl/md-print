# AGENTS.md

## Project summary

- Small Flask app that renders Markdown to print-friendly HTML and relies on the browser print dialog (no PDF generation).
- All UI is static HTML/CSS/JS; no build tooling or frontend framework.
- Security: rendered HTML is always sanitized with Bleach; raw HTML in Markdown is off by default and still sanitized when enabled.

## Key entry points

- `app.py`: Flask app factory, markdown rendering, sanitization, routes, and security headers.
- `templates/index.html`: single page template for editor, preview, and settings UI.
- `static/app.js`: client logic for live preview, print settings, paging preview, and UI actions.
- `static/print.css`: all styling (screen + print), CSS variables used by JS for print settings.

## Request flow

- `GET /`: renders `templates/index.html` with empty preview.
- `POST /`: form submission; renders Markdown server-side and returns the same template.
- `POST /render`: JSON endpoint used by live preview; returns `{ html, error }`.
- Request size limit via Flask `MAX_CONTENT_LENGTH`; 413 handler returns JSON if `request.is_json` else HTML.

## Markdown + sanitization

- Markdown parser: `MarkdownIt` with `footnote_plugin`, `tasklists_plugin`, and `table` + `strikethrough` enabled.
- Sanitization: `sanitize_html()` in `app.py` uses Bleach with allowlists:
  - `ALLOWED_TAGS`, `ALLOWED_ATTRIBUTES`, `ALLOWED_PROTOCOLS`.
  - If you add new HTML output or attributes, update allowlists and tests.

## Frontend behavior

- `static/app.js` binds to `.js-*` class hooks. If you change class names in `templates/index.html`, update JS.
- Print settings (paper size, margins, density, etc.) are CSS variables set on `:root` and updated by JS.
- The preview uses a "paged" mode by duplicating content into stacked pages for on-screen visualization; print mode uses the real content.
- CSP in `app.py` only allows self-hosted scripts/styles. Adding external assets requires CSP updates.

## Configuration

- Environment variables (defaults in `app.py`):
  - `MD_PRINT_HOST` (default `127.0.0.1`)
  - `MD_PRINT_PORT` (default `54443`)
  - `MD_PRINT_MAX_CONTENT_LENGTH` (default `1000000`)
  - `MD_PRINT_ALLOW_HTML` (default `false`)

## Tests

- `pytest` only. Tests live in `tests/test_app.py`.
- `tests/conftest.py` adds repo root to `sys.path` for imports.
- Run: `python -m pytest` (requires `requirements-dev.txt`).

## Deployment scripts

- `deploy.sh`: activates a venv, installs requirements, restarts a systemd service.
- `run-deploy.sh`: pulls the configured branch and runs `deploy.sh`.

## Common change areas

- UI/print layout changes: `static/print.css` and CSS variables in `static/app.js`.
- Markdown output changes: update `build_markdown()` and `sanitize_html()` in `app.py`.
- New settings controls: add inputs in `templates/index.html`, wiring in `static/app.js`, and CSS variable usage in `static/print.css`.
