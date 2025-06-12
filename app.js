let tuiCalendar = null;
let reservations = [];

const showCalendarBtn = document.getElementById('showCalendarBtn');
const calendarModal = document.getElementById('calendarModal');
const closeCalendarModal = document.getElementById('closeCalendarModal');
const calendarContainer = document.getElementById('tui-calendar-container');
const reservationForm = document.getElementById('reservationForm');
const reservationsList = document.getElementById('reservationsList');

function renderReservations() {
  reservationsList.innerHTML = '';
  reservations.forEach((res, idx) => {
    const li = document.createElement('li');
    li.textContent = `${res.name} - ${res.item} (${res.start} → ${res.end})`;
    reservationsList.appendChild(li);
  });
}

reservationForm.onsubmit = (e) => {
  e.preventDefault();
  const name = document.getElementById('name').value.trim();
  const item = document.getElementById('item').value.trim();
  const start = document.getElementById('start').value;
  const end = document.getElementById('end').value;
  if (!name || !item || !start || !end) return;
  reservations.push({ name, item, start, end });
  renderReservations();
  reservationForm.reset();
  updateCalendar();
};

function getCalendarEvents() {
  return reservations.map((r, idx) => ({
    id: String(idx),
    calendarId: '1',
    title: `${r.name} - ${r.item}`,
    category: 'allday',
    start: r.start,
    end: r.end,
  }));
}

function updateCalendar() {
  if (tuiCalendar) {
    tuiCalendar.clear();
    tuiCalendar.createSchedules(getCalendarEvents());
  }
}

function openCalendarModal() {
  calendarModal.style.display = 'flex';

  setTimeout(() => {
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
    }
    updateCalendar();
    tuiCalendar.render(); // Force le render à chaque ouverture
  }, 100); // Délai pour garantir que la modale est visible
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
renderReservations();
