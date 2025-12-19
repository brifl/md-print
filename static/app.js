document.addEventListener("DOMContentLoaded", () => {
  const printButton = document.querySelector(".js-print");
  if (printButton) {
    printButton.addEventListener("click", () => {
      window.print();
    });
  }

  const markdownInput = document.querySelector(".js-markdown");
  const preview = document.querySelector(".js-preview");
  const errorBox = document.querySelector(".js-error");
  const liveToggle = document.querySelector(".js-live-toggle");
  const editorSize = document.querySelector(".js-editor-size");
  const editorSizeValue = document.querySelector(".js-editor-size-value");
  const previewZoom = document.querySelector(".js-preview-zoom");
  const previewZoomValue = document.querySelector(".js-preview-zoom-value");
  const clearButton = document.querySelector(".js-clear");
  const sampleButton = document.querySelector(".js-sample");

  if (!markdownInput || !preview) {
    return;
  }

  const placeholderHtml =
    '<div class="preview-empty">Preview will appear here.</div>';
  const renderEndpoint = "/render";
  let activeController = null;

  const sampleMarkdown = [
    "# Sample Print Sheet",
    "",
    "## Plan",
    "- [ ] Review notes",
    "- [ ] Share updates",
    "",
    "## Notes",
    "This is a quick sample to test headings, lists, and tables.",
    "",
    "| Item | Status |",
    "| --- | --- |",
    "| Draft | In progress |",
    "| Final | Blocked |",
    "",
    "```",
    "console.log(\"Ready to print!\");",
    "```",
  ].join("\n");

  const setPreviewHtml = (html) => {
    const trimmed = (html || "").trim();
    preview.innerHTML = trimmed ? html : placeholderHtml;
  };

  const setError = (message) => {
    if (!errorBox) {
      return;
    }
    if (message) {
      errorBox.textContent = message;
      errorBox.classList.remove("is-hidden");
    } else {
      errorBox.textContent = "";
      errorBox.classList.add("is-hidden");
    }
  };

  const setEditorSize = (value) => {
    const size = Number(value) || 14;
    document.documentElement.style.setProperty("--editor-size", `${size}px`);
    if (editorSizeValue) {
      editorSizeValue.textContent = `${size}px`;
    }
  };

  const setPreviewZoom = (value) => {
    const zoom = Number(value) || 100;
    const scale = zoom / 100;
    document.documentElement.style.setProperty("--preview-zoom", scale);
    if (previewZoomValue) {
      previewZoomValue.textContent = `${zoom}%`;
    }
  };

  const debounce = (fn, delay) => {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), delay);
    };
  };

  const renderPreview = async () => {
    const source = markdownInput.value;
    if (!source.trim()) {
      setPreviewHtml("");
      setError("Paste Markdown to render.");
      return;
    }

    if (activeController) {
      activeController.abort();
    }
    const controller = new AbortController();
    activeController = controller;

    preview.classList.add("is-loading");
    preview.setAttribute("aria-busy", "true");

    try {
      const response = await fetch(renderEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ markdown: source }),
        signal: controller.signal,
      });

      if (!response.ok) {
        let message =
          response.status === 413
            ? "Markdown is too large."
            : "Preview failed to render.";
        const contentType = response.headers.get("content-type") || "";
        if (contentType.includes("application/json")) {
          try {
            const data = await response.json();
            if (data && data.error) {
              message = data.error;
            }
          } catch (error) {
            if (error.name === "AbortError") {
              return;
            }
          }
        }
        setError(message);
        return;
      }

      const data = await response.json();
      setPreviewHtml(data.html || "");
      setError(data.error || "");
    } catch (error) {
      if (error.name !== "AbortError") {
        setError("Preview failed to render.");
      }
    } finally {
      if (activeController === controller) {
        activeController = null;
      }
      preview.classList.remove("is-loading");
      preview.removeAttribute("aria-busy");
    }
  };

  const debouncedRender = debounce(renderPreview, 350);

  if (editorSize) {
    setEditorSize(editorSize.value);
    editorSize.addEventListener("input", () => setEditorSize(editorSize.value));
  }

  if (previewZoom) {
    setPreviewZoom(previewZoom.value);
    previewZoom.addEventListener("input", () => setPreviewZoom(previewZoom.value));
  }

  if (liveToggle) {
    liveToggle.addEventListener("change", () => {
      if (liveToggle.checked) {
        renderPreview();
      }
    });
  }

  markdownInput.addEventListener("input", () => {
    if (liveToggle && liveToggle.checked) {
      debouncedRender();
    }
  });

  if (clearButton) {
    clearButton.addEventListener("click", () => {
      markdownInput.value = "";
      setPreviewHtml("");
      setError("");
      markdownInput.focus();
    });
  }

  if (sampleButton) {
    sampleButton.addEventListener("click", () => {
      markdownInput.value = sampleMarkdown;
      setError("");
      markdownInput.focus();
      if (liveToggle && liveToggle.checked) {
        renderPreview();
      }
    });
  }
});
