const STORAGE_KEY = "applications";
const LEGACY_STATUS_MAP = {
  "\u00c0 postuler": "To apply",
  "Envoy\u00e9e": "Sent",
  Relance: "Follow-up",
  Entretien: "Interview",
  Refus: "Rejected",
  "Accept\u00e9e": "Accepted",
  Tous: "All",
};
const ACTIVE_STATUSES = ["To apply", "Sent", "Follow-up", "Interview"];
const POSITIVE_STATUSES = ["Interview", "Accepted"];

const form = document.getElementById("applicationForm");
const applicationsList = document.getElementById("applicationsList");
const companyInput = document.getElementById("company");
const positionInput = document.getElementById("position");
const offerLinkInput = document.getElementById("offerLink");
const applicationDateInput = document.getElementById("applicationDate");
const statusInput = document.getElementById("status");
const notesInput = document.getElementById("notes");
const searchInput = document.getElementById("searchInput");
const statusFilter = document.getElementById("statusFilter");
const resetFiltersButton = document.getElementById("resetFiltersButton");
const formHeading = document.getElementById("formHeading");
const formIntro = document.getElementById("formIntro");
const formModeBadge = document.getElementById("formModeBadge");
const submitButton = document.getElementById("submitButton");
const cancelEditButton = document.getElementById("cancelEditButton");
const resultsSummary = document.getElementById("resultsSummary");
const tableInsight = document.getElementById("tableInsight");
const todayLabel = document.getElementById("todayLabel");
const heroInsight = document.getElementById("heroInsight");
const activePipelineCount = document.getElementById("activePipelineCount");
const positiveRate = document.getElementById("positiveRate");
const totalCount = document.getElementById("totalCount");
const toApplyCount = document.getElementById("toApplyCount");
const sentCount = document.getElementById("sentCount");
const followUpCount = document.getElementById("followUpCount");
const interviewCount = document.getElementById("interviewCount");
const rejectedCount = document.getElementById("rejectedCount");
const acceptedCount = document.getElementById("acceptedCount");

let applications = loadApplications();
let editIndex = null;

setTodayLabel();
setFormMode(false);
displayApplications();

form.addEventListener("submit", function (event) {
  event.preventDefault();

  const application = {
    company: companyInput.value.trim(),
    position: positionInput.value.trim(),
    offerLink: offerLinkInput.value.trim(),
    applicationDate: applicationDateInput.value,
    status: normalizeStatus(statusInput.value),
    notes: notesInput.value.trim(),
  };

  if (editIndex === null) {
    applications.push(application);
  } else {
    applications[editIndex] = application;
  }

  saveApplications();
  resetFormState();
  displayApplications();
});

searchInput.addEventListener("input", displayApplications);
statusFilter.addEventListener("change", displayApplications);

resetFiltersButton.addEventListener("click", function () {
  searchInput.value = "";
  statusFilter.value = "All";
  displayApplications();
  searchInput.focus();
});

cancelEditButton.addEventListener("click", function () {
  resetFormState();
});

applicationsList.addEventListener("click", function (event) {
  const actionButton = event.target.closest("button[data-action]");

  if (!actionButton) {
    return;
  }

  const index = Number(actionButton.dataset.index);
  const action = actionButton.dataset.action;

  if (action === "edit") {
    editApplication(index);
    return;
  }

  if (action === "delete") {
    deleteApplication(index);
  }
});

function displayApplications() {
  applicationsList.innerHTML = "";

  const searchText = searchInput.value.trim().toLowerCase();
  const selectedStatus = normalizeStatus(statusFilter.value);

  const filteredApplications = applications
    .map(function (application, index) {
      return { application, index };
    })
    .filter(function (entry) {
      const application = entry.application;
      const matchesSearch =
        application.company.toLowerCase().includes(searchText) ||
        application.position.toLowerCase().includes(searchText) ||
        application.notes.toLowerCase().includes(searchText);

      const matchesStatus =
        selectedStatus === "All" || application.status === selectedStatus;

      return matchesSearch && matchesStatus;
    });

  updateStats();
  updateDashboardCopy(filteredApplications.length, searchText, selectedStatus);

  if (!filteredApplications.length) {
    renderEmptyState(searchText, selectedStatus);
    return;
  }

  filteredApplications.forEach(function (entry) {
    applicationsList.appendChild(createApplicationRow(entry.application, entry.index));
  });
}

function createApplicationRow(application, index) {
  const row = document.createElement("tr");

  row.appendChild(createCompanyCell(application.company));
  row.appendChild(createTextCell("Role", application.position));
  row.appendChild(createTextCell("Date", formatDate(application.applicationDate)));
  row.appendChild(createStatusCell(application.status));
  row.appendChild(createNotesCell(application.notes));
  row.appendChild(createOfferCell(application.offerLink));
  row.appendChild(createActionsCell(index));

  return row;
}

function createCompanyCell(company) {
  const cell = createCell("Company", "company-cell");
  const title = document.createElement("strong");

  title.textContent = company;

  cell.appendChild(title);

  return cell;
}

function createTextCell(label, value, className) {
  const cell = createCell(label, className);
  cell.textContent = value;
  return cell;
}

function createStatusCell(status) {
  const cell = createCell("Status");
  const badge = document.createElement("span");

  badge.className = "status-pill " + getStatusClass(status);
  badge.textContent = status;

  cell.appendChild(badge);
  return cell;
}

function createNotesCell(notes) {
  const cell = createCell("Notes", "notes-cell");
  cell.textContent = notes || "No notes added";

  if (!notes) {
    cell.classList.add("table-muted");
  }

  return cell;
}

function createOfferCell(link) {
  const cell = createCell("Job post");

  if (!link) {
    const emptyLink = document.createElement("span");
    emptyLink.className = "table-muted";
    emptyLink.textContent = "Not added";
    cell.appendChild(emptyLink);
    return cell;
  }

  const anchor = document.createElement("a");
  anchor.className = "offer-link";
  anchor.href = link;
  anchor.target = "_blank";
  anchor.rel = "noopener noreferrer";
  anchor.textContent = "Open";

  cell.appendChild(anchor);
  return cell;
}

function createActionsCell(index) {
  const cell = createCell("Actions");
  const actions = document.createElement("div");
  const editButton = document.createElement("button");
  const deleteButton = document.createElement("button");

  actions.className = "actions";

  editButton.type = "button";
  editButton.className = "button button--table";
  editButton.dataset.action = "edit";
  editButton.dataset.index = index;
  editButton.textContent = "Edit";

  deleteButton.type = "button";
  deleteButton.className = "button button--table button--danger";
  deleteButton.dataset.action = "delete";
  deleteButton.dataset.index = index;
  deleteButton.textContent = "Delete";

  actions.appendChild(editButton);
  actions.appendChild(deleteButton);
  cell.appendChild(actions);

  return cell;
}

function createCell(label, className) {
  const cell = document.createElement("td");
  cell.dataset.label = label;

  if (className) {
    cell.className = className;
  }

  return cell;
}

function editApplication(index) {
  const application = applications[index];

  companyInput.value = application.company;
  positionInput.value = application.position;
  offerLinkInput.value = application.offerLink || "";
  applicationDateInput.value = application.applicationDate;
  statusInput.value = application.status;
  notesInput.value = application.notes || "";

  editIndex = index;
  setFormMode(true);
  form.scrollIntoView({ behavior: "smooth", block: "start" });
}

function deleteApplication(index) {
  const shouldDelete = window.confirm("Delete this application from the pipeline?");

  if (!shouldDelete) {
    return;
  }

  applications.splice(index, 1);

  if (editIndex === index) {
    resetFormState();
  } else if (editIndex !== null && editIndex > index) {
    editIndex -= 1;
  }

  saveApplications();
  displayApplications();
}

function saveApplications() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(applications));
}

function resetFormState() {
  editIndex = null;
  form.reset();
  setFormMode(false);
}

function setFormMode(isEditing) {
  formHeading.textContent = isEditing
    ? "Edit application"
    : "Add an application";
  formIntro.textContent = isEditing
    ? "Update the details, then save to keep your tracking clean."
    : "Capture each opportunity clearly to keep your pipeline clean and easy to manage.";
  formModeBadge.textContent = isEditing ? "Editing" : "New";
  submitButton.textContent = isEditing
    ? "Save changes"
    : "Add application";
  cancelEditButton.classList.toggle("is-hidden", !isEditing);
}

function updateStats() {
  const total = applications.length;
  const toApply = countByStatus("To apply");
  const sent = countByStatus("Sent");
  const followUps = countByStatus("Follow-up");
  const interviews = countByStatus("Interview");
  const rejected = countByStatus("Rejected");
  const accepted = countByStatus("Accepted");
  const activeCount = applications.filter(function (application) {
    return ACTIVE_STATUSES.includes(application.status);
  }).length;
  const positiveCount = applications.filter(function (application) {
    return POSITIVE_STATUSES.includes(application.status);
  }).length;

  totalCount.textContent = total;
  toApplyCount.textContent = toApply;
  sentCount.textContent = sent;
  followUpCount.textContent = followUps;
  interviewCount.textContent = interviews;
  rejectedCount.textContent = rejected;
  acceptedCount.textContent = accepted;
  activePipelineCount.textContent = activeCount;
  positiveRate.textContent = total
    ? Math.round((positiveCount / total) * 100) + "%"
    : "0%";
  heroInsight.textContent = buildHeroInsight(total, toApply, followUps, interviews, accepted);
}

function updateDashboardCopy(filteredCount, searchText, selectedStatus) {
  const total = applications.length;
  const hasFilters = Boolean(searchText) || selectedStatus !== "All";

  if (hasFilters) {
    resultsSummary.textContent =
      filteredCount + " of " + total + " " + formatUnit(total, "application");
  } else {
    resultsSummary.textContent =
      filteredCount + " " + formatUnit(filteredCount, "application") + " displayed";
  }

  if (!total) {
    tableInsight.textContent = "Start by adding a first opportunity to launch your pipeline.";
    return;
  }

  if (!filteredCount) {
    tableInsight.textContent = "No results match these filters. Reset them to see the full view.";
    return;
  }

  if (selectedStatus !== "All") {
    tableInsight.textContent = "Active filter: " + selectedStatus + ".";
    return;
  }

  if (searchText) {
    tableInsight.textContent = "Live search across the pipeline.";
    return;
  }

  const interviews = countByStatus("Interview");

  if (interviews) {
    tableInsight.textContent =
      formatCount(interviews, "interview") + " ongoing or scheduled.";
    return;
  }

  tableInsight.textContent = "Your tracking is centralized, sortable, and instantly readable.";
}

function renderEmptyState(searchText, selectedStatus) {
  const row = document.createElement("tr");
  const cell = document.createElement("td");
  const card = document.createElement("div");
  const label = document.createElement("span");
  const title = document.createElement("h3");
  const description = document.createElement("p");

  cell.colSpan = 7;
  cell.className = "empty-state";
  cell.dataset.label = "";

  card.className = "empty-state__card";
  label.className = "empty-state__label";
  title.className = "empty-state__title";
  description.className = "empty-state__description";

  if (!applications.length) {
    label.textContent = "Empty pipeline";
    title.textContent = "Add your first application";
    description.textContent =
      "Create a first row to start tracking your apprenticeship search in a clean interface.";
  } else {
    label.textContent = "No results";
    title.textContent = "No application matches";
    description.textContent =
      "Try broadening the search" +
      (selectedStatus !== "All" ? " or removing the " + selectedStatus.toLowerCase() + " filter" : "") +
      (searchText ? " to see more opportunities." : ".");
  }

  card.appendChild(label);
  card.appendChild(title);
  card.appendChild(description);
  cell.appendChild(card);
  row.appendChild(cell);
  applicationsList.appendChild(row);
}

function countByStatus(status) {
  return applications.filter(function (application) {
    return application.status === status;
  }).length;
}

function loadApplications() {
  let storedApplications = [];

  try {
    storedApplications = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch (error) {
    return [];
  }

  if (!Array.isArray(storedApplications)) {
    return [];
  }

  return storedApplications.map(normalizeApplication);
}

function normalizeApplication(application) {
  return {
    company: application.company || "",
    position: application.position || "",
    offerLink: application.offerLink || "",
    applicationDate: application.applicationDate || "",
    status: normalizeStatus(application.status || ""),
    notes: application.notes || "",
  };
}

function normalizeStatus(status) {
  return LEGACY_STATUS_MAP[status] || status;
}

function getStatusClass(status) {
  const statusClasses = {
    "To apply": "status-pill--todo",
    Sent: "status-pill--sent",
    "Follow-up": "status-pill--followup",
    Interview: "status-pill--interview",
    Rejected: "status-pill--rejected",
    Accepted: "status-pill--accepted",
  };

  return statusClasses[status] || "status-pill--sent";
}

function formatDate(dateString) {
  if (!dateString) {
    return "Not set";
  }

  const dateParts = dateString.split("-").map(Number);

  if (dateParts.length !== 3 || dateParts.some(Number.isNaN)) {
    return dateString;
  }

  const date = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);

  return new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function setTodayLabel() {
  const today = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());

  todayLabel.textContent = today;
}

function buildHeroInsight(total, toApply, followUps, interviews, accepted) {
  if (!total) {
    return "Add opportunities, sort them quickly, and keep an instant view of your progress.";
  }

  if (accepted) {
    return formatCount(accepted, "accepted opportunity", "accepted opportunities") + ". The pipeline is paying off.";
  }

  if (interviews) {
    return formatCount(interviews, "interview") + " in progress. Things are moving well.";
  }

  if (followUps) {
    return formatCount(followUps, "follow-up") + " to watch so you keep momentum.";
  }

  if (toApply) {
    return formatCount(toApply, "opportunity", "opportunities") + " ready to process.";
  }

  return "The pipeline is clean, readable, and ready for your next actions.";
}

function formatCount(count, singular, plural) {
  return count + " " + formatUnit(count, singular, plural);
}

function formatUnit(count, singular, plural) {
  return count === 1 ? singular : plural || singular + "s";
}

window.addEventListener("storage", function () {
  applications = loadApplications();
  displayApplications();
});
