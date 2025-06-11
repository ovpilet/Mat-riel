const API_URL = 'https://script.google.com/macros/s/AKfycbxeYItICJG8R31TnsgMTlhoed9bhp5lnaa-9cqAH933deMxb1NlhBE_fsNaCMfp4pu8/exec';

// Données en mémoire
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

function showMessage(msg, duration = 3000) {
  messageBox.textContent = msg;
  messageBox.classList.add('show');
  setTimeout(() => messageBox.classList.remove('show'), duration);
}

// API
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
async function postApiData(action, payload) {
  try {
    const response = await fetch(`${API_URL}?action=${action}`, {
      method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(payload),
    });
    const result = await response.json();
    if (result.status !== 200) throw new Error(result.message || 'Erreur');
    return result.data;
  } catch (e) {
    showMessage(`Erreur: ${e.message}`, 4000);
    return null;
  }
}

// Chargement initial
async function initialLoad() {
  showMessage('Chargement...');
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

function renderTable() {
  tableBody.innerHTML = '';
  reservations.forEach((res, i) => {
    const tr = document.createElement('tr');

    // NOMS
    const tdNames = document.createElement('td');
    tdNames.appendChild(createNamesGroup(res, i));
    tr.appendChild(tdNames);

    // DATE DEPART
    const tdStart = document.createElement('td');
    const inputStart = document.createElement('input');
    inputStart.type = 'date'; inputStart.value = res.startDate || '';
    inputStart.onchange = (e) => { res.startDate = e.target.value; saveAll(); };
    tdStart.appendChild(inputStart);
    tr.appendChild(tdStart);

    // DATE RETOUR
    const tdEnd = document.createElement('td');
    const inputEnd = document.createElement('input');
    inputEnd.type = 'date'; inputEnd.value = res.endDate || '';
    inputEnd.onchange = (e) => { res.endDate = e.target.value; saveAll(); };
    tdEnd.appendChild(inputEnd);
    tr.appendChild(tdEnd);

    // ARTICLES
    const tdArticles = document.createElement('td');
    tdArticles.appendChild(createArticlesGroup(res, i));
    tr.appendChild(tdArticles);

    // ACTION
    const tdAction = document.createElement('td');
    const delBtn = document.createElement('button');
    delBtn.className = 'btn btn-danger';
    delBtn.textContent = 'Supprimer';
    delBtn.onclick = () => { reservations.splice(i,1); renderTable(); saveAll(); };
    tdAction.appendChild(delBtn);
    tr.appendChild(tdAction);

    tableBody.appendChild(tr);
  });
}

// Groupes Noms
function createNamesGroup(res, i) {
  const div = document.createElement('div');
  res.names = res.names || [];
  res.names.forEach((name, j) => {
    const group = document.createElement('div');
    group.className = 'select-group';

    const select = document.createElement('select');
    select.innerHTML = `<option value="">--Sélectionner--</option>` +
      dataNames.map(n => `<option value="${n}"${n===name?' selected':''}>${n}</option>`).join('') +
      `<option value="new">Autre/Nouveau…</option>`;
    select.value = name;
    select.onchange = (e) => {
      if(e.target.value === 'new') {
        const newName = prompt('Entrez le nouveau nom :');
        if(newName && !dataNames.includes(newName)) { dataNames.push(newName); dataNames.sort(); }
        res.names[j] = newName || '';
        renderTable(); saveAll();
      } else {
        res.names[j] = e.target.value;
        renderTable(); saveAll();
      }
    };
    group.appendChild(select);

    if(res.names.length > 1) {
      const delBtn = document.createElement('button');
      delBtn.className = 'btn btn-danger'; delBtn.textContent = '-';
      delBtn.onclick = () => { res.names.splice(j,1); renderTable(); saveAll(); };
      group.appendChild(delBtn);
    }
    div.appendChild(group);
  });
  const addBtn = document.createElement('button');
  addBtn.className = 'btn btn-secondary'; addBtn.textContent = '+';
  addBtn.onclick = () => { res.names.push(''); renderTable(); saveAll(); };
  div.appendChild(addBtn);
  return div;
}

// Groupes Articles
function createArticlesGroup(res, i) {
  const div = document.createElement('div');
  res.articles = res.articles || [];
  res.articles.forEach((art, j) => {
    const group = document.createElement('div');
    group.className = 'select-group';

    // Catégorie
    const selectCat = document.createElement('select');
    selectCat.innerHTML = `<option value="">--Catégorie--</option>` +
      Object.keys(dataArticles).map(cat => `<option value="${cat}"${cat===art.category?' selected':''}>${cat}</option>`).join('') +
      `<option value="new">Autre/Nouvelle…</option>`;
    selectCat.value = art.category;
    selectCat.onchange = (e) => {
      if(e.target.value === 'new') {
        const newCat = prompt('Entrez la nouvelle catégorie :');
        if(newCat && !dataArticles[newCat]) { dataArticles[newCat]=[]; }
        art.category = newCat || '';
        renderTable(); saveAll();
      } else {
        art.category = e.target.value;
        renderTable(); saveAll();
      }
    };
    group.appendChild(selectCat);

    // Article
    const selectArt = document.createElement('select');
    const items = dataArticles[art.category] || [];
    selectArt.innerHTML = `<option value="">--Article--</option>` +
      items.map(item => `<option value="${item}"${item===art.name?' selected':''}>${item}</option>`).join('') +
      `<option value="new">Autre/Nouveau…</option>`;
    selectArt.value = art.name;
    selectArt.onchange = (e) => {
      if(e.target.value === 'new') {
        const newArt = prompt('Entrez le nom du nouvel article :');
        if(newArt && !items.includes(newArt)) { dataArticles[art.category]=[...(items||[]), newArt]; }
        art.name = newArt || '';
        renderTable(); saveAll();
      } else {
        art.name = e.target.value;
        renderTable(); saveAll();
      }
    };
    group.appendChild(selectArt);

    if(res.articles.length > 1) {
      const delBtn = document.createElement('button');
      delBtn.className = 'btn btn-danger'; delBtn.textContent = '-';
      delBtn.onclick = () => { res.articles.splice(j,1); renderTable(); saveAll(); };
      group.appendChild(delBtn);
    }
    div.appendChild(group);
  });
  const addBtn = document.createElement('button');
  addBtn.className = 'btn btn-secondary'; addBtn.textContent = '+';
  addBtn.onclick = () => { res.articles.push({category:'',name:''}); renderTable(); saveAll(); };
  div.appendChild(addBtn);
  return div;
}

// Ajout réservation
addReservationBtn.onclick = () => {
  reservations.unshift({names:[''], startDate:'', endDate:'', articles:[{category:'',name:''}]});
  renderTable(); saveAll();
};

// Sauvegarde
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
      events: reservations.flatMap(res =>
        res.articles.map(a => ({
          title: (res.names.filter(Boolean).join(', ') ? res.names.filter(Boolean).join(', ') + ' - ' : '') + a.category + ': ' + a.name,
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
  if (calendar) { calendar.destroy(); calendar = null; }
};

initialLoad();