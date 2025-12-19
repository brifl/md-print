from app import Settings, create_app, load_settings, sanitize_html


def make_client(settings: Settings | None = None):
    app = create_app(settings or Settings())
    app.config["TESTING"] = True
    return app.test_client()


def test_load_settings_defaults(monkeypatch):
    for name in [
        "MD_PRINT_HOST",
        "MD_PRINT_PORT",
        "MD_PRINT_MAX_CONTENT_LENGTH",
        "MD_PRINT_ALLOW_HTML",
    ]:
        monkeypatch.delenv(name, raising=False)

    settings = load_settings()

    assert settings.host == "127.0.0.1"
    assert settings.port == 54443
    assert settings.max_content_length == 1_000_000
    assert settings.allow_html is False


def test_load_settings_overrides(monkeypatch):
    monkeypatch.setenv("MD_PRINT_HOST", "0.0.0.0")
    monkeypatch.setenv("MD_PRINT_PORT", "9090")
    monkeypatch.setenv("MD_PRINT_MAX_CONTENT_LENGTH", "2048")
    monkeypatch.setenv("MD_PRINT_ALLOW_HTML", "true")

    settings = load_settings()

    assert settings.host == "0.0.0.0"
    assert settings.port == 9090
    assert settings.max_content_length == 2048
    assert settings.allow_html is True


def test_load_settings_invalid_values_fall_back(monkeypatch):
    monkeypatch.setenv("MD_PRINT_PORT", "nope")
    monkeypatch.setenv("MD_PRINT_MAX_CONTENT_LENGTH", "-12")
    monkeypatch.setenv("MD_PRINT_ALLOW_HTML", "maybe")

    settings = load_settings()

    assert settings.port == 54443
    assert settings.max_content_length == 1_000_000
    assert settings.allow_html is False


def test_sanitize_html_strips_dangerous_content():
    html = (
        '<p>ok</p>'
        '<script>alert(1)</script>'
        '<a href="javascript:alert(1)">x</a>'
        '<img src="https://example.com/x.png" onerror="alert(1)">'
    )
    cleaned = sanitize_html(html)

    assert "<p>ok</p>" in cleaned
    assert "<script>" not in cleaned
    assert "javascript:" not in cleaned
    assert "onerror" not in cleaned


def test_get_index_returns_page_with_headers():
    client = make_client()
    response = client.get("/")

    assert response.status_code == 200
    assert response.headers["X-Content-Type-Options"] == "nosniff"
    assert response.headers["X-Frame-Options"] == "DENY"
    assert response.headers["Referrer-Policy"] == "no-referrer"
    assert "default-src 'self'" in response.headers["Content-Security-Policy"]


def test_post_renders_markdown():
    client = make_client()
    response = client.post("/", data={"markdown": "# Title"})

    assert response.status_code == 200
    page = response.get_data(as_text=True)
    assert "<h1>" in page
    assert "Title" in page


def test_empty_markdown_shows_error():
    client = make_client()
    response = client.post("/", data={"markdown": "   "})

    assert response.status_code == 200
    page = response.get_data(as_text=True)
    assert "Paste Markdown to render." in page


def test_request_too_large_returns_413():
    client = make_client(Settings(max_content_length=100))
    response = client.post("/", data={"markdown": "x" * 1000})

    assert response.status_code == 413
    page = response.get_data(as_text=True)
    assert "Markdown is too large." in page


def test_allow_html_still_sanitizes():
    client = make_client(Settings(allow_html=True))
    response = client.post(
        "/",
        data={"markdown": "<b>ok</b><script>alert(1)</script>"},
    )

    assert response.status_code == 200
    page = response.get_data(as_text=True)
    assert "<b>ok</b>" in page
    assert "<script>" not in page
