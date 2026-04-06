document.addEventListener("DOMContentLoaded", () => {
  const STORAGE_KEY = "onboardaApplication";

  function getApplication() {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  }

  function saveApplication(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  function buildAISignal(docKey, doc) {
    const labelMap = {
      certificate: "Certificate of Incorporation",
      memorandum: "Memorandum of Association",
      shareholders: "Shareholder Register",
      directors: "Register of Directors",
      passport: "Passport / Government ID",
      proofOfAddress: "Proof of Address",
      cvLinkedin: "CV / LinkedIn",
      additional: "Additional Supporting Documents"
    };

    const signal = {
      label: labelMap[docKey] || docKey,
      status: doc?.status || "pending",
      confidence: doc?.confidence || 0,
      description: "Awaiting upload or processing"
    };

    if (doc?.status === "verified") {
      signal.description = "Detected, extracted, and matched successfully";
    } else if (doc?.status === "review") {
      signal.description = "Potential mismatch or low-confidence check";
    }

    return signal;
  }

  function renderSignalList() {
    const app = getApplication();
    const signalList = document.querySelector(".signal-list");
    if (!app || !signalList) return;

    signalList.innerHTML = "";

    Object.entries(app.documents).forEach(([key, doc]) => {
      if (!doc.uploaded) return;

      const signal = buildAISignal(key, doc);

      const row = document.createElement("div");
      row.className = "signal-item";

      const textWrap = document.createElement("div");

      const strong = document.createElement("strong");
      strong.textContent = signal.label;

      const desc = document.createElement("p");
      desc.textContent = signal.description;

      textWrap.appendChild(strong);
      textWrap.appendChild(desc);

      const chip = document.createElement("span");
      chip.className = "status-chip";

      if (signal.status === "verified") {
        chip.classList.add("success");
        chip.textContent = `${signal.confidence}%`;
      } else if (signal.status === "review") {
        chip.classList.add("warning");
        chip.textContent = "Review";
      } else {
        chip.classList.add("muted");
        chip.textContent = "Pending";
      }

      row.appendChild(textWrap);
      row.appendChild(chip);
      signalList.appendChild(row);
    });
  }

  function updateChecklist() {
    const app = getApplication();
    const checklistItems = document.querySelectorAll(".checklist-item input");
    if (!app || checklistItems.length < 5) return;

    const requiredDocs = [
      "certificate",
      "memorandum",
      "shareholders",
      "directors",
      "passport",
      "proofOfAddress",
      "cvLinkedin"
    ];

    const uploadedRequired = requiredDocs.every(
      (key) => app.documents[key] && app.documents[key].uploaded
    );

    const reviewCount = Object.values(app.documents).filter(
      (doc) => doc.uploaded && doc.status === "review"
    ).length;

    checklistItems[0].checked = true;
    checklistItems[1].checked = true;
    checklistItems[2].checked = uploadedRequired;
    checklistItems[3].checked = reviewCount === 0;
  }

  function updateHeaderProgress() {
    const app = getApplication();
    const progressValue = document.querySelector(".progress-top strong");
    const progressFill = document.querySelector(".progress-fill");

    if (!app || !progressValue || !progressFill) return;

    const docs = app.documents;
    const requiredDocs = [
      "certificate",
      "memorandum",
      "shareholders",
      "directors",
      "passport",
      "proofOfAddress",
      "cvLinkedin"
    ];

    const uploadedCount = requiredDocs.filter(
      (key) => docs[key] && docs[key].uploaded
    ).length;

    const progress = Math.round((uploadedCount / requiredDocs.length) * 100);
    app.progress = progress;

    saveApplication(app);

    progressValue.textContent = `${progress}%`;
    progressFill.style.width = `${progress}%`;
  }

  function attachDeclarationHandlers() {
    const declarationChecks = document.querySelectorAll(".declaration-row input");
    const submitButton = Array.from(document.querySelectorAll(".card-actions .btn"))
      .find((btn) => btn.textContent.includes("Submit Documents"));

    if (!declarationChecks.length || !submitButton) return;

    function refreshSubmitState() {
      const allChecked = Array.from(declarationChecks).every((input) => input.checked);
      submitButton.style.opacity = allChecked ? "1" : "0.6";
      submitButton.style.pointerEvents = allChecked ? "auto" : "none";
    }

    declarationChecks.forEach((input) => {
      input.addEventListener("change", refreshSubmitState);
    });

    refreshSubmitState();
  }

  updateHeaderProgress();
  renderSignalList();
  updateChecklist();
  attachDeclarationHandlers();
});
