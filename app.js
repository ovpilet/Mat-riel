// Configuration : URL de l'API Google Apps Script à modifier avec la tienne
const API_URL = 'https://script.google.com/macros/s/AKfycbxeYItICJG8R31TnsgMTlhoed9bhp5lnaa-9cqAH933deMxb1NlhBE_fsNaCMfp4pu8/exec';

// Variables globales
let dataArticles = {};
let dataNames = [];
let reservations = [];
let calendar;

// Sélecteurs
const tableBody = document.getElementById('tableBody');
const addReservationBtn = document.getElementById('addReservationBtn');
const showCalendarBtn = document.getElementById('showCalendarBtn');
const calendarModal = document.getElementById('calendarModal');
const closeCalendarModal = document.getElementById('closeCalendarModal');
const messageBox = document.getElementById('messageBox');

// Afficher un message temporaire
function showMessage(msg, duration = 3000) {
  messageBox.textContent = msg;
  messageBox.classList.add('show');
  setTimeout(() => messageBox.classList.remove('show'), duration);
}

// Appel API GET
async function fetchApiData(action) {
  try {
    const response = await fetch(`${API_URL}?action=${action}`);
    const result = await response.json();
    if (result.status !== 200) throw new Error(result.message || 'Erreur');
    return result.data;
  } catch (e) {
    showMessage(`Erreur: ${e.message}`, 4000);
    return null;
  }
}

// Appel API POST
async function postApiData(action, payload) {
  try {
    const response = await fetch(`${API_URL}?action=${action}`, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload),
    });
    const result = await response.json();
    if (result.status !== 200) throw new Error(result.message || 'Erreur');
    return result.data;
  } catch (e) {
    showMessage(`Erreur: ${e.message}`, 4000);
    return null;
  }
}

// Charger toutes les données au démarrage
async function initialLoad() {
  showMessage('Chargement...', 700);
  const [namesData, articlesData, reservationsData] = await Promise.all([
    fetchApiData('getNames'),
    fetchApiData('getArticles'),
    fetchApiData('getReservations'),
  ]);
  dataNames = namesData?.names || [];
  dataArticles = articlesData?.articles || {};
  reservations = reservationsData?.reservations || [];
  renderTable();
}

// Afficher le tableau des réservations
function renderTable() {
  tableBody.innerHTML = '';
  reservations.forEach((res, i) => {
    const tr = document.createElement('tr');

    // Cellule noms
    const tdNames = document.createElement('td');
    tdNames.innerHTML = res.names.map(name =>
      `<span class="inline-block bg-blue-100 text-blue-800 px-2 py-0.5 rounded mr-1">${escapeHtml(name)}</span>`
    ).join('') +
    `<button class="btn btn-secondary btn-sm" onclick="addName(${i})">+</button>`;
    tr.appendChild(tdNames);

    // Dates
    const tdStart = document.createElement('td');
    tdStart.innerHTML = `<input type="date" value="${res.startDate || ''}" onchange="updateDate(${i}, 'startDate', this.value)" />`;
    tr.appendChild(tdStart);

    const tdEnd = document.createElement('td');
    tdEnd.innerHTML = `<input type="date" value="${res.endDate || ''}" onchange="updateDate(${i}, 'endDate', this.value)" />`;
    tr.appendChild(tdEnd);

    // Articles
    const tdArticles = document.createElement('td');
    tdArticles.innerHTML = res.articles.map(a =>
      `<span class="inline-block bg-green-100 text-green-800 px-2 py-0.5 rounded mr-1">${escapeHtml(a.category)} : ${escapeHtml(a.name)}</span>`
    ).join('') +
    `<button class="btn btn-secondary btn-sm" onclick="addArticle(${i})">+</button>`;
    tr.appendChild(tdArticles);

    // Action
    const tdAction = document.createElement('td');
    tdAction.innerHTML = `<button class="btn btn-danger" onclick="deleteReservation(${i})">Supprimer</button>`;
    tr.appendChild(tdAction);

    tableBody.appendChild(tr);
  });
}

// Échapper les caractères HTML
function escapeHtml(str) {
  return str?.replace(/[&<>"']/g, m => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'
  }[m])) || '';
}

// Ajouter une réservation
addReservationBtn.onclick = () => {
  reservations.unshift({names:[], startDate:'', endDate:'', articles:[]});
  renderTable();
  saveAll();
};

// Supprimer une réservation
window.deleteReservation = i => {
  reservations.splice(i,1);
  renderTable();
  saveAll();
}

// Modifier une date
window.updateDate = (i, key, value) => {
  reservations[i][key] = value;
  renderTable();
  saveAll();
};

// Ajouter un nom à une réservation
window.addName = i => {
  const name = prompt('Entrez un nom (ou sélectionnez un existant):\n' + dataNames.join('\n'));
  if (name && name.trim()) {
    if (!dataNames.includes(name)) dataNames.push(name);
    if (!reservations[i].names.includes(name)) reservations[i].names.push(name);
    renderTable();
    saveAll();
  }
};

// Ajouter un article à une réservation
window.addArticle = i => {
  const categories = Object.keys(dataArticles);
  let cat = prompt('Catégorie d\'article :\n' + categories.join('\n'));
  if (!cat) return;
  if (!dataArticles[cat]) dataArticles[cat] = [];
  let art = prompt('Nom de l\'article (' + dataArticles[cat].join(', ') + ') :');
  if (art && art.trim()) {
    if (!dataArticles[cat].includes(art)) dataArticles[cat].push(art);
    reservations[i].articles.push({category: cat, name: art});
    renderTable();
    saveAll();
  }
};

// Sauvegarder tout (réservations, noms, articles)
async function saveAll() {
  await Promise.all([
    postApiData('saveReservations', reservations),
    postApiData('saveNames', dataNames),
    postApiData('saveArticles', dataArticles),
  ]);
  showMessage('Données sauvegardées !', 1200);
}

// Gestion du calendrier
showCalendarBtn.onclick = () => {
  calendarModal.style.display = 'flex';
  if (!calendar) {
    calendar = new FullCalendar.Calendar(document.getElementById('calendar'), {
      locale: 'fr',
      initialView: 'dayGridMonth',
      events: reservations.flatMap((res, i) =>
        res.articles.map(a => ({
          title: (res.names.join(', ') ? res.names.join(', ') + ' - ' : '') + a.category + ': ' + a.name,
          start: res.startDate,
          end: res.endDate,
          allDay: true
        }))
      )
    });
    calendar.render();
  }
};
closeCalendarModal.onclick = () => {
  calendarModal.style.display = 'none';
  if (calendar) {
    calendar.destroy();
    calendar = null;
  }
};

// Charge la page au démarrage
initialLoad();