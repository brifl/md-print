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
  const previewStage = document.querySelector(".js-preview-stage");
  const pageStack = document.querySelector(".js-page-stack");
  const settingsDrawer = document.querySelector(".js-settings-drawer");
  const settingsToggle = document.querySelector(".js-settings-toggle");
  const settingsCloseButtons = Array.from(
    document.querySelectorAll(".js-settings-close"),
  );
  const settingsReset = document.querySelector(".js-settings-reset");
  const densityButtons = Array.from(
    document.querySelectorAll(".js-density-button"),
  );
  const paperSize = document.querySelector(".js-paper-size");
  const printMargin = document.querySelector(".js-print-margin");
  const printMarginValue = document.querySelector(".js-print-margin-value");
  const printWidth = document.querySelector(".js-print-width");
  const printWidthValue = document.querySelector(".js-print-width-value");
  const printCodeSize = document.querySelector(".js-print-code-size");
  const printCodeSizeValue = document.querySelector(".js-print-code-size-value");
  const printTablePadding = document.querySelector(".js-print-table-padding");
  const printTablePaddingValue = document.querySelector(
    ".js-print-table-padding-value",
  );
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
    "# Markdown Cheatsheet",
    "",
    "## Text",
    "- **Bold**, *italic*, ***both***",
    "- ~~Strikethrough~~",
    "- Inline `code`",
    "- Autolink: https://example.com",
    "- Link: [Example](https://example.com)",
    "",
    "## Lists",
    "1. Ordered item",
    "2. Ordered item",
    "   1. Nested ordered",
    "- Unordered item",
    "  - Nested unordered",
    "",
    "## Task list",
    "- [ ] Draft",
    "- [x] Done",
    "",
    "## Blockquote",
    "> Tip: Blockquotes work with **formatting** too.",
    "",
    "## Table",
    "| Feature | Syntax |",
    "| --- | --- |",
    "| Bold | `**bold**` |",
    "| Strike | `~~text~~` |",
    "| Code | `code` |",
    "",
    "## Code block",
    "```python",
    "def greet(name):",
    "    return 'Hello, ' + name",
    "```",
    "",
    "## Footnote",
    "Here is a footnote reference.[^1]",
    "",
    "[^1]: Footnote text with a [link](https://example.com).",
    "",
    "---",
    "",
    "### Next steps",
    "Paste your Markdown and hit Render or toggle Live preview.",
  ].join("\n");

  const measurementProbe = document.createElement("div");
  measurementProbe.style.position = "absolute";
  measurementProbe.style.visibility = "hidden";
  measurementProbe.style.pointerEvents = "none";
  measurementProbe.style.height = "0";
  measurementProbe.style.width = "0";
  document.body.appendChild(measurementProbe);

  const getCssVar = (name) =>
    getComputedStyle(document.documentElement).getPropertyValue(name).trim();

  const measureCssLength = (value) => {
    if (!value) {
      return 0;
    }
    measurementProbe.style.width = value;
    return measurementProbe.getBoundingClientRect().width;
  };

  const pageStyleTag = document.createElement("style");
  pageStyleTag.setAttribute("data-page-style", "true");
  document.head.appendChild(pageStyleTag);

  const updatePagedPreview = () => {
    if (!preview || !pageStack || !previewStage) {
      return;
    }
    const pageHeight = measureCssLength(getCssVar("--page-height")) || 0;
    const margin = measureCssLength(getCssVar("--print-margin")) || 0;
    const usableHeight = pageHeight - margin * 2;
    if (!pageHeight || usableHeight <= 0) {
      previewStage.classList.remove("is-paged");
      return;
    }

    const contentHeight = preview.scrollHeight || 0;
    const pageCount = Math.max(1, Math.ceil(contentHeight / usableHeight));
    const sourceHtml = preview.innerHTML;

    pageStack.innerHTML = "";
    for (let i = 0; i < pageCount; i += 1) {
      const page = document.createElement("div");
      page.className = "page";

      const slice = document.createElement("div");
      slice.className = "page-slice";
      const contentOffset = i * usableHeight;

      const contentWrapper = document.createElement("div");
      contentWrapper.className = "page-content";
      contentWrapper.style.transform = `translateY(-${contentOffset}px)`;

      const content = document.createElement("div");
      content.className = "print-area";
      content.innerHTML = sourceHtml;

      contentWrapper.appendChild(content);
      slice.appendChild(contentWrapper);
      page.appendChild(slice);
      pageStack.appendChild(page);
    }

    previewStage.classList.add("is-paged");
  };

  const schedulePagedPreview = (() => {
    let frame;
    return () => {
      if (frame) {
        cancelAnimationFrame(frame);
      }
      frame = requestAnimationFrame(() => {
        frame = null;
        updatePagedPreview();
      });
    };
  })();

  const setPreviewHtml = (html) => {
    const trimmed = (html || "").trim();
    preview.innerHTML = trimmed ? html : placeholderHtml;
    schedulePagedPreview();
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

  const paperSizes = {
    letter: { width: "8.5in", height: "11in" },
    a4: { width: "8.27in", height: "11.69in" },
    legal: { width: "8.5in", height: "14in" },
  };
  const defaultPaperKey = paperSize?.value || "letter";
  let currentPageSize = paperSizes[defaultPaperKey] || paperSizes.letter;
  let currentMargin = printMargin?.getAttribute("value") || "0.75";

  const updatePageStyle = () => {
    pageStyleTag.textContent = `@page { size: ${currentPageSize.width} ${currentPageSize.height}; margin: ${currentMargin}in; }`;
  };

  const setPaperSize = (value) => {
    const key = paperSizes[value] ? value : "letter";
    const { width, height } = paperSizes[key];
    document.documentElement.style.setProperty("--page-width", width);
    document.documentElement.style.setProperty("--page-height", height);
    currentPageSize = paperSizes[key];
    updatePageStyle();
    if (paperSize) {
      paperSize.value = key;
    }
    schedulePagedPreview();
  };

  const setPrintMargin = (value) => {
    const margin = Number(value) || 0.75;
    document.documentElement.style.setProperty("--print-margin", `${margin}in`);
    if (printMarginValue) {
      printMarginValue.textContent = `${margin}in`;
    }
    currentMargin = String(margin);
    updatePageStyle();
    schedulePagedPreview();
  };

  const densityPresets = {
    compact: { lineHeight: 1.25, paragraphSpacing: 0.55, headingSpacing: 0.7 },
    normal: { lineHeight: 1.4, paragraphSpacing: 0.75, headingSpacing: 0.9 },
    roomy: { lineHeight: 1.6, paragraphSpacing: 1.0, headingSpacing: 1.2 },
  };
  const defaultDensity =
    densityButtons.find((button) => button.classList.contains("is-active"))
      ?.dataset.density || "normal";
  const defaultPrintSettings = {
    density: defaultDensity,
    paper: paperSize?.value || "letter",
    margin: printMargin?.getAttribute("value") || "0.75",
    width: printWidth?.getAttribute("value") || "7",
    codeSize: printCodeSize?.getAttribute("value") || "9",
    tablePadding: printTablePadding?.getAttribute("value") || "4",
  };

  const applyDensity = (key) => {
    const preset = densityPresets[key] || densityPresets.normal;
    document.documentElement.style.setProperty(
      "--print-line-height",
      preset.lineHeight,
    );
    document.documentElement.style.setProperty(
      "--print-paragraph-spacing",
      `${preset.paragraphSpacing}em`,
    );
    document.documentElement.style.setProperty(
      "--print-heading-spacing",
      `${preset.headingSpacing}em`,
    );
    densityButtons.forEach((button) => {
      const isActive = button.dataset.density === key;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-pressed", isActive ? "true" : "false");
    });
    schedulePagedPreview();
  };

  const setPrintWidth = (value) => {
    const width = Number(value) || 7;
    document.documentElement.style.setProperty("--print-width", `${width}in`);
    if (printWidthValue) {
      printWidthValue.textContent = `${width}in`;
    }
    schedulePagedPreview();
  };

  const setPrintCodeSize = (value) => {
    const size = Number(value) || 9;
    document.documentElement.style.setProperty("--print-code-size", `${size}pt`);
    if (printCodeSizeValue) {
      printCodeSizeValue.textContent = `${size}pt`;
    }
    schedulePagedPreview();
  };

  const setPrintTablePadding = (value) => {
    const vertical = Number(value) || 4;
    const horizontal = vertical + 2;
    document.documentElement.style.setProperty(
      "--print-table-padding-y",
      `${vertical}px`,
    );
    document.documentElement.style.setProperty(
      "--print-table-padding-x",
      `${horizontal}px`,
    );
    if (printTablePaddingValue) {
      printTablePaddingValue.textContent = `${vertical}px / ${horizontal}px`;
    }
    schedulePagedPreview();
  };

  const openSettings = () => {
    if (!settingsDrawer || !settingsToggle) {
      return;
    }
    settingsDrawer.dataset.open = "true";
    settingsDrawer.setAttribute("aria-hidden", "false");
    settingsToggle.setAttribute("aria-expanded", "true");
  };

  const closeSettings = () => {
    if (!settingsDrawer || !settingsToggle) {
      return;
    }
    settingsDrawer.dataset.open = "false";
    settingsDrawer.setAttribute("aria-hidden", "true");
    settingsToggle.setAttribute("aria-expanded", "false");
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

    const loadingTarget = previewStage || preview;
    loadingTarget.classList.add("is-loading");
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
      loadingTarget.classList.remove("is-loading");
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

  const resetPrintSettings = () => {
    applyDensity(defaultPrintSettings.density);
    if (paperSize) {
      paperSize.value = defaultPrintSettings.paper;
      setPaperSize(paperSize.value);
    }
    if (printMargin) {
      printMargin.value = defaultPrintSettings.margin;
      setPrintMargin(printMargin.value);
    }
    if (printWidth) {
      printWidth.value = defaultPrintSettings.width;
      setPrintWidth(printWidth.value);
    }
    if (printCodeSize) {
      printCodeSize.value = defaultPrintSettings.codeSize;
      setPrintCodeSize(printCodeSize.value);
    }
    if (printTablePadding) {
      printTablePadding.value = defaultPrintSettings.tablePadding;
      setPrintTablePadding(printTablePadding.value);
    }
  };

  if (densityButtons.length) {
    densityButtons.forEach((button) => {
      button.addEventListener("click", () => {
        applyDensity(button.dataset.density);
      });
    });
    applyDensity(defaultPrintSettings.density);
  }

  if (paperSize) {
    setPaperSize(paperSize.value);
    paperSize.addEventListener("change", () => setPaperSize(paperSize.value));
  }

  if (printMargin) {
    setPrintMargin(printMargin.value);
    printMargin.addEventListener("input", () =>
      setPrintMargin(printMargin.value),
    );
  }

  if (printWidth) {
    setPrintWidth(printWidth.value);
    printWidth.addEventListener("input", () => setPrintWidth(printWidth.value));
  }

  if (printCodeSize) {
    setPrintCodeSize(printCodeSize.value);
    printCodeSize.addEventListener("input", () =>
      setPrintCodeSize(printCodeSize.value),
    );
  }

  if (printTablePadding) {
    setPrintTablePadding(printTablePadding.value);
    printTablePadding.addEventListener("input", () =>
      setPrintTablePadding(printTablePadding.value),
    );
  }

  if (settingsToggle && settingsDrawer) {
    settingsToggle.addEventListener("click", () => {
      if (settingsDrawer.dataset.open === "true") {
        closeSettings();
      } else {
        openSettings();
      }
    });
  }

  settingsCloseButtons.forEach((button) => {
    button.addEventListener("click", () => closeSettings());
  });

  if (settingsReset) {
    settingsReset.addEventListener("click", resetPrintSettings);
  }

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && settingsDrawer?.dataset.open === "true") {
      closeSettings();
    }
  });

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

  window.addEventListener("resize", schedulePagedPreview);
  schedulePagedPreview();
});
