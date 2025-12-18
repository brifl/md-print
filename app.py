from flask import Flask, render_template, request
from markdown_it import MarkdownIt
from mdit_py_plugins.footnote import footnote_plugin
from mdit_py_plugins.tasklists import tasklists_plugin

app = Flask(__name__)

md = (
    MarkdownIt("commonmark", {"html": True})
    .use(footnote_plugin)
    .use(tasklists_plugin)
)

@app.route("/", methods=["GET", "POST"])
def index():
    rendered_html = ""
    source = ""

    if request.method == "POST":
        source = request.form.get("markdown", "")
        rendered_html = md.render(source)

    return render_template(
        "index.html",
        rendered_html=rendered_html,
        source=source
    )

if __name__ == "__main__":
    # Bind to all interfaces so Cloudflare Tunnel can reach it
    app.run(host="0.0.0.0", port=54443, debug=False)
