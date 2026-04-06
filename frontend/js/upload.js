document.addEventListener("DOMContentLoaded", () => {
  const STORAGE_KEY = "onboardaApplication";

  const documentFieldMap = [
    "certificate",
    "memorandum",
    "shareholders",
    "directors",
    "passport",
    "proofOfAddress",
    "cvLinkedin",
    "additional"
  ];

  function getApplication() {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  }

  function saveApplication(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  function normaliseFileName(fileName) {
    return fileName.toLowerCase().replace(/[^a-z0-9]/g, "");
  }

  function detectStatusFromName(fileName) {
    const clean = normaliseFileName(fileName);

    if (
      clean.includes("certificate") ||
      clean.includes("incorporation") ||
      clean.includes("passport") ||
      clean.includes("nationalid") ||
      clean.includes("governmentid") ||
      clean.includes("memorandum") ||
      clean.includes("directorregister")
    ) {
      return { status: "verified", confidence: 95 };
    }

    if (
      clean.includes("address") ||
      clean.includes("utility") ||
      clean.includes("shareholder") ||
      clean.includes("ownership") ||
      clean.includes("structure") ||
      clean.includes("boardresolution")
    ) {
      return { status: "review", confidence: 74 };
    }

    return { status: "pending", confidence: 60 };
  }

  function evaluateFiles(files) {
    if (!files.length) {
      return { status: "pending", confidence: 0 };
    }

    const results = files.map((file) => detectStatusFromName(file.name));

    const hasReview = results.some((item) => item.status === "review");
    const hasPending = results.some((item) => item.status === "pending");
    const averageConfidence = Math.round(
      results.reduce((sum, item) => sum + item.confidence, 0) / results.length
    );

    if (hasReview) {
      return { status: "review", confidence: averageConfidence };
    }

    if (hasPending) {
      return { status: "pending", confidence: averageConfidence };
    }

    return { status: "verified", confidence: averageConfidence };
  }

  function getOrCreateFileList(card) {
    let fileList = card.querySelector(".uploaded-file-list");

    if (!fileList) {
      fileList = document.createElement("div");
      fileList.className = "uploaded-file-list";
      card.appendChild(fileList);
    }

    return fileList;
  }

  function renderUploadedFiles(card, files) {
    const fileList = getOrCreateFileList(card);
    fileList.innerHTML = "";

    if (!files.length) {
      const empty = document.createElement("small");
      empty.className = "uploaded-file-name";
      empty.textContent = "No files uploaded yet";
      fileList.appendChild(empty);
      return;
    }

    files.forEach((fileName, index) => {
      const item = document.createElement("small");
      item.className = "uploaded-file-name";
      item.textContent = `${index + 1}. ${fileName}`;
      fileList.appendChild(item);
    });
  }

  function updateUploadCard(card, files, result) {
    let statusEl = card.querySelector(".ai-status");

    if (!statusEl) {
      statusEl = document.createElement("div");
      statusEl.className = "ai-status";
      card.appendChild(statusEl);
    }

    statusEl.classList.remove("success", "warning", "pending");

    if (result.status === "verified") {
      statusEl.classList.add("success");
      statusEl.textContent = `✔ Verified · ${result.confidence}%`;
    } else if (result.status === "review") {
      statusEl.classList.add("warning");
      statusEl.textContent = `⚠ Needs review · ${result.confidence}%`;
    } else {
      statusEl.classList.add("pending");
      statusEl.textContent = result.confidence
        ? `Pending · ${result.confidence}%`
        : "Pending";
    }

    renderUploadedFiles(card, files.map((file) => file.name || file));
  }

  function syncStoredFilesToUI() {
    const app = getApplication();
    if (!app) return;

    const inputs = document.querySelectorAll('.upload-card input[type="file"]');

    inputs.forEach((input, index) => {
      const fieldKey = documentFieldMap[index] || "additional";
      const doc = app.documents?.[fieldKey];
      const card = input.closest(".upload-card");

      if (!card || !doc) return;

      const storedFiles = Array.isArray(doc.files) ? doc.files : [];
      const result = {
        status: doc.status || "pending",
        confidence: doc.confidence || 0
      };

      updateUploadCard(card, storedFiles, result);
    });
  }

  function attachUploadHandlers() {
    const inputs = document.querySelectorAll('.upload-card input[type="file"]');
    const app = getApplication();
    if (!inputs.length || !app) return;

    inputs.forEach((input, index) => {
      input.addEventListener("change", (event) => {
        const selectedFiles = Array.from(event.target.files || []);
        if (!selectedFiles.length) return;

        const fieldKey = documentFieldMap[index] || "additional";
        const card = input.closest(".upload-card");
        const result = evaluateFiles(selectedFiles);

        if (!app.documents[fieldKey]) {
          app.documents[fieldKey] = {};
        }

        const existingFiles = Array.isArray(app.documents[fieldKey].files)
          ? app.documents[fieldKey].files
          : [];

        const newFiles = selectedFiles.map((file) => ({
          name: file.name,
          size: file.size,
          type: file.type
        }));

        const mergedFiles = [...existingFiles, ...newFiles];

        app.documents[fieldKey] = {
          uploaded: true,
          status: result.status,
          confidence: result.confidence,
          fileName: mergedFiles[0]?.name || "",
          files: mergedFiles
        };

        saveApplication(app);
        updateUploadCard(card, mergedFiles, result);

        document.dispatchEvent(new CustomEvent("onboarda:documentsUpdated"));
      });
    });
  }

  attachUploadHandlers();
  syncStoredFilesToUI();
});
