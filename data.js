var FILMS = [
  {
    id: 1,
    title: "Свет далёких окон",
    genre: "драма",
    duration: 132,
    ageRating: "16+",
    seed: "voskhod-01",
    altText: null,
    description: "История семьи, которая возвращается в дом у моря после долгих лет разлуки. Тихое кино о взрослении и прощении."
  },
  {
    id: 2,
    title: "Тихая станция",
    genre: "триллер",
    duration: 118,
    ageRating: "16+",
    seed: "voskhod-02",
    altText: "постер",
    description: "Ночная смена дежурного по станции оборачивается погоней за незнакомцем, которого не видит никто, кроме него."
  },
  {
    id: 3,
    title: "Лето кончится завтра",
    genre: "мелодрама",
    duration: 96,
    ageRating: "12+",
    seed: "voskhod-03",
    altText: "постер",
    description: "Последние три дня каникул, один велосипед на двоих и договорённость не расставаться."
  },
  {
    id: 4,
    title: "Город под водой",
    genre: "фантастика",
    duration: 141,
    ageRating: "12+",
    seed: "voskhod-04",
    altText: "постер",
    description: "Через сто лет после потопа картографы спускаются на дно, чтобы найти улицу, которой нет ни на одной карте."
  },
  {
    id: 5,
    title: "Девять писем",
    genre: "драма",
    duration: 104,
    ageRating: "16+",
    seed: "voskhod-05",
    altText: "постер",
    description: "Разбирая архив, девушка находит девять писем, адресованных ей самой, — от человека, которого она не помнит."
  },
  {
    id: 6,
    title: "Хозяин маяка",
    genre: "детектив",
    duration: 127,
    ageRating: "16+",
    seed: "voskhod-06",
    altText: "постер",
    description: "Смотритель маяка не выходит на связь четвёртые сутки. Инспектор приезжает на остров и понимает, что опоздал."
  },
  {
    id: 7,
    title: "Полдень в степи",
    genre: "вестерн",
    duration: 139,
    ageRating: "18+",
    seed: "voskhod-07",
    altText: "постер",
    description: "Степь, жара и поезд, который придёт только вечером. У двоих в придорожной харчевне есть шесть часов, чтобы решить старый спор."
  },
  {
    id: 8,
    title: "Карты и компас",
    genre: "анимация",
    duration: 88,
    ageRating: "6+",
    seed: "voskhod-08",
    altText: "постер",
    description: "Ёж-картограф и лиса-штурман отправляются за край болота, чтобы узнать, правда ли там начинается море."
  },
  {
    id: 9,
    title: "Зимняя дорога",
    genre: "приключения",
    duration: 112,
    ageRating: "12+",
    seed: "voskhod-09",
    altText: "постер",
    description: "Дети из таёжного посёлка едут через перевал за учителем, который не вернулся из города к началу учебного года."
  },
  {
    id: 10,
    title: "Чужие письмена",
    genre: "хоррор",
    duration: 99,
    ageRating: "18+",
    seed: "voskhod-10",
    altText: "постер",
    description: "Лингвист переводит табличку, найденную при ремонте дома. Каждое правильно переведённое слово кто-то произносит вслух."
  }
];

var HALLS = [
  { id: "big", name: "Большой зал", seats: 320 },
  { id: "small", name: "Малый зал", seats: 96 },
  { id: "vip", name: "VIP-зал", seats: 24 }
];

function pad(n) {
  return (n < 10 ? "0" : "") + n;
}

function dayKey(d) {
  return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
}

function generateSessions() {
  var out = [];
  var start = new Date();
  start.setHours(0, 0, 0, 0);
  for (var d = 0; d < 7; d++) {
    var date = new Date(start.getTime() + d * 86400000);
    for (var fi = 0; fi < FILMS.length; fi++) {
      var shows = 3 + (fi % 3);
      for (var s = 0; s < shows; s++) {
        var hour = 10 + ((fi * 3 + s * 4 + d) % 12);
        var minute = (s % 2) * 30;
        var hall = HALLS[(fi + s + d) % HALLS.length];
        var seatsFree = (fi * 17 + s * 31 + d * 13) % (hall.seats + 1);
        var price = 250 + ((fi * 40 + s * 60 + d * 20) % 500);
        out.push({
          id: out.length + 1,
          filmId: FILMS[fi].id,
          hallId: hall.id,
          dateKey: dayKey(date),
          time: pad(hour) + ":" + pad(minute),
          price: Math.round(price / 10) * 10,
          seatsFree: seatsFree,
          seatsTotal: hall.seats,
          format: hall.id === "vip" ? "2D" : (s % 3 === 0 ? "3D" : (s % 3 === 1 ? "2D" : "IMAX"))
        });
      }
    }
  }
  return out;
}
