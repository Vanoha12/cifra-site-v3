/* Порядок объектов = порядок карточек на витрине. */
const CATALOG_DATA = [
  {
    id: "pechat-foto",
    type: "Печать фото",
    title: "Печать фотографий",
    priceFrom: 50,
    from: true,
    badge: "online",
    image: "assets/img/print-photo.svg",
    imagePosition: "84% 50%",
    active: true,
    form: "print-photo",
    sizes: [
      { id: "10x15", label: "10×15", w: 10, h: 15, standard: 50, premium: 80 },
      { id: "13x18", label: "13×18", w: 13, h: 18, standard: 100, premium: 200 },
      { id: "15x21", label: "15×21", w: 15, h: 21, standard: 100, premium: 200 },
      { id: "21x30", label: "21×30", format: "A4", w: 21, h: 30, standard: 200, premium: 350 },
      { id: "30x40", label: "30×40", format: "A3", w: 30, h: 40, standard: 750, premium: 1500 },
      { id: "40x60", label: "40×60", format: "A2", w: 40, h: 60, standard: 2000, premium: null },
      { id: "60x90", label: "60×90", format: "A1", w: 60, h: 90, standard: 2500, premium: null }
    ]
  },
  {
    id: "foto-na-dokumenty",
    type: "Документы",
    title: "Фото на документы",
    priceFrom: 750,
    from: false,
    badge: "office",
    image: "assets/img/photo-documents.svg",
    imagePosition: "50% 42%",
    active: true,
    form: "doc-photo"
  },
  {
    id: "pechat-dokumentov",
    type: "Документы",
    title: "Печать документов A4",
    priceFrom: 25,
    from: true,
    badge: "online",
    image: "assets/img/document-print.svg",
    imagePosition: "55% 55%",
    active: true,
    form: "print-doc"
  },
  {
    id: "kopirovanie-skanirovanie",
    type: "Документы",
    title: "Копирование и сканирование",
    priceFrom: 50,
    from: true,
    badge: "office",
    image: "assets/img/copy-scan.svg",
    imagePosition: "50% 40%",
    active: false
  },
  {
    id: "laminovanie",
    type: "Оформление",
    title: "Ламинирование",
    priceFrom: 250,
    from: true,
    badge: "office",
    image: "assets/img/lamination.svg",
    imagePosition: "50% 50%",
    active: false
  },
  {
    id: "sshivanie-dokumentov",
    type: "Документы",
    title: "Сшивание документов",
    priceFrom: 500,
    from: true,
    badge: "office",
    image: "assets/img/binding.svg",
    imagePosition: "50% 50%",
    active: false
  },
  {
    id: "retush-restavratsiya",
    type: "Реставрация",
    title: "Ретушь и реставрация",
    priceFrom: 300,
    from: true,
    badge: "request",
    image: "assets/img/restoration.svg",
    imagePosition: "50% 35%",
    active: false
  },
  {
    id: "holst-poster",
    type: "Декор",
    title: "Холст и постер",
    priceFrom: 750,
    from: true,
    badge: "request",
    image: "assets/img/canvas.svg",
    imagePosition: "50% 35%",
    active: false
  },
  {
    id: "poligrafiya",
    type: "Полиграфия",
    title: "Полиграфия",
    priceFrom: 2000,
    from: true,
    badge: "request",
    image: "assets/img/polygraphy.svg",
    imagePosition: "50% 50%",
    active: false
  },
  {
    id: "suveniry",
    type: "Подарки",
    title: "Сувениры",
    priceFrom: 300,
    from: true,
    badge: "request",
    image: "assets/img/souvenirs.svg",
    imagePosition: "55% 50%",
    active: false
  },
  {
    id: "otsifrovka",
    type: "Оцифровка",
    title: "Оцифровка",
    priceFrom: 750,
    from: true,
    badge: "office",
    image: "assets/img/digitization.svg",
    imagePosition: "50% 55%",
    active: false
  }
];

const BADGE_LABELS = {
  online: "Онлайн",
  request: "По заявке",
  office: "В офисе"
};

window.CATALOG_DATA = CATALOG_DATA;
window.BADGE_LABELS = BADGE_LABELS;
