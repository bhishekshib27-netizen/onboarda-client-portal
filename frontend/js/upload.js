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
      clean.includes("id")
    ) {
      return { status: "verified", confidence: 95 };
    }

    if (
      clean.includes("address") ||
      clean.includes("utility") ||
      clean.includes("shareholder") ||
      clean.includes("ownership")
    ) {
      return { status: "review", confidence: 74 };
    }

    return { status: "pending", confidence: 60 };
  }

  function updateUploadCard(card, file, result) {
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
      statusEl.textContent = `Pending · ${result.confidence}%`;
    }

    let fileLabel = card.querySelector(".uploaded-file-name");
    if (!fileLabel) {
      fileLabel = document.createElement("small");
      fileLabel.className = "uploaded-file-name";
      fileLabel.style.color = "#94a3b8";
      fileLabel.style.marginTop = "4px";
      card.appendChild(fileLabel);
    }

    fileLabel.textContent = `Uploaded: ${file.name}`;
  }

  function attachUploadHandlers() {
    const inputs = document.querySelectorAll('.upload-card input[type="file"]');
    const app = getApplication();
    if (!inputs.length || !app) return;

    inputs.forEach((input, index) => {
      input.addEventListener("change", (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const fieldKey = documentFieldMap[index] || "additional";
        const result = detectStatusFromName(file.name);

        if (!app.documents[fieldKey]) {
          app.documents[fieldKey] = {};
        }

        app.documents[fieldKey] = {
          uploaded: true,
          status: result.status,
          confidence: result.confidence,
          fileName: file.name
        };

        saveApplication(app);
        updateUploadCard(input.closest(".upload-card"), file, result);
      });
    });
  }

  attachUploadHandlers();
});
