var SESSIONS = generateSessions();

// Популярность фильмов не меняется — считаем один раз, а не при каждом рендере
var POPULARITY = (function () {
  var rating = {};
  for (var i = 0; i < SESSIONS.length; i++) {
    var film = findFilm(SESSIONS[i].filmId);
    if (!rating[film.id]) rating[film.id] = 0;
    rating[film.id] += SESSIONS[i].seatsTotal - SESSIONS[i].seatsFree;
  }
  return rating;
})();

var DAYS = (function () {
  var arr = [];
  var start = new Date();
  start.setHours(0, 0, 0, 0);
  for (var d = 0; d < 7; d++) arr.push(new Date(start.getTime() + d * 86400000));
  return arr;
})();

var state = { day: dayKey(DAYS[0]), hall: "all" };
var lastFocused = null;

function findFilm(id) {
  for (var i = 0; i < FILMS.length; i++) {
    if (FILMS[i].id === id) return FILMS[i];
  }
  return null;
}

function findHall(id) {
  for (var i = 0; i < HALLS.length; i++) {
    if (HALLS[i].id === id) return HALLS[i];
  }
  return null;
}

function renderDayOptions() {
  var html = "";
  for (var i = 0; i < DAYS.length; i++) {
    var label = DAYS[i].toLocaleDateString("ru-RU", { weekday: "short", day: "numeric", month: "long" });
    if (i === 0) label += " — сегодня";
    if (i === 1) label += " — завтра";
    html += '<option value="' + dayKey(DAYS[i]) + '"' + (dayKey(DAYS[i]) === state.day ? " selected" : "") + ">" + label + "</option>";
  }
  document.getElementById("day-select").innerHTML = html;
}

function sessionClass(s) {
  if (s.seatsFree === 0) return "session session--out";
  if (s.seatsFree < s.seatsTotal * 0.15) return "session session--few";
  return "session session--ok";
}

function renderSchedule() {
  var list = SESSIONS.filter(function (s) {
    return s.dateKey === state.day && (state.hall === "all" || s.hallId === state.hall);
  });
  list.sort(function (a, b) {
    return a.time < b.time ? -1 : (a.time > b.time ? 1 : 0);
  });

  var groups = {};
  for (var i = 0; i < list.length; i++) {
    (groups[list[i].filmId] = groups[list[i].filmId] || []).push(list[i]);
  }

  var filmIds = Object.keys(groups).sort(function (a, b) {
    return POPULARITY[b] - POPULARITY[a];
  });

  var html = "";
  for (var f = 0; f < filmIds.length; f++) {
    var film = findFilm(Number(filmIds[f]));
    var sessions = groups[filmIds[f]];
    var chips = "";
    for (var c = 0; c < sessions.length; c++) {
      var s = sessions[c];
      var hall = findHall(s.hallId);
      var few = s.seatsFree > 0 && s.seatsFree < s.seatsTotal * 0.15;
      var out = s.seatsFree === 0;
      var statusText = out ? "мест нет" : (few ? "мало мест" : "мест достаточно");
      /* Доступное имя кнопки складывается из видимого текста (время, цена,
         формат) и скрытой подписи с залом и статусом: правило «Label in Name»
         выполнено автоматически, скринридер читает всё */
      chips += '<button type="button" class="' + sessionClass(s) + '"'
        + (out ? ' aria-disabled="true"' : "")
        + ' onclick="openModal(' + s.id + ')" title="' + hall.name + '">'
        + '<span class="session__time">' + s.time + "</span>"
        + '<span class="session__price">' + s.price + " ₽</span>"
        + '<span class="session__fmt">' + s.format + "</span>"
        + ((out || few) ? '<span class="session__status">' + statusText + "</span>" : "")
        + '<span class="visually-hidden">' + hall.name + " — " + statusText + "</span>"
        + "</button>";
    }
    html += '<article class="card">'
      + '<div class="card__poster"><picture>'
      + '<source type="image/webp" srcset="img/poster-' + film.id + '.webp">'
      + '<img src="img/poster-' + film.id + '.jpg" alt="Постер фильма «' + film.title + '»"'
      + ' width="213" height="319" loading="lazy" fetchpriority="low"></picture></div>'
      + '<div class="card__info">'
      + '<h3 class="card__title">' + film.title + ' <span class="badge badge--age">' + film.ageRating + "</span>"
      + (f === 0 ? ' <span class="badge badge--hit">Хит недели</span>' : "")
      + "</h3>"
      + '<div class="card__meta"><span class="badge badge--genre">' + film.genre + "</span>"
      + '<span class="card__dur">' + film.duration + " мин</span></div>"
      + '<p class="card__desc">' + film.description + "</p>"
      + '<div class="sessions">' + chips + "</div>"
      + "</div></article>";
  }
  document.getElementById("schedule").innerHTML = html;
  updateScrollMax();
}

function onDayChange() {
  state.day = document.getElementById("day-select").value;
  showStatus("");
  renderSchedule();
}

function onHallChange() {
  state.hall = document.getElementById("hall-select").value;
  showStatus("");
  renderSchedule();
}

/* Сообщения для пользователя без блокирующих alert() */
function showStatus(text) {
  document.getElementById("status").textContent = text;
}

function demoPay() {
  document.getElementById("modal-status").textContent =
    "Демо: оплата недоступна. Это учебный макет.";
}

/* Плавный скролл с уважением к prefers-reduced-motion */
function scrollToSchedule() {
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.getElementById("schedule").scrollIntoView({
    behavior: reduceMotion ? "auto" : "smooth"
  });
}

/* Модальное окно: Esc, ловушка фокуса, возврат фокуса */
function openModal(id) {
  var s = null;
  for (var i = 0; i < SESSIONS.length; i++) {
    if (SESSIONS[i].id === id) { s = SESSIONS[i]; break; }
  }
  if (!s) return;
  if (s.seatsFree === 0) {
    showStatus("На этот сеанс мест нет. Выберите другой сеанс.");
    return;
  }
  var film = findFilm(s.filmId);
  var hall = findHall(s.hallId);
  var status = s.seatsFree < s.seatsTotal * 0.15 ? "few" : "ok";
  document.getElementById("modal-body").innerHTML =
    '<div class="modal__film">' + film.title + "</div>"
    + '<div class="modal__row"><span>Сеанс</span><b>' + s.time + ", " + hall.name + "</b></div>"
    + '<div class="modal__row"><span>Формат</span><b>' + s.format + "</b></div>"
    + '<div class="modal__row"><span>Свободно мест</span><b><span class="dot dot--' + status + '"></span>' + s.seatsFree + " из " + s.seatsTotal + "</b></div>"
    + '<div class="modal__row"><span>Цена</span><b>' + s.price + " ₽</b></div>";
  document.getElementById("modal-status").textContent = "";
  lastFocused = document.activeElement;
  document.getElementById("modal").classList.remove("hidden");
  document.getElementById("modal-close-btn").focus();
}

function closeModal() {
  document.getElementById("modal").classList.add("hidden");
  if (lastFocused && typeof lastFocused.focus === "function") {
    lastFocused.focus();
  }
}

document.addEventListener("keydown", function (e) {
  var modal = document.getElementById("modal");
  if (modal.classList.contains("hidden")) return;
  if (e.key === "Escape") {
    closeModal();
    return;
  }
  if (e.key === "Tab") {
    var focusables = modal.querySelectorAll("button, a[href], input, select, textarea");
    if (!focusables.length) return;
    var first = focusables[0];
    var last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }
});

/* Индикатор прокрутки: высота страницы кешируется, запись — через rAF,
   изменение transform не вызывает пересчёт раскладки */
var scrollMax = 0;
var scrollTicking = false;

function updateScrollMax() {
  scrollMax = document.documentElement.scrollHeight - window.innerHeight;
}

document.addEventListener("scroll", function () {
  if (scrollTicking) return;
  scrollTicking = true;
  requestAnimationFrame(function () {
    var p = scrollMax > 0 ? (window.scrollY / scrollMax) : 0;
    document.getElementById("scroll-progress").style.transform = "scaleX(" + p + ")";
    scrollTicking = false;
  });
}, { passive: true });

window.addEventListener("resize", updateScrollMax);

document.addEventListener("DOMContentLoaded", function () {
  renderDayOptions();
  updateScrollMax();
  renderSchedule();
});
