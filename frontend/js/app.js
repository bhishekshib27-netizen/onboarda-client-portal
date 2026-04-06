document.addEventListener("DOMContentLoaded", () => {
  const STORAGE_KEY = "onboardaApplication";

  const defaultApplication = {
    companyName: "FinRisk Insights",
    reference: "ARF-2026-100426",
    email: "bhishekshib27@gmail.com",
    stage: "KYC Documents",
    progress: 68,
    risk: "Low",
    aiReviewStatus: "Pending",
    aiChecksPending: 2,
    documents: {
      certificate: { uploaded: true, status: "verified", confidence: 98 },
      memorandum: { uploaded: true, status: "verified", confidence: 95 },
      shareholders: { uploaded: true, status: "review", confidence: 72 },
      directors: { uploaded: false, status: "pending", confidence: 0 },
      passport: { uploaded: true, status: "verified", confidence: 95 },
      proofOfAddress: { uploaded: true, status: "review", confidence: 69 },
      cvLinkedin: { uploaded: false, status: "pending", confidence: 0 },
      additional: { uploaded: false, status: "pending", confidence: 0 }
    },
    activity: [
      {
        icon: "📧",
        title: "KYC documents requested",
        description: "FinRisk Insights",
        date: "6 Apr"
      },
      {
        icon: "🤖",
        title: "AI classified uploaded files",
        description: "Verification signals generated",
        date: "6 Apr"
      }
    ]
  };

  function getApplication() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultApplication));
      return { ...defaultApplication };
    }

    try {
      return JSON.parse(saved);
    } catch (error) {
      console.error("Invalid local storage data. Resetting.", error);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultApplication));
      return { ...defaultApplication };
    }
  }

  function saveApplication(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  function calculateProgress(documents) {
    const requiredKeys = [
      "certificate",
      "memorandum",
      "shareholders",
      "directors",
      "passport",
      "proofOfAddress",
      "cvLinkedin"
    ];

    const uploadedCount = requiredKeys.filter(
      (key) => documents[key] && documents[key].uploaded
    ).length;

    return Math.round((uploadedCount / requiredKeys.length) * 100);
  }

  function getStatusText(status) {
    if (status === "verified") return "Verified";
    if (status === "review") return "Review";
    return "Pending";
  }

  function updateDashboardUI() {
    const app = getApplication();

    const progressFill = document.querySelector(".progress-fill");
    const progressValue = document.querySelector(".progress-top strong");

    if (progressFill) {
      progressFill.style.width = `${app.progress}%`;
    }

    if (progressValue) {
      progressValue.textContent = `${app.progress}%`;
    }

    const summaryBoxes = document.querySelectorAll(".summary-box strong");
    if (summaryBoxes.length >= 4) {
      summaryBoxes[0].textContent = app.reference;
      summaryBoxes[1].textContent = app.companyName;
      summaryBoxes[2].textContent = app.stage;
      summaryBoxes[3].textContent = app.risk;
    }

    const statValues = document.querySelectorAll(".stat-value");
    if (statValues.length >= 4) {
      statValues[3].textContent = app.aiReviewStatus;
    }

    const signals = document.querySelectorAll(".signal-item");
    const docEntries = [
      ["Certificate of Incorporation", app.documents.certificate],
      ["Director ID", app.documents.passport],
      ["Proof of Address", app.documents.proofOfAddress],
      ["Ownership Structure", app.documents.shareholders]
    ];

    signals.forEach((item, index) => {
      const entry = docEntries[index];
      if (!entry) return;

      const [label, doc] = entry;
      const title = item.querySelector("strong");
      const desc = item.querySelector("p");
      const chip = item.querySelector(".status-chip");

      if (title) title.textContent = label;
      if (desc) {
        desc.textContent =
          doc.status === "verified"
            ? "Detected and accepted"
            : doc.status === "review"
            ? "Requires analyst review"
            : "Awaiting upload or processing";
      }

      if (chip) {
        chip.textContent =
          doc.status === "verified" ? `${doc.confidence}%` : getStatusText(doc.status);

        chip.classList.remove("success", "warning", "muted");
        if (doc.status === "verified") chip.classList.add("success");
        else if (doc.status === "review") chip.classList.add("warning");
        else chip.classList.add("muted");
      }
    });
  }

  function bindSignupForm() {
    const form = document.querySelector(".auth-form");
    if (!form) return;

    form.addEventListener("submit", (event) => {
      event.preventDefault();

      const firstName = document.getElementById("firstName")?.value?.trim() || "";
      const lastName = document.getElementById("lastName")?.value?.trim() || "";
      const workEmail = document.getElementById("workEmail")?.value?.trim() || "";

      const app = getApplication();
      app.email = workEmail || app.email;
      app.applicantName = `${firstName} ${lastName}`.trim();

      saveApplication(app);
      window.location.href = "./dashboard.html";
    });
  }

  function updateDocumentProgressFromStorage() {
    const app = getApplication();
    app.progress = calculateProgress(app.documents);

    const hasReview = Object.values(app.documents).some(
      (doc) => doc.uploaded && doc.status === "review"
    );

    app.aiReviewStatus = hasReview ? "Pending" : "Clear";
    app.aiChecksPending = Object.values(app.documents).filter(
      (doc) => doc.uploaded && doc.status === "review"
    ).length;

    saveApplication(app);
  }

  bindSignupForm();
  updateDocumentProgressFromStorage();
  updateDashboardUI();
});
