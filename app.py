import os
from dataclasses import dataclass

import bleach
from flask import Flask, render_template, request
from markdown_it import MarkdownIt
from mdit_py_plugins.footnote import footnote_plugin
from mdit_py_plugins.tasklists import tasklists_plugin

DEFAULT_HOST = "127.0.0.1"
DEFAULT_PORT = 7070
DEFAULT_MAX_CONTENT_LENGTH = 1_000_000
DEFAULT_ALLOW_HTML = False

ALLOWED_TAGS = [
    "a",
    "abbr",
    "b",
    "blockquote",
    "br",
    "code",
    "del",
    "em",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "hr",
    "i",
    "img",
    "input",
    "li",
    "ol",
    "p",
    "pre",
    "section",
    "strong",
    "sub",
    "sup",
    "table",
    "tbody",
    "td",
    "th",
    "thead",
    "tr",
    "ul",
]
ALLOWED_ATTRIBUTES = {
    "*": ["class", "id"],
    "a": ["href", "title"],
    "img": ["src", "alt", "title"],
    "input": ["type", "checked", "disabled"],
    "td": ["colspan", "rowspan"],
    "th": ["colspan", "rowspan"],
}
ALLOWED_PROTOCOLS = ["http", "https", "mailto"]


@dataclass(frozen=True)
class Settings:
    host: str = DEFAULT_HOST
    port: int = DEFAULT_PORT
    max_content_length: int = DEFAULT_MAX_CONTENT_LENGTH
    allow_html: bool = DEFAULT_ALLOW_HTML


def _env_bool(name: str, default: bool) -> bool:
    raw = os.getenv(name)
    if raw is None:
        return default
    normalized = raw.strip().lower()
    if normalized in {"1", "true", "yes", "on"}:
        return True
    if normalized in {"0", "false", "no", "off"}:
        return False
    return default


def _env_int(name: str, default: int) -> int:
    raw = os.getenv(name)
    if raw is None:
        return default
    try:
        value = int(raw)
    except ValueError:
        return default
    return value if value > 0 else default


def load_settings() -> Settings:
    return Settings(
        host=os.getenv("MD_PRINT_HOST", DEFAULT_HOST),
        port=_env_int("MD_PRINT_PORT", DEFAULT_PORT),
        max_content_length=_env_int(
            "MD_PRINT_MAX_CONTENT_LENGTH",
            DEFAULT_MAX_CONTENT_LENGTH,
        ),
        allow_html=_env_bool("MD_PRINT_ALLOW_HTML", DEFAULT_ALLOW_HTML),
    )


def build_markdown(allow_html: bool) -> MarkdownIt:
    md = MarkdownIt("commonmark", {"html": allow_html, "linkify": True})
    md.use(footnote_plugin).use(tasklists_plugin)
    return md


def sanitize_html(html: str) -> str:
    return bleach.clean(
        html,
        tags=ALLOWED_TAGS,
        attributes=ALLOWED_ATTRIBUTES,
        protocols=ALLOWED_PROTOCOLS,
        strip=True,
    )


def create_app(settings: Settings | None = None) -> Flask:
    settings = settings or load_settings()
    app = Flask(__name__)
    app.config["MAX_CONTENT_LENGTH"] = settings.max_content_length
    app.config["MD_PRINT_HOST"] = settings.host
    app.config["MD_PRINT_PORT"] = settings.port
    app.config["MD_PRINT_ALLOW_HTML"] = settings.allow_html

    md = build_markdown(settings.allow_html)

    @app.after_request
    def add_security_headers(response):
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Referrer-Policy"] = "no-referrer"
        response.headers["Content-Security-Policy"] = (
            "default-src 'self'; "
            "img-src 'self' https: http:; "
            "style-src 'self'; "
            "script-src 'self'; "
            "base-uri 'self'; "
            "form-action 'self'; "
            "frame-ancestors 'none'"
        )
        return response

    @app.errorhandler(413)
    def request_too_large(_):
        limit_kb = max(1, settings.max_content_length // 1024)
        return (
            render_template(
                "index.html",
                rendered_html="",
                source="",
                error=f"Markdown is too large. Limit is {limit_kb} KB.",
            ),
            413,
        )

    @app.route("/", methods=["GET", "POST"])
    def index():
        rendered_html = ""
        source = ""
        error = None

        if request.method == "POST":
            source = request.form.get("markdown", "")
            if not source.strip():
                error = "Paste Markdown to render."
            else:
                rendered_html = sanitize_html(md.render(source))

        return render_template(
            "index.html",
            rendered_html=rendered_html,
            source=source,
            error=error,
        )

    return app


app = create_app()


if __name__ == "__main__":
    app.run(
        host=app.config["MD_PRINT_HOST"],
        port=app.config["MD_PRINT_PORT"],
        debug=False,
    )
