let tuiCalendar = null;
let reservations = [];

const showCalendarBtn = document.getElementById('showCalendarBtn');
const calendarModal = document.getElementById('calendarModal');
const closeCalendarModal = document.getElementById('closeCalendarModal');
const calendarContainer = document.getElementById('tui-calendar-container');
const reservationForm = document.getElementById('reservationForm');
const reservationsList = document.getElementById('reservationsList');
const itemsContainer = document.getElementById('itemsContainer');
const addItemBtn = document.getElementById('addItemBtn');

// Ajoute un nouveau champ matériel
addItemBtn.onclick = function(e) {
  e.preventDefault();
  const select = document.createElement('select');
  select.className = 'item';
  select.required = true;
  select.innerHTML = `
    <option value="">Choisir un matériel</option>
    <option>Drone FPV DJI A</option>
    <option>Drone FPV DJI B</option>
    <option>Pied vidéo Stacl</option>
    <option>DJI MIC 1</option>
    <option>DJI MIC 2</option>
  `;
  itemsContainer.appendChild(select);
};

function renderReservations() {
  reservationsList.innerHTML = '';
  reservations.forEach((res, idx) => {
    const li = document.createElement('li');
    li.textContent = `${res.name} - ${res.items.join(", ")} (${res.start} → ${res.end})`;
    const delBtn = document.createElement('button');
    delBtn.textContent = "Supprimer";
    delBtn.onclick = () => {
      reservations.splice(idx, 1);
      renderReservations();
      updateCalendar();
    };
    li.appendChild(delBtn);
    reservationsList.appendChild(li);
  });
}

reservationForm.onsubmit = (e) => {
  e.preventDefault();
  const name = document.getElementById('name').value.trim();
  const start = document.getElementById('start').value;
  const end = document.getElementById('end').value;
  if (!name || !start || !end) return;
  const itemSelects = Array.from(document.querySelectorAll('#itemsContainer .item'));
  const items = itemSelects.map(sel => sel.value).filter(Boolean);
  if (items.length === 0) return;
  reservations.push({ name, items, start, end });
  renderReservations();
  reservationForm.reset();
  // Réinitialise la liste à un seul select
  itemsContainer.innerHTML = '';
  const baseSelect = document.createElement('select');
  baseSelect.className = 'item';
  baseSelect.required = true;
  baseSelect.innerHTML = `
    <option value="">Choisir un matériel</option>
    <option>Drone FPV DJI A</option>
    <option>Drone FPV DJI B</option>
    <option>Pied vidéo Stacl</option>
    <option>DJI MIC 1</option>
    <option>DJI MIC 2</option>
  `;
  itemsContainer.appendChild(baseSelect);
  updateCalendar();
};

function getCalendarEvents() {
  // Chaque matériel réservé devient un événement distinct
  return reservations.flatMap((r, idx) =>
    r.items.map(item => ({
      id: `${idx}_${item}`,
      calendarId: '1',
      title: `${r.name} - ${item}`,
      category: 'allday',
      start: r.start,
      end: r.end,
    }))
  );
}

function updateCalendar() {
  if (tuiCalendar) {
    tuiCalendar.clear();
    tuiCalendar.createSchedules(getCalendarEvents());
  }
}

function openCalendarModal() {
  calendarModal.style.display = 'flex';
  if (!tuiCalendar) {
    tuiCalendar = new tui.Calendar('#tui-calendar-container', {
      defaultView: 'month',
      useCreationPopup: false,
      useDetailPopup: true,
      isReadOnly: true,
      month: { visibleWeeksCount: 6 },
      template: {
        monthDayname: dayname => dayname.label,
        allday: event => event.title,
      }
    });
    tuiCalendar.createSchedules(getCalendarEvents());
  } else {
    updateCalendar();
  }
  setTimeout(() => {
    tuiCalendar.render();
  }, 100);
}

function closeCalendar() {
  calendarModal.style.display = 'none';
}

showCalendarBtn.onclick = openCalendarModal;
closeCalendarModal.onclick = closeCalendar;

window.onclick = function(event) {
  if (event.target === calendarModal) {
    closeCalendar();
  }
};

// Initial rendering of reservations
// Ajoute au moins un champ matériel au départ
(function initForm() {
  itemsContainer.innerHTML = '';
  const baseSelect = document.createElement('select');
  baseSelect.className = 'item';
  baseSelect.required = true;
  baseSelect.innerHTML = `
    <option value="">Choisir un matériel</option>
    <option>Drone FPV DJI A</option>
    <option>Drone FPV DJI B</option>
    <option>Pied vidéo Stacl</option>
    <option>DJI MIC 1</option>
    <option>DJI MIC 2</option>
  `;
  itemsContainer.appendChild(baseSelect);
})();
renderReservations();