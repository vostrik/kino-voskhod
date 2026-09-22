var SESSIONS = generateSessions();

var DAYS = (function () {
  var arr = [];
  var start = new Date();
  start.setHours(0, 0, 0, 0);
  for (var d = 0; d < 7; d++) arr.push(new Date(start.getTime() + d * 86400000));
  return arr;
})();

var state = { day: dayKey(DAYS[0]), hall: "all" };

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

function computePopularity(snapshot) {
  var rating = {};
  for (var i = 0; i < snapshot.length; i++) {
    var film = findFilm(snapshot[i].filmId);
    if (!rating[film.id]) rating[film.id] = 0;
    rating[film.id] += snapshot[i].seatsTotal - snapshot[i].seatsFree;
  }
  return rating;
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
  var snapshot = JSON.parse(JSON.stringify(SESSIONS));
  var popularity = computePopularity(snapshot);

  var list = snapshot.filter(function (s) {
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
    return popularity[b] - popularity[a];
  });

  var html = "";
  for (var f = 0; f < filmIds.length; f++) {
    var film = findFilm(Number(filmIds[f]));
    var sessions = groups[filmIds[f]];
    var chips = "";
    for (var c = 0; c < sessions.length; c++) {
      var s = sessions[c];
      chips += '<div class="' + sessionClass(s) + '" onclick="openModal(' + s.id + ')" title="' + findHall(s.hallId).name + '">'
        + '<span class="session__time">' + s.time + "</span>"
        + '<span class="session__price">' + s.price + " ₽</span>"
        + '<span class="session__fmt">' + s.format + "</span>"
        + "</div>";
    }
    html += '<article class="card">'
      + '<div class="card__poster"><img src="https://loremflickr.com/500/750/cinema?lock=' + film.id + '"'
      + (film.altText ? ' alt="' + film.altText + '"' : "") + "></div>"
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
}

function onDayChange() {
  state.day = document.getElementById("day-select").value;
  renderSchedule();
}

function onHallChange() {
  state.hall = document.getElementById("hall-select").value;
  renderSchedule();
}

function openModal(id) {
  var s = null;
  for (var i = 0; i < SESSIONS.length; i++) {
    if (SESSIONS[i].id === id) { s = SESSIONS[i]; break; }
  }
  if (!s) return;
  if (s.seatsFree === 0) {
    alert("На этот сеанс мест нет. Выберите другой сеанс.");
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
  document.getElementById("modal").classList.remove("hidden");
}

function closeModal() {
  document.getElementById("modal").classList.add("hidden");
}

document.addEventListener("scroll", function () {
  var h = document.documentElement.scrollHeight - window.innerHeight;
  var p = h > 0 ? (window.scrollY / h) * 100 : 0;
  document.getElementById("scroll-progress").style.width = p + "%";
});

window.addEventListener("resize", renderSchedule);

document.addEventListener("DOMContentLoaded", function () {
  renderDayOptions();
  renderSchedule();
});
