const STORAGE_KEY = "applications";
const ACTIVE_STATUSES = ["À postuler", "Envoyée", "Relance", "Entretien"];
const POSITIVE_STATUSES = ["Entretien", "Acceptée"];

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
    status: statusInput.value,
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
  statusFilter.value = "Tous";
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
  const selectedStatus = statusFilter.value;

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
        selectedStatus === "Tous" || application.status === selectedStatus;

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
  row.appendChild(createTextCell("Poste", application.position));
  row.appendChild(createTextCell("Date", formatDate(application.applicationDate)));
  row.appendChild(createStatusCell(application.status));
  row.appendChild(createNotesCell(application.notes));
  row.appendChild(createOfferCell(application.offerLink));
  row.appendChild(createActionsCell(index));

  return row;
}

function createCompanyCell(company) {
  const cell = createCell("Entreprise", "company-cell");
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
  const cell = createCell("Statut");
  const badge = document.createElement("span");

  badge.className = "status-pill " + getStatusClass(status);
  badge.textContent = status;

  cell.appendChild(badge);
  return cell;
}

function createNotesCell(notes) {
  const cell = createCell("Notes", "notes-cell");
  cell.textContent = notes || "Aucune note ajoutée";

  if (!notes) {
    cell.classList.add("table-muted");
  }

  return cell;
}

function createOfferCell(link) {
  const cell = createCell("Offre");

  if (!link) {
    const emptyLink = document.createElement("span");
    emptyLink.className = "table-muted";
    emptyLink.textContent = "Non ajoutée";
    cell.appendChild(emptyLink);
    return cell;
  }

  const anchor = document.createElement("a");
  anchor.className = "offer-link";
  anchor.href = link;
  anchor.target = "_blank";
  anchor.rel = "noopener noreferrer";
  anchor.textContent = "Ouvrir";

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
  editButton.textContent = "Modifier";

  deleteButton.type = "button";
  deleteButton.className = "button button--table button--danger";
  deleteButton.dataset.action = "delete";
  deleteButton.dataset.index = index;
  deleteButton.textContent = "Supprimer";

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
  const shouldDelete = window.confirm("Supprimer cette candidature du pipeline ?");

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
    ? "Modifier la candidature"
    : "Ajouter une candidature";
  formIntro.textContent = isEditing
    ? "Ajuste les informations puis enregistre pour garder un suivi impeccable."
    : "Renseigne chaque opportunité de façon nette pour garder un pipeline impeccable et facile à piloter.";
  formModeBadge.textContent = isEditing ? "Édition" : "Nouveau";
  submitButton.textContent = isEditing
    ? "Enregistrer les modifications"
    : "Ajouter la candidature";
  cancelEditButton.classList.toggle("is-hidden", !isEditing);
}

function updateStats() {
  const total = applications.length;
  const toApply = countByStatus("À postuler");
  const sent = countByStatus("Envoyée");
  const followUps = countByStatus("Relance");
  const interviews = countByStatus("Entretien");
  const rejected = countByStatus("Refus");
  const accepted = countByStatus("Acceptée");
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
  const hasFilters = Boolean(searchText) || selectedStatus !== "Tous";

  if (hasFilters) {
    resultsSummary.textContent =
      filteredCount + " sur " + total + " " + pluralize("candidature", total);
  } else {
    resultsSummary.textContent =
      filteredCount + " " + pluralize("candidature", filteredCount) + " affichée" + (isPlural(filteredCount) ? "s" : "");
  }

  if (!total) {
    tableInsight.textContent = "Commence par ajouter une première opportunité pour lancer ton pipeline.";
    return;
  }

  if (!filteredCount) {
    tableInsight.textContent = "Aucun résultat avec ces filtres. Réinitialise pour retrouver toute la vue.";
    return;
  }

  if (selectedStatus !== "Tous") {
    tableInsight.textContent = "Filtre actif : " + selectedStatus + ".";
    return;
  }

  if (searchText) {
    tableInsight.textContent = "Recherche en direct sur le pipeline.";
    return;
  }

  const interviews = countByStatus("Entretien");

  if (interviews) {
    tableInsight.textContent =
      interviews + " " + pluralize("entretien", interviews) + " en cours ou planifié" + (isPlural(interviews) ? "s" : "") + ".";
    return;
  }

  tableInsight.textContent = "Tout ton suivi est centralisé, triable et immédiatement lisible.";
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
    label.textContent = "Pipeline vide";
    title.textContent = "Ajoute ta première candidature";
    description.textContent =
      "Crée une première ligne pour commencer à suivre ton alternance dans une interface propre et claire.";
  } else {
    label.textContent = "Aucun résultat";
    title.textContent = "Aucune candidature ne correspond";
    description.textContent =
      "Essaie d'élargir la recherche" +
      (selectedStatus !== "Tous" ? " ou de retirer le filtre " + selectedStatus.toLowerCase() : "") +
      (searchText ? " pour revoir plus d'opportunités." : ".");
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
    status: application.status || "",
    notes: application.notes || "",
  };
}

function getStatusClass(status) {
  const statusClasses = {
    "À postuler": "status-pill--todo",
    "Envoyée": "status-pill--sent",
    "Relance": "status-pill--followup",
    "Entretien": "status-pill--interview",
    "Refus": "status-pill--rejected",
    "Acceptée": "status-pill--accepted",
  };

  return statusClasses[status] || "status-pill--sent";
}

function formatDate(dateString) {
  if (!dateString) {
    return "Non définie";
  }

  const dateParts = dateString.split("-").map(Number);

  if (dateParts.length !== 3 || dateParts.some(Number.isNaN)) {
    return dateString;
  }

  const date = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function setTodayLabel() {
  const today = new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());

  todayLabel.textContent = today.charAt(0).toUpperCase() + today.slice(1);
}

function buildHeroInsight(total, toApply, followUps, interviews, accepted) {
  if (!total) {
    return "Ajoute tes opportunités, trie-les vite, et garde une lecture immédiate de ton avancée.";
  }

  if (accepted) {
    return accepted + " " + pluralize("opportunité", accepted) + " acceptée" + (isPlural(accepted) ? "s" : "") + ". Le pipeline porte ses fruits.";
  }

  if (interviews) {
    return interviews + " " + pluralize("entretien", interviews) + " en cours. Tu es dans une phase qui avance bien.";
  }

  if (followUps) {
    return followUps + " " + pluralize("relance", followUps) + " à surveiller pour garder le bon momentum.";
  }

  if (toApply) {
    return toApply + " " + pluralize("opportunité", toApply) + " prête" + (isPlural(toApply) ? "s" : "") + " à être traitée" + (isPlural(toApply) ? "s" : "") + ".";
  }

  return "Le pipeline est propre, lisible et prêt pour tes prochaines actions.";
}

function pluralize(word, count) {
  return word + (isPlural(count) ? "s" : "");
}

function isPlural(count) {
  return count !== 1;
}

window.addEventListener("storage", function () {
  applications = loadApplications();
  displayApplications();
});
