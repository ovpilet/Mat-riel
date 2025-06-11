// ... (tout le code précédent)
// Ajoutez en haut, sous les imports et variables :
let conflictedArticles = []; // Liste des conflits (tableau d’objets : {resIdx, artIdx})

// --- Vérification et extraction des conflits ---
function computeReservationConflicts() {
  conflictedArticles = [];
  for (let i = 0; i < reservations.length; i++) {
    const r1 = reservations[i];
    if (!r1.startDate || !r1.endDate) continue;
    const start1 = new Date(r1.startDate), end1 = new Date(r1.endDate);

    for (let j = i + 1; j < reservations.length; j++) {
      const r2 = reservations[j];
      if (!r2.startDate || !r2.endDate) continue;
      const start2 = new Date(r2.startDate), end2 = new Date(r2.endDate);

      const overlap = start1 <= end2 && start2 <= end1;
      if (overlap) {
        r1.articles.forEach((a1, a1idx) => {
          r2.articles.forEach((a2, a2idx) => {
            if (a1.name && a2.name && a1.category && a2.category &&
                a1.name === a2.name && a1.category === a2.category) {
              // Marquer les deux articles comme en conflit
              conflictedArticles.push({resIdx: i, artIdx: a1idx});
              conflictedArticles.push({resIdx: j, artIdx: a2idx});
            }
          });
        });
      }
    }
  }
}

// --- Rendu du tableau, avec articles rouges si conflit ---
function renderTable() {
  computeReservationConflicts();
  tableBody.innerHTML = '';
  let hasConflict = conflictedArticles.length > 0;
  reservations.forEach((res, i) => {
    const tr = document.createElement('tr');
    tr.className = i % 2 === 0 ? "bg-white" : "bg-gray-50";
    tr.style.boxShadow = "0 2px 6px rgba(0,0,0,0.04)";
    tr.style.borderRadius = "0.5rem";
    tr.style.marginBottom = "0.5rem";
    tr.style.overflow = "hidden";
    tr.style.verticalAlign = "middle";

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

  // Affichage d'une alerte s’il y a un conflit
  if (hasConflict) {
    showMessage("⚠️ Un ou plusieurs articles sont en conflit de réservation, ils sont affichés en rouge.");
  }
}

// --- Modification de createArticlesGroup pour colorer les articles en conflit ---
function createArticlesGroup(res, i) {
  const div = document.createElement('div');
  res.articles = res.articles || [];
  res.articles.forEach((art, j) => {
    const group = document.createElement('div');
    group.className = 'select-group';

    // Si cet article est en conflit, on le met en rouge
    if (conflictedArticles.some(c => c.resIdx === i && c.artIdx === j)) {
      group.style.background = "#fee2e2";
      group.style.borderLeft = "6px solid #dc2626";
    } else {
      group.style.background = "#f3f4f6";
      group.style.borderLeft = `6px solid ${colorForName(res.names[0])}`;
    }

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

// --- La sauvegarde ne bloque plus, mais affiche toujours les conflits ---
async function saveAll() {
  await Promise.all([
    postApiData('saveReservations', reservations),
    postApiData('saveNames', dataNames),
    postApiData('saveArticles', dataArticles),
  ]);
  showMessage('Données sauvegardées !', 1200);
}

// ... reste du code inchangé ...