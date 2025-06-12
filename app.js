let tuiCalendar = null;

const showCalendarBtn = document.getElementById('showCalendarBtn');
const calendarModal = document.getElementById('calendarModal');
const closeCalendarModal = document.getElementById('closeCalendarModal');
const calendarContainer = document.getElementById('tui-calendar-container');

// Exemple d'événements, à remplacer par tes vraies réservations
const events = [
  {
    id: '1',
    calendarId: '1',
    title: 'Drone FPV DJI A',
    category: 'allday',
    start: '2025-06-10',
    end: '2025-06-13',
  },
  {
    id: '2',
    calendarId: '1',
    title: 'DJI MIC 1',
    category: 'allday',
    start: '2025-06-15',
    end: '2025-06-17',
  }
];

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
    tuiCalendar.createSchedules(events); // Ajoute les événements une seule fois
  }
  setTimeout(() => {
    tuiCalendar.render();
  }, 100); // Forcer le render après ouverture modale
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
