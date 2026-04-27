const form = document.getElementById("applicationForm");
const applicationsList = document.getElementById("applicationsList");
const searchInput = document.getElementById("searchInput");
const statusFilter = document.getElementById("statusFilter");
const totalCount = document.getElementById("totalCount");
const toApplyCount = document.getElementById("toApplyCount");
const sentCount = document.getElementById("sentCount");
const interviewCount = document.getElementById("interviewCount");
const rejectedCount = document.getElementById("rejectedCount");
const acceptedCount = document.getElementById("acceptedCount");

let applications = JSON.parse(localStorage.getItem("applications")) || [];
let editIndex = null;

displayApplications();

form.addEventListener("submit", function (event) {
  event.preventDefault();

  const application = {
    company: document.getElementById("company").value,
    position: document.getElementById("position").value,
    offerLink: document.getElementById("offerLink").value,
    applicationDate: document.getElementById("applicationDate").value,
    status: document.getElementById("status").value,
    notes: document.getElementById("notes").value,
  };

  if (editIndex === null) {
    applications.push(application);
  } else {
    applications[editIndex] = application;
    editIndex = null;
    form.querySelector("button").textContent = "Ajouter la candidature";
  }

  saveApplications();
  displayApplications();
  form.reset();
});

searchInput.addEventListener("input", displayApplications);
statusFilter.addEventListener("change", displayApplications);

function displayApplications() {
  applicationsList.innerHTML = "";

  const searchText = searchInput.value.toLowerCase();
  const selectedStatus = statusFilter.value;

  const filteredApplications = applications.filter(function (application) {
    const matchesSearch =
      application.company.toLowerCase().includes(searchText) ||
      application.position.toLowerCase().includes(searchText);

    const matchesStatus =
      selectedStatus === "Tous" || application.status === selectedStatus;

    return matchesSearch && matchesStatus;
  });

  filteredApplications.forEach(function (application) {
    const originalIndex = applications.indexOf(application);
    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${application.company}</td>
      <td>${application.position}</td>
      <td>${application.applicationDate}</td>
      <td>${application.status}</td>
      <td>${application.notes}</td>
      <td>
        ${
          application.offerLink
            ? `<a href="${application.offerLink}" target="_blank">Voir l'offre</a>`
            : "Aucun lien"
        }
      </td>
      <td>
        <button onclick="editApplication(${originalIndex})">Modifier</button>
        <button onclick="deleteApplication(${originalIndex})">Supprimer</button>
      </td>
    `;

    applicationsList.appendChild(row);
  });
}

function editApplication(index) {
  const application = applications[index];

  document.getElementById("company").value = application.company;
  document.getElementById("position").value = application.position;
  document.getElementById("offerLink").value = application.offerLink;
  document.getElementById("applicationDate").value = application.applicationDate;
  document.getElementById("status").value = application.status;
  document.getElementById("notes").value = application.notes;

  editIndex = index;
  form.querySelector("button").textContent = "Modifier la candidature";
}

function deleteApplication(index) {
  applications.splice(index, 1);
  saveApplications();
  displayApplications();
}

function saveApplications() {
  localStorage.setItem("applications", JSON.stringify(applications));
}

function updateStats() {
  totalCount.textContent = applications.length;

  toApplyCount.textContent = applications.filter(app => app.status === "À postuler").length;
  sentCount.textContent = applications.filter(app => app.status === "Envoyée").length;
  interviewCount.textContent = applications.filter(app => app.status === "Entretien").length;
  rejectedCount.textContent = applications.filter(app => app.status === "Refus").length;
  acceptedCount.textContent = applications.filter(app => app.status === "Acceptée").length;
}

updateStats();