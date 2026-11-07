(function () {
  "use strict";

  const catalog = window.CATALOG_DATA || [];
  const badgeLabels = window.BADGE_LABELS || {};
  const photoCard = catalog.find(function (item) {
    return item.id === "pechat-foto";
  });
  const sizes = photoCard ? photoCard.sizes : [];

  const FINISH_LABELS = { gloss: "Глянец", matte: "Матовая" };
  const QUALITY_LABELS = { standard: "Стандарт", premium: "Премиум" };
  const FINISH_NOTES = {
    gloss: "Глянец — ярче цвета, но заметны блики и отпечатки. Для пейзажей и рамок.",
    matte: "Матовая — меньше бликов, цвета мягче. Для портретов и альбомов."
  };
  const QUALITY_NOTES = {
    standard: "Стандарт — плотная фотобумага для альбомов и домашней печати.",
    premium: "Премиум — более плотная фотобумага, ярче и чётче. Для рамки и подарка."
  };
  const MAX_FILES = 30;
  const MAX_FILE_BYTES = 25 * 1024 * 1024;
  const MAX_TOTAL_BYTES = 80 * 1024 * 1024;
  const DOC_PRICES = { bw: 25, color: 50 };
  const DOC_COLOR_LABELS = { bw: "Ч/б", color: "Цветная" };
  const DOC_COLOR_NOTES = {
    bw: "Ч/б — для текстов, договоров и справок. 25 ₽ за лист.",
    color: "Цветная — для схем, фотографий и презентаций. 50 ₽ за лист."
  };

  const numberFormat = new Intl.NumberFormat("ru-RU");

  const ICONS = {
    trash:
      '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M4 7h16M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7m2 0v12a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V7"/><path d="M10 11v6M14 11v6"/></svg>',
    warn:
      '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M12 4 3.5 19h17L12 4Z"/><path d="M12 9v4.5M12 16.5h.01"/></svg>',
    check:
      '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>',
    upload:
      '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5"/><path d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3"/></svg>',
    bag:
      '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M5 8h14l1 12H4L5 8Z"/><path d="M9 9V6.5a3 3 0 0 1 6 0V9"/></svg>',
    close:
      '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="m6 6 12 12M18 6 6 18"/></svg>',
    arrow:
      '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
    pencil:
      '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="m4 20 4.4-.9L19 8.5a2.1 2.1 0 0 0-3-3L5.4 16.1 4 20Z"/><path d="m13.5 6.5 3 3"/></svg>',
    rotate:
      '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M20 11a8 8 0 1 1-2.3-5.7"/><path d="M20 4v7h-7"/></svg>',
    reset:
      '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 11a8 8 0 1 0 2.3-5.7"/><path d="M4 4v7h7"/></svg>'
  };

  const state = {
    sizeId: sizes.length ? sizes[0].id : null,
    finish: "gloss",
    quality: "standard",
    photos: [],
    cart: [],
    photoSeq: 0,
    cartSeq: 0,
    isProcessing: false,
    crop: null,
    modalLastFocus: null,
    cartLastFocus: null,
    cropLastFocus: null,
    docPhotoLastFocus: null,
    docPrintLastFocus: null,
    docFiles: [],
    docColor: "bw",
    docSeq: 0,
    orderLastFocus: null,
    orderSuccess: false,
    orderArchiveUrl: null,
    orderArchiveName: "",
    orderProcessing: false
  };

  const els = {};
  const toastRecords = new Map();

  function cacheElements() {
    els.grid = document.getElementById("catalogGrid");
    els.headerCart = document.querySelector("[data-open-cart]");
    els.modal = document.getElementById("printModal");
    els.modalDialog = els.modal.querySelector(".modal-dialog");
    els.modalClose = els.modal.querySelector(".modal-head [data-close-modal]");
    els.modalTitle = document.getElementById("printModalTitle");
    els.modalPrice = document.getElementById("printModalPrice");
    els.sizeGrid = document.getElementById("sizeGrid");
    els.finishGroup = document.getElementById("finishGroup");
    els.finishNote = document.getElementById("finishNote");
    els.qualityGroup = document.getElementById("qualityGroup");
    els.qualityNote = document.getElementById("qualityNote");
    els.dropzone = document.getElementById("dropzone");
    els.fileInput = document.getElementById("fileInput");
    els.photoList = document.getElementById("photoList");
    els.photoEmpty = document.getElementById("photoEmpty");
    els.photoCount = document.getElementById("photoCount");
    els.summaryCount = document.getElementById("summaryCount");
    els.summaryConfig = document.getElementById("summaryConfig");
    els.summaryTotal = document.getElementById("summaryTotal");
    els.addToCart = document.getElementById("addToCart");
    els.cart = document.getElementById("cartDrawer");
    els.cartPanel = els.cart.querySelector(".cart-panel");
    els.cartClose = els.cart.querySelector(".cart-head [data-close-cart]");
    els.cartList = document.getElementById("cartList");
    els.cartEmpty = document.getElementById("cartEmpty");
    els.cartCount = document.getElementById("cartCount");
    els.cartTotal = document.getElementById("cartTotal");
    els.checkout = document.getElementById("checkout");
    els.checkoutNote = document.getElementById("checkoutNote");
    els.orderModal = document.getElementById("orderModal");
    els.orderDialog = document.getElementById("orderDialog");
    els.orderClose = els.orderModal.querySelector(".modal-head [data-close-order]");
    els.orderForm = document.getElementById("orderForm");
    els.orderOffice = document.getElementById("orderOffice");
    els.orderName = document.getElementById("orderName");
    els.orderPhone = document.getElementById("orderPhone");
    els.orderComment = document.getElementById("orderComment");
    els.orderConsent = document.getElementById("orderConsent");
    els.orderOfficeError = document.getElementById("orderOfficeError");
    els.orderNameError = document.getElementById("orderNameError");
    els.orderPhoneError = document.getElementById("orderPhoneError");
    els.orderConsentError = document.getElementById("orderConsentError");
    els.orderTitle = document.getElementById("orderTitle");
    els.orderTotal = document.getElementById("orderTotal");
    els.orderSuccess = document.getElementById("orderSuccess");
    els.orderSuccessOffice = document.getElementById("orderSuccessOffice");
    els.orderSuccessTotal = document.getElementById("orderSuccessTotal");
    els.orderArchiveNote = document.getElementById("orderArchiveNote");
    els.downloadOrderArchive = document.getElementById("downloadOrderArchive");
    els.orderSubmit = els.orderForm.querySelector('button[type="submit"]');
    els.cropOverlay = document.getElementById("cropOverlay");
    els.cropPanel = els.cropOverlay.querySelector(".crop-panel");
    els.cropClose = els.cropOverlay.querySelector(".crop-head [data-close-crop]");
    els.cropPhotoName = document.getElementById("cropPhotoName");
    els.cropSize = document.getElementById("cropSize");
    els.cropResolution = document.getElementById("cropResolution");
    els.cropQuality = document.getElementById("cropQuality");
    els.cropWarning = document.getElementById("cropWarning");
    els.cropStage = document.getElementById("cropStage");
    els.cropCanvas = document.getElementById("cropCanvas");
    els.cropWrap = document.getElementById("cropCanvasArea");
    els.cropZoom = document.getElementById("cropZoom");
    els.cropZoomLabel = document.getElementById("cropZoomLabel");
    els.cropAngle = document.getElementById("cropAngle");
    els.cropHint = document.getElementById("cropHint");
    els.cropRotate = document.getElementById("cropRotate");
    els.cropReset = document.getElementById("cropReset");
    els.cropModeButtons = Array.from(els.cropOverlay.querySelectorAll("[data-mode]"));
    els.cropApply = els.cropOverlay.querySelector("[data-apply-crop]");
    els.cropNav = document.getElementById("cropNav");
    els.cropPrev = document.getElementById("cropPrev");
    els.cropNext = document.getElementById("cropNext");
    els.cropNavLabel = document.getElementById("cropNavLabel");
    els.docPhotoModal = document.getElementById("docPhotoModal");
    els.docPhotoDialog = document.getElementById("docPhotoDialog");
    els.docPhotoClose = els.docPhotoModal.querySelector(".modal-head [data-close-doc-photo]");
    els.docPrintModal = document.getElementById("docPrintModal");
    els.docPrintDialog = document.getElementById("docPrintDialog");
    els.docPrintClose = els.docPrintModal.querySelector(".modal-head [data-close-doc-print]");
    els.docColorGroup = document.getElementById("docColorGroup");
    els.docColorNote = document.getElementById("docColorNote");
    els.docPriceNote = document.getElementById("docPriceNote");
    els.docDropzone = document.getElementById("docDropzone");
    els.docFileInput = document.getElementById("docFileInput");
    els.docList = document.getElementById("docList");
    els.docEmpty = document.getElementById("docEmpty");
    els.docCount = document.getElementById("docCount");
    els.docSummaryCount = document.getElementById("docSummaryCount");
    els.docSummaryConfig = document.getElementById("docSummaryConfig");
    els.docTotal = document.getElementById("docTotal");
    els.docAddToCart = document.getElementById("docAddToCart");
    els.toasts = document.getElementById("toastContainer");
  }

  function money(value) {
    return numberFormat.format(value) + " ₽";
  }

  function plural(count, one, few, many) {
    const mod10 = count % 10;
    const mod100 = count % 100;
    if (mod10 === 1 && mod100 !== 11) return one;
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return few;
    return many;
  }

  function sizeTitle(size) {
    return size.label + (size.format ? " (" + size.format + ")" : "");
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, function (character) {
      return {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
      }[character];
    });
  }

  function selectedSize() {
    return sizes.find(function (size) {
      return size.id === state.sizeId;
    }) || sizes[0];
  }

  function unitPrice() {
    const size = selectedSize();
    return state.quality === "premium" && size.premium ? size.premium : size.standard;
  }

  function ensureCrop(photo, size) {
    if (!photo.crops[size.id]) {
      photo.crops[size.id] = {
        zoom: CropEditor.defaults.zoom,
        offsetX: CropEditor.defaults.offsetX,
        offsetY: CropEditor.defaults.offsetY,
        rotation: CropEditor.defaults.rotation,
        mode: CropEditor.defaults.mode,
        touched: false
      };
    }
    return photo.crops[size.id];
  }

  /* Новый размер наследует текущий кадр, пока его не настроили отдельно.
     Уже настроенный размер хранит собственный кадр. */
  function inheritCropForSize(previousSize, nextSize) {
    if (!previousSize || !nextSize || previousSize.id === nextSize.id) return;

    state.photos.forEach(function (photo) {
      const source = photo.crops[previousSize.id];
      if (!source) return;

      const target = photo.crops[nextSize.id];
      const targetIsUntouched = !target || (!target.touched && !isCropCustomized(target));
      if (!targetIsUntouched) return;

      const inherited = snapshotCrop(source);
      inherited.touched = isCropCustomized(source);
      photo.crops[nextSize.id] = inherited;
      delete photo.previewCache[nextSize.id];
    });
  }

  function isCropCustomized(crop) {
    const defaults = CropEditor.defaults;
    return (
      Math.abs(crop.zoom - defaults.zoom) > 0.0001 ||
      Math.abs(crop.offsetX - defaults.offsetX) > 0.0001 ||
      Math.abs(crop.offsetY - defaults.offsetY) > 0.0001 ||
      crop.rotation !== defaults.rotation ||
      crop.mode !== defaults.mode
    );
  }

  function getPhotoPreview(photo, size) {
    if (!photo.previewCache[size.id]) {
      const preview = CropEditor.renderPreview(
        photo.image,
        ensureCrop(photo, size),
        size.w / size.h,
        240
      );
      photo.previewCache[size.id] = preview || photo.url;
    }
    return photo.previewCache[size.id];
  }

  function getPhoto(photoId) {
    return state.photos.find(function (photo) {
      return photo.id === photoId;
    });
  }

  function renderCatalog() {
    els.grid.innerHTML = catalog
      .map(function (item, index) {
        const badge = badgeLabels[item.badge] || item.badge;
        const price = (item.from === false ? "" : "от ") + money(item.priceFrom);
        const label = item.active
          ? "Открыть карточку «" + item.title + "»"
          : "«" + item.title + "» — демо-карточка";

        return (
          '<article class="card' +
          (item.active ? " card--active" : "") +
          '" data-card-id="' +
          item.id +
          '" style="--card-index:' +
          index +
          '">' +
          '<button class="card-button" type="button" aria-label="' +
          escapeHtml(label) +
          '">' +
          '<span class="card-media">' +
          '<img src="' +
          item.image +
          '" alt="" decoding="sync" style="object-position:' +
          (item.imagePosition || "50% 50%") +
          '">' +
          '<span class="badge badge--' +
          item.badge +
          '"><span class="badge-dot"></span>' +
          badge +
          "</span>" +
          "</span>" +
          '<span class="card-body">' +
          '<span class="card-type">' +
          item.type +
          "</span>" +
          '<span class="card-title">' +
          item.title +
          "</span>" +
          '<span class="card-foot">' +
          '<span class="card-price">' +
          price +
          "</span>" +
          '<span class="card-arrow" aria-hidden="true">' +
          ICONS.arrow +
          "</span>" +
          "</span>" +
          "</span>" +
          "</button>" +
          "</article>"
        );
      })
      .join("");
  }

  function renderSizes() {
    els.sizeGrid.innerHTML = sizes
      .map(function (size) {
        const active = size.id === state.sizeId;
        return (
          '<button type="button" class="size-option' +
          (active ? " is-active" : "") +
          '" data-size-id="' +
          size.id +
          '" aria-pressed="' +
          active +
          '">' +
          '<span class="size-top"><span class="size-name">' +
          size.label +
          (size.format ? ' <span class="size-format">(' + size.format + ")</span>" : "") +
          '</span><span class="size-price">' +
          money(size.standard) +
          "</span></span>" +
          '<span class="size-premium">' +
          (size.premium ? "премиум " + money(size.premium) : "только стандарт") +
          "</span>" +
          "</button>"
        );
      })
      .join("");
  }

  function renderFinish() {
    els.finishGroup.querySelectorAll("[data-finish]").forEach(function (button) {
      const active = button.dataset.finish === state.finish;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });

    els.finishNote.textContent = FINISH_NOTES[state.finish];
  }

  function renderQuality() {
    const size = selectedSize();

    if (!size.premium && state.quality === "premium") {
      state.quality = "standard";
    }

    els.qualityGroup.innerHTML =
      '<button type="button" class="segmented-btn' +
      (state.quality === "standard" ? " is-active" : "") +
      '" data-quality="standard" aria-pressed="' +
      (state.quality === "standard") +
      '"><span>Стандарт</span><span class="segmented-price">' +
      money(size.standard) +
      "</span></button>" +
      '<button type="button" class="segmented-btn' +
      (state.quality === "premium" ? " is-active" : "") +
      '" data-quality="premium" aria-pressed="' +
      (state.quality === "premium") +
      '"' +
      (size.premium ? "" : " disabled") +
      '><span>Премиум</span><span class="segmented-price">' +
      (size.premium ? money(size.premium) : "—") +
      "</span></button>";

    els.qualityNote.textContent = size.premium
      ? QUALITY_NOTES[state.quality]
      : "Стандарт — плотная фотобумага. Для этого размера премиум недоступен.";
  }

  function updateSummary() {
    const size = selectedSize();
    const prints = state.photos.reduce(function (sum, photo) {
      return sum + photo.qty;
    }, 0);
    const total = prints * unitPrice();

    els.summaryCount.textContent =
      state.photos.length +
      " фото · " +
      prints +
      " " +
      plural(prints, "отпечаток", "отпечатка", "отпечатков");
    els.summaryConfig.textContent =
      sizeTitle(size) + " · " + FINISH_LABELS[state.finish] + " · " + QUALITY_LABELS[state.quality];
    els.summaryTotal.textContent = money(total);
    els.addToCart.disabled = state.photos.length === 0;
  }

  function updateUploadCount() {
    els.photoCount.textContent = state.photos.length + " / " + MAX_FILES;
    els.dropzone.classList.toggle("is-full", state.photos.length >= MAX_FILES);
  }

  function photoRowTemplate(photo) {
    const size = selectedSize();
    const crop = ensureCrop(photo, size);
    const lowResolution = CropEditor.isLowResolution(photo.image, size);
    const required = CropEditor.sizePixels(size);
    const customized = isCropCustomized(crop);

    return (
      '<article class="photo-item" data-photo-id="' +
      photo.id +
      '">' +
      '<div class="photo-thumb"><img src="' +
      getPhotoPreview(photo, size) +
      '" alt=""></div>' +
      '<div class="photo-main">' +
      '<div class="photo-line">' +
      '<span class="photo-name" title="' +
      escapeHtml(photo.name) +
      '">' +
      escapeHtml(photo.name) +
      "</span>" +
      '<span class="photo-dims">' +
      photo.width +
      " × " +
      photo.height +
      " px</span>" +
      "</div>" +
      (lowResolution
        ? '<div class="photo-warning">' +
          ICONS.warn +
          "<span>Низкое разрешение · нужно ≈ " +
          required.w +
          " × " +
          required.h +
          " px</span></div>"
        : "") +
      '<div class="photo-tools">' +
      '<div class="qty" role="group" aria-label="Количество экземпляров">' +
      '<button type="button" class="qty-btn" data-qty="-1" aria-label="Уменьшить количество"' +
      (photo.qty <= 1 ? " disabled" : "") +
      ">−</button>" +
      '<span class="qty-value" data-qty-value>' +
      photo.qty +
      "</span>" +
      '<button type="button" class="qty-btn" data-qty="1" aria-label="Увеличить количество"' +
      (photo.qty >= 99 ? " disabled" : "") +
      ">+</button>" +
      "</div>" +
      '<button type="button" class="btn btn-ghost btn-sm crop-btn' +
      (customized ? " is-custom" : "") +
      '" data-crop aria-label="' +
      (customized ? "Кадр изменён — открыть редактор" : "Изменить кадр") +
      '">' +
      (customized ? ICONS.check : ICONS.pencil) +
      "<span>" +
      (customized ? "Изменено" : "Изменить") +
      "</span></button>" +
      '<button type="button" class="icon-btn icon-btn--danger" data-remove-photo aria-label="Удалить фото">' +
      ICONS.trash +
      "</button>" +
      "</div>" +
      "</div>" +
      "</article>"
    );
  }

  function renderPhotos() {
    const hasPhotos = state.photos.length > 0;
    els.photoList.hidden = !hasPhotos;
    els.photoEmpty.hidden = hasPhotos;
    els.photoList.innerHTML = state.photos.map(photoRowTemplate).join("");
    updateUploadCount();
    updateSummary();
  }

  function syncBodyLock() {
    const locked =
      els.modal.classList.contains("is-open") ||
      els.docPhotoModal.classList.contains("is-open") ||
      els.docPrintModal.classList.contains("is-open") ||
      els.orderModal.classList.contains("is-open") ||
      els.cart.classList.contains("is-open") ||
      els.cropOverlay.classList.contains("is-open");

    document.body.classList.toggle("is-locked", locked);

    if (locked) {
      const scrollbar = window.innerWidth - document.documentElement.clientWidth;
      document.documentElement.style.setProperty("--scrollbar-width", scrollbar + "px");
    } else {
      document.documentElement.style.removeProperty("--scrollbar-width");
    }
  }

  function isVisible(element) {
    if (!element || !element.isConnected) return false;
    const rect = element.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0 && window.getComputedStyle(element).visibility !== "hidden";
  }

  function focusIfPossible(element) {
    if (isVisible(element) && typeof element.focus === "function") {
      element.focus({ preventScroll: true });
      return true;
    }
    return false;
  }

  function openPrintModal() {
    if (!photoCard || els.modal.classList.contains("is-open")) return;

    state.modalLastFocus = document.activeElement;
    els.modalTitle.textContent = photoCard.title;
    els.modalPrice.textContent = "от " + money(photoCard.priceFrom);

    renderSizes();
    renderFinish();
    renderQuality();
    renderPhotos();

    els.modal.classList.add("is-open");
    els.modal.setAttribute("aria-hidden", "false");
    syncBodyLock();

    requestAnimationFrame(function () {
      focusIfPossible(els.modalClose);
    });
  }

  function closePrintModal(options) {
    const restoreFocus = !options || options.restoreFocus !== false;
    if (!els.modal.classList.contains("is-open")) return;

    els.modal.classList.remove("is-open");
    els.modal.setAttribute("aria-hidden", "true");
    syncBodyLock();

    if (restoreFocus) {
      focusIfPossible(state.modalLastFocus) || focusIfPossible(els.headerCart);
    }
    state.modalLastFocus = null;
  }

  function openDocPhotoModal() {
    if (els.docPhotoModal.classList.contains("is-open")) return;

    state.docPhotoLastFocus = document.activeElement;
    els.docPhotoModal.classList.add("is-open");
    els.docPhotoModal.setAttribute("aria-hidden", "false");
    syncBodyLock();

    requestAnimationFrame(function () {
      focusIfPossible(els.docPhotoClose);
    });
  }

  function closeDocPhotoModal() {
    if (!els.docPhotoModal.classList.contains("is-open")) return;

    els.docPhotoModal.classList.remove("is-open");
    els.docPhotoModal.setAttribute("aria-hidden", "true");
    syncBodyLock();

    if (!focusIfPossible(state.docPhotoLastFocus)) {
      focusIfPossible(els.grid);
    }
    state.docPhotoLastFocus = null;
  }

  function openDocPrintModal() {
    if (els.docPrintModal.classList.contains("is-open")) return;

    state.docPrintLastFocus = document.activeElement;
    renderDocColor();
    renderDocFiles();
    els.docPrintModal.classList.add("is-open");
    els.docPrintModal.setAttribute("aria-hidden", "false");
    syncBodyLock();

    requestAnimationFrame(function () {
      focusIfPossible(els.docPrintClose);
    });
  }

  function closeDocPrintModal(options) {
    const restoreFocus = !options || options.restoreFocus !== false;
    if (!els.docPrintModal.classList.contains("is-open")) return;

    els.docPrintModal.classList.remove("is-open");
    els.docPrintModal.setAttribute("aria-hidden", "true");
    syncBodyLock();

    if (restoreFocus) {
      focusIfPossible(state.docPrintLastFocus) || focusIfPossible(els.grid);
    }
    state.docPrintLastFocus = null;
  }

  function orderTotal() {
    return state.cart.reduce(function (sum, item) {
      return sum + item.unitPrice * item.qty;
    }, 0);
  }

  function updateOrderSummary() {
    const total = money(orderTotal());
    els.orderTotal.textContent = total;
    els.orderSuccessTotal.textContent = total;
  }

  function resetOrderForm() {
    state.orderSuccess = false;
    els.orderForm.reset();
    els.orderForm.hidden = false;
    els.orderSuccess.hidden = true;
    els.orderTitle.textContent = "Оформление заказа";
    [els.orderOffice, els.orderName, els.orderPhone, els.orderConsent].forEach(function (input) {
      input.removeAttribute("aria-invalid");
    });
    [els.orderOfficeError, els.orderNameError, els.orderPhoneError, els.orderConsentError].forEach(
      function (error) {
        error.hidden = true;
        error.textContent = "";
      }
    );
    els.orderSuccessOffice.textContent = "";
    if (state.orderArchiveUrl) {
      URL.revokeObjectURL(state.orderArchiveUrl);
      state.orderArchiveUrl = null;
    }
    state.orderArchiveName = "";
    els.orderArchiveNote.hidden = true;
    els.orderArchiveNote.textContent = "";
    els.downloadOrderArchive.hidden = true;
    updateOrderSummary();
  }

  function openOrderModal() {
    if (!state.cart.length || els.orderModal.classList.contains("is-open")) return;

    dismissToast("cart-add");
    state.orderLastFocus = document.activeElement;
    if (state.orderSuccess) resetOrderForm();
    updateOrderSummary();

    els.orderModal.classList.add("is-open");
    els.orderModal.setAttribute("aria-hidden", "false");
    syncBodyLock();

    requestAnimationFrame(function () {
      focusIfPossible(els.orderOffice);
    });
  }

  function closeOrderModal(options) {
    const restoreFocus = !options || options.restoreFocus !== false;
    if (!els.orderModal.classList.contains("is-open") || state.orderProcessing) return;

    els.orderModal.classList.remove("is-open");
    els.orderModal.setAttribute("aria-hidden", "true");
    syncBodyLock();

    if (state.orderSuccess) resetOrderForm();

    if (restoreFocus) {
      const fallback = els.cart.classList.contains("is-open") ? els.checkout : els.headerCart;
      focusIfPossible(state.orderLastFocus) || focusIfPossible(fallback);
    }
    state.orderLastFocus = null;
  }

  function setOrderError(input, error, message) {
    input.setAttribute("aria-invalid", "true");
    error.textContent = message;
    error.hidden = false;
  }

  function validateOrderForm() {
    let firstInvalid = null;

    if (!els.orderOffice.value) {
      setOrderError(els.orderOffice, els.orderOfficeError, "Выберите офис получения.");
      firstInvalid = els.orderOffice;
    } else {
      els.orderOffice.removeAttribute("aria-invalid");
      els.orderOfficeError.hidden = true;
    }

    if (els.orderName.value.trim().length < 2) {
      setOrderError(els.orderName, els.orderNameError, "Укажите ФИО.");
      if (!firstInvalid) firstInvalid = els.orderName;
    } else {
      els.orderName.removeAttribute("aria-invalid");
      els.orderNameError.hidden = true;
    }

    const phoneDigits = els.orderPhone.value.replace(/\D/g, "");
    if (phoneDigits.length < 10) {
      setOrderError(els.orderPhone, els.orderPhoneError, "Укажите телефон.");
      if (!firstInvalid) firstInvalid = els.orderPhone;
    } else {
      els.orderPhone.removeAttribute("aria-invalid");
      els.orderPhoneError.hidden = true;
    }

    if (!els.orderConsent.checked) {
      setOrderError(
        els.orderConsent,
        els.orderConsentError,
        "Подтвердите согласие на обработку персональных данных."
      );
      if (!firstInvalid) firstInvalid = els.orderConsent;
    } else {
      els.orderConsent.removeAttribute("aria-invalid");
      els.orderConsentError.hidden = true;
    }

    if (firstInvalid) {
      firstInvalid.focus();
      return false;
    }
    return true;
  }

  function safeArchiveBase(name, fallback) {
    const raw = String(name || fallback).replace(/\.[a-z0-9]{1,8}$/i, "");
    const safe = raw
      .replace(/[\\/:*?"<>|]+/g, "-")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 70);
    return safe || fallback;
  }

  function safeArchiveFileName(name, fallback) {
    const safe = String(name || fallback)
      .replace(/[\\/:*?"<>|]+/g, "-")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 90);
    return safe || fallback;
  }

  function archiveFolderPart(value) {
    return String(value == null ? "" : value)
      .replace(/[\\/:*?"<>|]+/g, "-")
      .replace(/\s+/g, " ")
      .trim();
  }

  function archiveFolderName(parts, fallback) {
    const folder = parts
      .map(archiveFolderPart)
      .filter(Boolean)
      .join("-")
      .slice(0, 90);
    return folder || fallback;
  }

  function photoArchiveFolder(archive) {
    const sizeId = archive.sizeId || "10x15";
    const finish = FINISH_LABELS[archive.finish] || "Глянец";
    const quality = QUALITY_LABELS[archive.quality] || "Стандарт";
    return archiveFolderName([sizeId, finish, quality], "Фото");
  }

  function docArchiveFolder(archive) {
    const format = archive.format || "A4";
    const color = archive.colorKey === "color" ? "Цветная" : "ЧБ";
    return archiveFolderName([format, color], "Документы-A4");
  }

  function canvasArchiveFolder(archive) {
    const sizeId = archive.sizeId || archive.size || "30x40";
    return archiveFolderName(["Холст", sizeId], "Холст");
  }

  function archiveFolderFor(item) {
    if (item.kind === "photo") return photoArchiveFolder(item.archive || {});
    if (item.kind === "doc") return docArchiveFolder(item.archive || {});
    if (item.kind === "canvas") return canvasArchiveFolder(item.archive || {});
    return archiveFolderName([item.title], "Заказ");
  }

  function archiveFolderDescription(item) {
    if (item.kind === "photo") {
      const archive = item.archive || {};
      return [
        archive.sizeLabel || "10×15",
        FINISH_LABELS[archive.finish] || "Глянец",
        QUALITY_LABELS[archive.quality] || "Стандарт"
      ].join(" · ");
    }
    if (item.kind === "doc") {
      const archive = item.archive || {};
      return (
        "Документы " +
        (archive.format || "A4") +
        " · " +
        (archive.colorKey === "color" ? "Цветная" : "Ч/б")
      );
    }
    if (item.kind === "canvas") {
      const archive = item.archive || {};
      return "Холст · " + (archive.sizeLabel || archive.sizeId || "30×40");
    }
    return item.title;
  }

  function archiveQuantityPrefix(quantity) {
    const count = Number.parseInt(quantity, 10);
    return (Number.isFinite(count) && count > 0 ? count : 1) + "_";
  }

  function uniqueArchiveFileName(used, name) {
    const dot = name.lastIndexOf(".");
    const base = dot > 0 ? name.slice(0, dot) : name;
    const extension = dot > 0 ? name.slice(dot) : "";
    let candidate = name;
    let suffix = 2;

    while (used.has(candidate.toLowerCase())) {
      candidate = base + "-" + suffix + extension;
      suffix += 1;
    }
    used.add(candidate.toLowerCase());
    return candidate;
  }

  function dataUrlToBytes(url) {
    const base64 = String(url).split(",")[1] || "";
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) {
      bytes[index] = binary.charCodeAt(index);
    }
    return bytes;
  }

  async function resourceToBytes(url) {
    if (String(url).indexOf("data:") === 0) {
      return dataUrlToBytes(url);
    }
    const response = await fetch(url);
    return new Uint8Array(await response.arrayBuffer());
  }

  function orderArchiveName() {
    const date = new Date();
    const pad = function (value) {
      return String(value).padStart(2, "0");
    };
    return (
      "cifra-order-" +
      date.getFullYear() +
      "-" +
      pad(date.getMonth() + 1) +
      "-" +
      pad(date.getDate()) +
      "_" +
      pad(date.getHours()) +
      "-" +
      pad(date.getMinutes()) +
      "-" +
      pad(date.getSeconds()) +
      ".zip"
    );
  }

  async function buildOrderArchive(orderInfo) {
    if (!window.OrderArchive) throw new Error("archive-unavailable");

    const entries = [];
    const lines = [];
    const folderStats = new Map();
    const folderNames = new Map();

    function folderUsedNames(folder) {
      if (!folderNames.has(folder)) folderNames.set(folder, new Set());
      return folderNames.get(folder);
    }

    function rememberFolder(folder, item) {
      if (!folderStats.has(folder)) {
        folderStats.set(folder, {
          files: 0,
          quantity: 0,
          description: archiveFolderDescription(item)
        });
      }
      const stat = folderStats.get(folder);
      stat.files += 1;
      stat.quantity += item.qty;
    }

    for (const item of orderInfo.items) {
      if (item.kind === "photo" && item.archive) {
        const archive = item.archive;
        let dataUrl = null;

        try {
          const imageWidth = archive.image && archive.image.naturalWidth ? archive.image.naturalWidth : 1200;
          const targetWidth = Math.max(700, Math.min(1600, imageWidth));
          dataUrl = CropEditor.renderPreview(archive.image, archive.crop, archive.ratio, targetWidth);
        } catch (error) {
          dataUrl = null;
        }

        if (!dataUrl && item.preview) dataUrl = item.preview;
        if (!dataUrl) continue;

        const folder = archiveFolderFor(item);
        const base = safeArchiveBase(archive.name, "photo");
        const fileName = uniqueArchiveFileName(
          folderUsedNames(folder),
          archiveQuantityPrefix(item.qty) + base + ".jpg"
        );
        const archivePath = folder + "/" + fileName;

        entries.push({ name: archivePath, data: await resourceToBytes(dataUrl) });
        rememberFolder(folder, item);
        lines.push(
          "- " +
            item.title +
            ": " +
            item.meta +
            "; экз.: " +
            item.qty +
            "; файл: " +
            archivePath
        );
      } else if (item.kind === "doc" && item.archive) {
        const archive = item.archive;
        const source = archive.file;

        if (!source || typeof source.arrayBuffer !== "function") {
          lines.push("- " + item.title + ": " + item.meta + "; исходный файл недоступен");
          continue;
        }

        const folder = archiveFolderFor(item);
        const fileName = uniqueArchiveFileName(
          folderUsedNames(folder),
          archiveQuantityPrefix(item.qty) + safeArchiveFileName(archive.name, "document")
        );
        const archivePath = folder + "/" + fileName;

        entries.push({
          name: archivePath,
          data: new Uint8Array(await source.arrayBuffer())
        });
        rememberFolder(folder, item);
        lines.push(
          "- " +
            item.title +
            ": " +
            item.meta +
            "; копий: " +
            item.qty +
            "; файл: " +
            archivePath
        );
      } else if (item.kind === "canvas" && item.archive) {
        const archive = item.archive;
        let dataUrl = item.preview || null;

        if (archive.image && archive.crop && archive.ratio) {
          try {
            dataUrl = CropEditor.renderPreview(archive.image, archive.crop, archive.ratio, 2400) || dataUrl;
          } catch (error) {
            dataUrl = item.preview || null;
          }
        }

        if (!dataUrl) continue;

        const folder = archiveFolderFor(item);
        const base = safeArchiveBase(archive.name, "canvas");
        const fileName = uniqueArchiveFileName(
          folderUsedNames(folder),
          archiveQuantityPrefix(item.qty) + base + ".jpg"
        );
        const archivePath = folder + "/" + fileName;

        entries.push({ name: archivePath, data: await resourceToBytes(dataUrl) });
        rememberFolder(folder, item);
        lines.push(
          "- " +
            item.title +
            ": " +
            item.meta +
            "; экз.: " +
            item.qty +
            "; файл: " +
            archivePath
        );
      }
    }

    const folderLines = Array.from(folderStats.entries()).map(function (entry) {
      const folder = entry[0];
      const stat = entry[1];
      return (
        "- " +
        folder +
        "/ — файлов: " +
        stat.files +
        ", экз.: " +
        stat.quantity +
        " (" +
        stat.description +
        ")"
      );
    });

    const manifestParts = [
      "Заказ (демо)",
      "Дата: " + new Date().toLocaleString("ru-RU"),
      "Офис: " + orderInfo.office,
      "ФИО: " + orderInfo.name,
      "Телефон: " + orderInfo.phone,
      "Комментарий: " + (orderInfo.comment || "—"),
      "Согласие на обработку персональных данных: да",
      "Итого: " + money(orderInfo.total),
      "",
      "Содержимое архива:",
      "Файлы разложены по папкам с параметрами печати.",
      "В начале имени файла — количество экземпляров: 2_фото.jpg.",
      "",
      "Папки:",
      ...folderLines,
      "",
      "Позиции:",
      ...lines
    ];
    const manifest = manifestParts.join("\r\n");

    entries.unshift({
      name: "order.txt",
      data: new TextEncoder().encode(manifest)
    });

    return window.OrderArchive.createZip(entries);
  }

  function setOrderArchive(blob, fileName) {
    if (state.orderArchiveUrl) {
      URL.revokeObjectURL(state.orderArchiveUrl);
    }
    state.orderArchiveUrl = URL.createObjectURL(blob);
    state.orderArchiveName = fileName;
    els.orderArchiveNote.hidden = false;
    els.orderArchiveNote.textContent =
      "Архив с файлами заказа готов: папки по параметрам печати, количество экземпляров в имени файла и order.txt. Если скачивание не началось автоматически, нажмите «Скачать архив заказа».";
    els.downloadOrderArchive.hidden = false;
  }

  function triggerOrderArchiveDownload() {
    if (!state.orderArchiveUrl) return;
    const link = document.createElement("a");
    link.href = state.orderArchiveUrl;
    link.download = state.orderArchiveName;
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  async function submitOrder(event) {
    event.preventDefault();
    if (state.orderProcessing || !validateOrderForm()) return;

    const orderInfo = {
      office: els.orderOffice.value,
      name: els.orderName.value.trim(),
      phone: els.orderPhone.value.trim(),
      comment: els.orderComment.value.trim(),
      total: orderTotal(),
      items: state.cart.slice()
    };

    state.orderProcessing = true;
    els.orderSubmit.disabled = true;
    els.orderSubmit.textContent = "Готовим архив…";
    els.orderForm.setAttribute("aria-busy", "true");

    let archiveBlob = null;
    try {
      archiveBlob = await buildOrderArchive(orderInfo);
    } catch (error) {
      archiveBlob = null;
    }

    state.orderProcessing = false;
    els.orderSubmit.disabled = false;
    els.orderSubmit.textContent = "Подтвердить заказ";
    els.orderForm.removeAttribute("aria-busy");

    state.orderSuccess = true;
    state.cart = [];
    renderCart();
    closeCart({ restoreFocus: false });

    els.orderTitle.textContent = "Заявка принята";
    els.orderForm.hidden = true;
    els.orderSuccess.hidden = false;
    els.orderSuccessOffice.textContent = "Офис: " + orderInfo.office;
    els.orderSuccessTotal.textContent = money(orderInfo.total);

    if (archiveBlob) {
      const fileName = orderArchiveName();
      setOrderArchive(archiveBlob, fileName);
      triggerOrderArchiveDownload();
    } else {
      els.orderArchiveNote.hidden = false;
      els.orderArchiveNote.textContent =
        "Не удалось собрать архив с файлами, но заявка принята в демо-режиме.";
    }

    requestAnimationFrame(function () {
      focusIfPossible(els.orderSuccess.querySelector("[data-close-order]"));
    });
  }

  function scrollToContacts() {
    const target = document.getElementById("contacts");
    if (!target) return;
    target.setAttribute("tabindex", "-1");
    target.focus({ preventScroll: true });
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function openCart() {
    if (els.cart.classList.contains("is-open")) return;

    state.cartLastFocus = document.activeElement;
    els.cart.classList.add("is-open");
    els.cart.setAttribute("aria-hidden", "false");
    renderCart();
    syncBodyLock();

    requestAnimationFrame(function () {
      focusIfPossible(els.cartClose);
    });
  }

  function closeCart(options) {
    const restoreFocus = !options || options.restoreFocus !== false;
    if (!els.cart.classList.contains("is-open")) return;

    els.cart.classList.remove("is-open");
    els.cart.setAttribute("aria-hidden", "true");
    syncBodyLock();

    if (restoreFocus) {
      if (!focusIfPossible(state.cartLastFocus)) {
        focusIfPossible(els.headerCart);
      }
    }
    state.cartLastFocus = null;
  }

  function snapshotCrop(crop) {
    return {
      zoom: crop.zoom,
      offsetX: crop.offsetX,
      offsetY: crop.offsetY,
      rotation: crop.rotation,
      mode: crop.mode,
      touched: crop.touched === true
    };
  }

  function updateCropNav() {
    if (!state.crop) return;

    const index = state.photos.findIndex(function (photo) {
      return photo.id === state.crop.photoId;
    });
    const total = state.photos.length;

    els.cropNav.hidden = total < 2 || index === -1;
    if (total < 2 || index === -1) return;

    els.cropNavLabel.textContent = index + 1 + " / " + total;
    els.cropNavLabel.setAttribute("aria-label", "Фото " + (index + 1) + " из " + total);
  }

  function loadCropPhoto(photo, size) {
    const crop = ensureCrop(photo, size);
    const required = CropEditor.sizePixels(size);
    const lowResolution = CropEditor.isLowResolution(photo.image, size);

    state.crop.photoId = photo.id;

    els.cropPhotoName.textContent = photo.name;
    els.cropSize.textContent = sizeTitle(size);
    els.cropResolution.textContent = photo.width + " × " + photo.height + " px";
    els.cropQuality.textContent = lowResolution
      ? "низкое разрешение для " + sizeTitle(size)
      : "разрешение достаточно для " + sizeTitle(size);
    els.cropWarning.hidden = !lowResolution;
    els.cropWarning.textContent = lowResolution
      ? "Для " +
        sizeTitle(size) +
        " при 300 dpi нужно ≈ " +
        required.w +
        " × " +
        required.h +
        " px. Можно продолжить — мы предупредим, но не заблокируем заказ."
      : "";

    updateCropNav();

    CropEditor.open({
      image: photo.image,
      state: crop,
      aspect: size.w / size.h
    });
  }

  function openCrop(photoId) {
    const photo = getPhoto(photoId);
    if (!photo) return;

    dismissToast("upload");
    dismissToast("upload-error");

    const size = selectedSize();
    const snapshots = state.photos.map(function (item) {
      return {
        photo: item,
        state: snapshotCrop(ensureCrop(item, size))
      };
    });

    state.crop = {
      photoId: photo.id,
      sizeId: size.id,
      snapshots: snapshots,
      visited: new Set([photo.id])
    };
    state.cropLastFocus = document.activeElement;

    els.cropOverlay.classList.add("is-open");
    els.cropOverlay.setAttribute("aria-hidden", "false");
    syncBodyLock();

    loadCropPhoto(photo, size);

    requestAnimationFrame(function () {
      focusIfPossible(els.cropClose);
    });
  }

  function navigateCrop(direction) {
    if (!state.crop || state.photos.length < 2) return;

    const index = state.photos.findIndex(function (photo) {
      return photo.id === state.crop.photoId;
    });
    if (index === -1) return;

    const nextIndex = (index + direction + state.photos.length) % state.photos.length;
    const nextPhoto = state.photos[nextIndex];
    if (!nextPhoto || nextPhoto.id === state.crop.photoId) return;

    state.crop.visited.add(nextPhoto.id);
    loadCropPhoto(nextPhoto, selectedSize());
  }

  function closeCrop(apply) {
    if (!state.crop) return;

    const cropInfo = state.crop;
    const size = sizes.find(function (item) {
      return item.id === cropInfo.sizeId;
    });

    if (size) {
      if (!apply) {
        cropInfo.snapshots.forEach(function (snapshot) {
          if (state.photos.indexOf(snapshot.photo) === -1) return;
          Object.assign(ensureCrop(snapshot.photo, size), snapshot.state);
        });
      } else {
        cropInfo.visited.forEach(function (photoId) {
          const photo = getPhoto(photoId);
          if (photo) delete photo.previewCache[size.id];
        });
      }
    }

    CropEditor.close();
    els.cropOverlay.classList.remove("is-open");
    els.cropOverlay.setAttribute("aria-hidden", "true");
    state.crop = null;
    syncBodyLock();
    renderPhotos();

    const row = els.photoList.querySelector('[data-photo-id="' + cropInfo.photoId + '"]');
    const cropButton = row ? row.querySelector("[data-crop]") : null;
    let restored = focusIfPossible(cropButton);

    if (!restored && state.cropLastFocus && document.contains(state.cropLastFocus)) {
      restored = focusIfPossible(state.cropLastFocus);
    }

    if (!restored) {
      focusIfPossible(els.modalClose);
    }

    state.cropLastFocus = null;
  }

  function showToast(message, options) {
    const settings = options || {};
    const key = settings.key || "message:" + message;
    const isError = settings.tone === "error";
    const duration = settings.duration || 3200;
    let record = toastRecords.get(key);
    const isNew = !record;

    if (isNew) {
      const toast = document.createElement("div");
      toast.setAttribute("role", "status");
      els.toasts.appendChild(toast);
      record = { node: toast, hideTimer: null, removeTimer: null };
      toastRecords.set(key, record);
    }

    const toast = record.node;
    window.clearTimeout(record.hideTimer);
    window.clearTimeout(record.removeTimer);
    toast.className = "toast" + (isError ? " toast--error" : "");
    toast.innerHTML =
      '<span class="toast-icon">' +
      (isError ? ICONS.warn : ICONS.check) +
      '</span><span class="toast-text">' +
      escapeHtml(message) +
      "</span>";

    if (isNew) {
      requestAnimationFrame(function () {
        toast.classList.add("is-visible");
      });
    } else {
      toast.classList.add("is-visible");
    }

    record.hideTimer = window.setTimeout(function () {
      toast.classList.remove("is-visible");
      record.removeTimer = window.setTimeout(function () {
        toast.remove();
        toastRecords.delete(key);
      }, 260);
    }, duration);
  }

  function dismissToast(key) {
    const record = toastRecords.get(key);
    if (!record) return;

    window.clearTimeout(record.hideTimer);
    window.clearTimeout(record.removeTimer);
    record.node.classList.remove("is-visible");
    record.removeTimer = window.setTimeout(function () {
      record.node.remove();
      toastRecords.delete(key);
    }, 260);
  }

  function loadImage(url) {
    return new Promise(function (resolve, reject) {
      const image = new Image();
      image.onload = function () {
        resolve(image);
      };
      image.onerror = function () {
        reject(new Error("image-load-failed"));
      };
      image.src = url;
    });
  }

  async function handleFiles(fileList) {
    if (state.isProcessing) {
      showToast("Подождите, фото ещё обрабатываются.", { key: "upload-busy" });
      return;
    }

    const files = Array.from(fileList || []);
    if (!files.length) return;

    state.isProcessing = true;
    els.dropzone.classList.add("is-busy");
    els.dropzone.setAttribute("aria-busy", "true");

    const issues = [];
    let added = 0;
    let totalBytes = state.photos.reduce(function (sum, photo) {
      return sum + photo.bytes;
    }, 0);

    for (let index = 0; index < files.length; index += 1) {
      if (state.photos.length >= MAX_FILES) {
        issues.push("Можно загрузить не более " + MAX_FILES + " фото.");
        break;
      }

      const file = files[index];
      const name = file.name || "файл";

      if (/\.(heic|heif)$/i.test(name) || /^image\/(heic|heif)$/i.test(file.type)) {
        issues.push("HEIC не поддерживается. Сохраните фото как JPG, PNG или WebP.");
        continue;
      }

      const supported =
        /^image\/(jpeg|jpg|png|webp)$/i.test(file.type) || /\.(jpe?g|png|webp)$/i.test(name);

      if (!supported) {
        issues.push("Формат файла «" + name + "» не поддерживается. Нужны JPG, PNG или WebP.");
        continue;
      }

      if (file.size > MAX_FILE_BYTES) {
        issues.push("«" + name + "» больше 25 МБ.");
        continue;
      }

      if (totalBytes + file.size > MAX_TOTAL_BYTES) {
        issues.push("Общий объём фото превышает 80 МБ.");
        continue;
      }

      const url = URL.createObjectURL(file);

      try {
        const image = await loadImage(url);
        state.photoSeq += 1;
        state.photos.push({
          id: "photo-" + Date.now() + "-" + state.photoSeq,
          name: name,
          bytes: file.size,
          url: url,
          image: image,
          width: image.naturalWidth,
          height: image.naturalHeight,
          qty: 1,
          crops: {},
          previewCache: {},
          keepUrl: false
        });
        totalBytes += file.size;
        added += 1;
      } catch (error) {
        URL.revokeObjectURL(url);
        issues.push("Не удалось прочитать «" + name + "».");
      }
    }

    state.isProcessing = false;
    els.dropzone.classList.remove("is-busy");
    els.dropzone.removeAttribute("aria-busy");

    if (added > 0) {
      renderPhotos();
      showToast(added === 1 ? "Фото добавлено" : "Добавлено фото: " + added, { key: "upload" });
    }

    if (issues.length > 0) {
      const unique = Array.from(new Set(issues));
      showToast(unique.slice(0, 2).join(" "), { key: "upload-error", tone: "error", duration: 5600 });
    }
  }

  function removePhoto(photoId) {
    const index = state.photos.findIndex(function (photo) {
      return photo.id === photoId;
    });
    if (index === -1) return;

    const photo = state.photos[index];
    if (photo.url) URL.revokeObjectURL(photo.url);
    state.photos.splice(index, 1);
    renderPhotos();
    showToast("Фото удалено", { key: "photo-remove" });
  }

  function formatBytes(bytes) {
    if (bytes < 1024 * 1024) {
      return Math.max(1, Math.round(bytes / 1024)) + " КБ";
    }
    return (
      (bytes / (1024 * 1024)).toLocaleString("ru-RU", { maximumFractionDigits: 1 }) + " МБ"
    );
  }

  function docSheetPrice() {
    return DOC_PRICES[state.docColor] || DOC_PRICES.bw;
  }

  function docExtension(name, type) {
    const match = /\.([a-z0-9]+)$/i.exec(name || "");
    if (match) return match[1].toUpperCase();
    if (/pdf/i.test(type || "")) return "PDF";
    if (/word|document/i.test(type || "")) return "DOC";
    if (/^image\//.test(type || "")) return "IMG";
    return "FILE";
  }

  function isDocImage(name, type) {
    return (
      /\.(jpe?g|png|webp)$/i.test(name || "") ||
      /^image\/(jpeg|png|webp)$/i.test(type || "")
    );
  }

  function isSupportedDoc(name, type) {
    return (
      /\.(pdf|docx?|jpe?g|png|webp)$/i.test(name || "") ||
      /^(application\/pdf|application\/msword|application\/vnd\.openxmlformats-officedocument\.wordprocessingml\.document)$/i.test(
        type || ""
      ) ||
      /^image\/(jpeg|png|webp)$/i.test(type || "")
    );
  }

  function docFileTemplate(file) {
    const pagesField = file.isImage
      ? '<div class="doc-field"><span class="doc-field-label">Страницы</span>' +
        '<span class="doc-stepper doc-stepper--static"><span class="doc-stepper-value">1</span></span></div>'
      : '<div class="doc-field"><span class="doc-field-label">Страницы</span>' +
        '<span class="doc-stepper">' +
        '<button type="button" data-doc-pages-step="-1" aria-label="Уменьшить число страниц"' +
        (file.pages <= 1 ? " disabled" : "") +
        ">−</button>" +
        '<input type="number" min="1" max="500" step="1" value="' +
        file.pages +
        '" data-doc-pages aria-label="Страниц в файле ' +
        escapeHtml(file.name) +
        '">' +
        '<button type="button" data-doc-pages-step="1" aria-label="Увеличить число страниц"' +
        (file.pages >= 500 ? " disabled" : "") +
        ">+</button>" +
        "</span></div>";

    const copiesField =
      '<div class="doc-field"><span class="doc-field-label">Копии</span>' +
      '<span class="doc-stepper">' +
      '<button type="button" data-doc-copies="-1" aria-label="Уменьшить количество копий"' +
      (file.copies <= 1 ? " disabled" : "") +
      ">−</button>" +
      '<input type="number" min="1" max="99" step="1" value="' +
      file.copies +
      '" data-doc-copies-input aria-label="Количество копий файла ' +
      escapeHtml(file.name) +
      '">' +
      '<button type="button" data-doc-copies="1" aria-label="Увеличить количество копий"' +
      (file.copies >= 99 ? " disabled" : "") +
      ">+</button>" +
      "</span></div>";

    return (
      '<article class="photo-item doc-item" data-doc-id="' +
      file.id +
      '">' +
      '<div class="doc-type">' +
      file.ext +
      "</div>" +
      '<div class="photo-main">' +
      '<div class="photo-line">' +
      '<span class="photo-name" title="' +
      escapeHtml(file.name) +
      '">' +
      escapeHtml(file.name) +
      "</span>" +
      '<span class="photo-dims"><span>' +
      formatBytes(file.size) +
      '</span> · <b class="doc-line-total" data-doc-line-total>' +
      money(docSheetPrice() * file.pages * file.copies) +
      "</b></span>" +
      '<button type="button" class="icon-btn icon-btn--danger doc-remove" data-doc-remove aria-label="Удалить файл">' +
      ICONS.trash +
      "</button>" +
      "</div>" +
      '<div class="photo-tools">' +
      pagesField +
      copiesField +
      "</div>" +
      "</div>" +
      "</article>"
    );
  }

  function updateDocSummary() {
    const files = state.docFiles.length;
    const sheets = state.docFiles.reduce(function (sum, file) {
      return sum + file.pages * file.copies;
    }, 0);
    const total = sheets * docSheetPrice();

    els.docSummaryCount.textContent =
      files +
      " " +
      plural(files, "файл", "файла", "файлов") +
      " · " +
      sheets +
      " " +
      plural(sheets, "лист", "листа", "листов");
    els.docSummaryConfig.textContent = "A4 · " + DOC_COLOR_LABELS[state.docColor];
    els.docTotal.textContent = money(total);
    els.docAddToCart.disabled = files === 0;
  }

  function renderDocColor() {
    els.docColorGroup.querySelectorAll("[data-doc-color]").forEach(function (button) {
      const active = button.dataset.docColor === state.docColor;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    els.docColorNote.textContent = DOC_COLOR_NOTES[state.docColor];
    els.docPriceNote.textContent = "A4 · " + money(docSheetPrice()) + " / лист";
    state.docFiles.forEach(function (file) {
      const row = els.docList.querySelector('[data-doc-id="' + file.id + '"]');
      if (row) updateDocFileRow(row, file);
    });
    updateDocSummary();
  }

  function renderDocFiles() {
    const hasFiles = state.docFiles.length > 0;
    els.docEmpty.hidden = hasFiles;
    els.docList.hidden = !hasFiles;
    els.docList.innerHTML = state.docFiles.map(docFileTemplate).join("");
    els.docCount.textContent = state.docFiles.length + " / " + MAX_FILES;
    els.docDropzone.classList.toggle("is-full", state.docFiles.length >= MAX_FILES);
    updateDocSummary();
  }

  function handleDocFiles(fileList) {
    const files = Array.from(fileList || []);
    if (!files.length) return;

    const issues = [];
    let added = 0;
    let totalBytes = state.docFiles.reduce(function (sum, file) {
      return sum + file.size;
    }, 0);

    files.forEach(function (file) {
      if (state.docFiles.length >= MAX_FILES) {
        issues.push("Можно загрузить не более " + MAX_FILES + " файлов.");
        return;
      }

      const name = file.name || "файл";
      if (/\.(heic|heif)$/i.test(name) || /^image\/(heic|heif)$/i.test(file.type || "")) {
        issues.push("HEIC не поддерживается. Сохраните файл как PDF, JPG или PNG.");
        return;
      }

      if (!isSupportedDoc(name, file.type)) {
        issues.push("«" + name + "» не поддерживается. Нужны PDF, Word, JPG, PNG или WebP.");
        return;
      }

      if (file.size > MAX_FILE_BYTES) {
        issues.push("«" + name + "» больше 25 МБ.");
        return;
      }

      if (totalBytes + file.size > MAX_TOTAL_BYTES) {
        issues.push("Общий объём файлов превышает 80 МБ.");
        return;
      }

      state.docSeq += 1;
      state.docFiles.push({
        id: "doc-" + Date.now() + "-" + state.docSeq,
        name: name,
        size: file.size,
        type: file.type || "",
        ext: docExtension(name, file.type),
        isImage: isDocImage(name, file.type),
        pages: 1,
        copies: 1,
        file: file
      });
      totalBytes += file.size;
      added += 1;
    });

    if (added > 0) {
      renderDocFiles();
      showToast(added === 1 ? "Файл добавлен" : "Добавлено файлов: " + added, { key: "doc-upload" });
    }

    if (issues.length > 0) {
      showToast(Array.from(new Set(issues)).slice(0, 2).join(" "), {
        key: "doc-upload-error",
        tone: "error",
        duration: 5600
      });
    }
  }

  function removeDocFile(fileId) {
    const index = state.docFiles.findIndex(function (file) {
      return file.id === fileId;
    });
    if (index === -1) return;

    state.docFiles.splice(index, 1);
    renderDocFiles();
    showToast("Файл удалён", { key: "doc-remove" });
  }

  function updateDocFileRow(row, file) {
    const copiesInput = row.querySelector("[data-doc-copies-input]");
    if (copiesInput && document.activeElement !== copiesInput) {
      copiesInput.value = file.copies;
    }

    row.querySelector('[data-doc-copies="-1"]').disabled = file.copies <= 1;
    row.querySelector('[data-doc-copies="1"]').disabled = file.copies >= 99;

    const pagesPrev = row.querySelector('[data-doc-pages-step="-1"]');
    const pagesNext = row.querySelector('[data-doc-pages-step="1"]');
    if (pagesPrev) pagesPrev.disabled = file.pages <= 1;
    if (pagesNext) pagesNext.disabled = file.pages >= 500;

    row.querySelector("[data-doc-line-total]").textContent = money(
      docSheetPrice() * file.pages * file.copies
    );
  }

  function changeDocCopies(fileId, delta) {
    const file = state.docFiles.find(function (item) {
      return item.id === fileId;
    });
    if (!file) return;

    file.copies = Math.min(99, Math.max(1, file.copies + delta));
    const row = els.docList.querySelector('[data-doc-id="' + fileId + '"]');
    if (row) updateDocFileRow(row, file);
    updateDocSummary();
  }

  function setDocCopies(fileId, value) {
    const file = state.docFiles.find(function (item) {
      return item.id === fileId;
    });
    if (!file) return;

    const parsed = Number.parseInt(value, 10);
    file.copies = Number.isFinite(parsed) && parsed > 0 ? Math.min(99, parsed) : 1;
    const row = els.docList.querySelector('[data-doc-id="' + fileId + '"]');
    if (row) updateDocFileRow(row, file);
    updateDocSummary();
  }

  function changeDocPages(fileId, value) {
    const file = state.docFiles.find(function (item) {
      return item.id === fileId;
    });
    if (!file) return;

    const parsed = Number.parseInt(value, 10);
    file.pages = Number.isFinite(parsed) && parsed > 0 ? Math.min(500, parsed) : 1;
    const row = els.docList.querySelector('[data-doc-id="' + fileId + '"]');
    if (row) updateDocFileRow(row, file);
    updateDocSummary();
  }

  function stepDocPages(fileId, delta) {
    const file = state.docFiles.find(function (item) {
      return item.id === fileId;
    });
    if (!file) return;

    file.pages = Math.min(500, Math.max(1, file.pages + delta));
    const row = els.docList.querySelector('[data-doc-id="' + fileId + '"]');
    if (row) {
      const input = row.querySelector("[data-doc-pages]");
      if (input) input.value = file.pages;
      updateDocFileRow(row, file);
    }
    updateDocSummary();
  }

  function resetDocForm() {
    state.docFiles = [];
    state.docColor = "bw";
    renderDocColor();
    renderDocFiles();
  }

  function addDocToCart() {
    if (!state.docFiles.length) return;

    const colorLabel = DOC_COLOR_LABELS[state.docColor];
    let sheets = 0;

    state.docFiles.forEach(function (file) {
      const unitPrice = docSheetPrice() * file.pages;
      state.cartSeq += 1;
      state.cart.push({
        id: "cart-" + Date.now() + "-" + state.cartSeq,
        kind: "doc",
        title: "Печать документов A4",
        meta:
          file.name +
          " · " +
          colorLabel +
          (file.pages > 1 ? " · " + file.pages + " стр." : ""),
        qty: file.copies,
        unitPrice: unitPrice,
        preview: "assets/img/document-print.svg",
        archive: {
          kind: "doc",
          file: file.file,
          name: file.name,
          pages: file.pages,
          color: colorLabel,
          colorKey: state.docColor,
          format: "A4"
        }
      });
      sheets += file.pages * file.copies;
    });

    dismissToast("doc-upload");
    dismissToast("doc-upload-error");
    closeDocPrintModal({ restoreFocus: false });
    resetDocForm();
    renderCart();
    openCart();
    showToast(
      "Добавлено в корзину: " + sheets + " " + plural(sheets, "лист", "листа", "листов"),
      { key: "cart-add" }
    );
  }

  function addToCart() {
    if (!state.photos.length) return;

    const size = selectedSize();
    const finish = FINISH_LABELS[state.finish];
    const quality = QUALITY_LABELS[state.quality];
    const price = unitPrice();
    const ratio = size.w / size.h;

    state.photos.forEach(function (photo) {
      const crop = ensureCrop(photo, size);
      let preview = CropEditor.renderPreview(photo.image, crop, ratio, 360);

      if (!preview) {
        photo.keepUrl = true;
        preview = getPhotoPreview(photo, size);
      }

      state.cartSeq += 1;
      state.cart.push({
        id: "cart-" + Date.now() + "-" + state.cartSeq,
        kind: "photo",
        title: photoCard.title,
        meta: sizeTitle(size) + " · " + finish + " · " + quality,
        qty: photo.qty,
        unitPrice: price,
        preview: preview,
        archive: {
          kind: "photo",
          image: photo.image,
          crop: snapshotCrop(crop),
          ratio: ratio,
          name: photo.name,
          sizeId: size.id,
          sizeLabel: sizeTitle(size),
          finish: state.finish,
          quality: state.quality
        }
      });
    });

    const printCount = state.photos.reduce(function (sum, photo) {
      return sum + photo.qty;
    }, 0);

    dismissToast("upload");
    closePrintModal({ restoreFocus: false });
    resetConfigurator();
    renderCart();
    openCart();
    showToast(
      "Добавлено в корзину: " +
        printCount +
        " " +
        plural(printCount, "отпечаток", "отпечатка", "отпечатков"),
      { key: "cart-add" }
    );
  }

  function resetConfigurator() {
    state.photos.forEach(function (photo) {
      if (photo.url && !photo.keepUrl) URL.revokeObjectURL(photo.url);
    });
    state.photos = [];
    state.sizeId = sizes.length ? sizes[0].id : null;
    state.finish = "gloss";
    state.quality = "standard";
    renderSizes();
    renderFinish();
    renderQuality();
    renderPhotos();
  }

  function cartMetaText(item) {
    const base = item.meta || "";
    if (item.kind !== "photo") return base;
    const prints = item.qty + " " + plural(item.qty, "отпечаток", "отпечатка", "отпечатков");
    return base + (base ? " · " : "") + prints;
  }

  function cartLineTemplate(item) {
    return (
      '<article class="cart-item" data-cart-id="' +
      item.id +
      '">' +
      '<div class="cart-thumb"><img src="' +
      (item.preview || "assets/img/print-photo.svg") +
      '" alt=""></div>' +
      '<div class="cart-main">' +
      '<div class="cart-top"><h3 class="cart-title">' +
      escapeHtml(item.title) +
      '</h3><button type="button" class="icon-btn icon-btn--danger" data-cart-remove aria-label="Удалить позицию">' +
      ICONS.trash +
      "</button></div>" +
      '<p class="cart-meta" data-cart-meta>' +
      escapeHtml(cartMetaText(item)) +
      "</p>" +
      '<div class="cart-bottom">' +
      '<div class="qty qty--sm" role="group" aria-label="' +
      (item.kind === "doc" ? "Количество копий" : "Количество") +
      '">' +
      '<button type="button" class="qty-btn" data-cart-qty="-1" aria-label="Уменьшить количество"' +
      (item.qty <= 1 ? " disabled" : "") +
      ">−</button>" +
      '<span class="qty-value" data-cart-qty-value>' +
      item.qty +
      "</span>" +
      '<button type="button" class="qty-btn" data-cart-qty="1" aria-label="Увеличить количество"' +
      (item.qty >= 99 ? " disabled" : "") +
      ">+</button>" +
      "</div>" +
      '<span class="cart-line-total" data-cart-line-total>' +
      money(item.unitPrice * item.qty) +
      "</span>" +
      "</div>" +
      "</div>" +
      "</article>"
    );
  }

  function updateCartTotals() {
    const count = state.cart.reduce(function (sum, item) {
      return sum + item.qty;
    }, 0);
    const total = state.cart.reduce(function (sum, item) {
      return sum + item.unitPrice * item.qty;
    }, 0);

    document.querySelectorAll("[data-cart-count]").forEach(function (element) {
      element.textContent = count;
    });

    els.cartCount.textContent = count;
    els.cartTotal.textContent = money(total);
    els.checkout.disabled = count === 0;

    els.headerCart.setAttribute("aria-label", "Корзина, " + count);
  }

  function renderCart() {
    if (!state.cart.length) {
      els.cartList.hidden = true;
      els.cartEmpty.hidden = false;
      els.cartList.innerHTML = "";
      els.checkoutNote.hidden = true;
    } else {
      els.cartList.hidden = false;
      els.cartEmpty.hidden = true;
      els.cartList.innerHTML = state.cart.map(cartLineTemplate).join("");
    }

    updateCartTotals();
  }

  function updateCartItemQuantity(cartId, delta) {
    const item = state.cart.find(function (cartItem) {
      return cartItem.id === cartId;
    });
    if (!item) return;

    item.qty = Math.min(99, Math.max(1, item.qty + delta));
    const row = els.cartList.querySelector('[data-cart-id="' + cartId + '"]');
    if (row) {
      row.querySelector("[data-cart-qty-value]").textContent = item.qty;
      row.querySelector("[data-cart-meta]").textContent = cartMetaText(item);
      row.querySelector("[data-cart-line-total]").textContent = money(item.unitPrice * item.qty);
      row.querySelector('[data-cart-qty="-1"]').disabled = item.qty <= 1;
      row.querySelector('[data-cart-qty="1"]').disabled = item.qty >= 99;
    }
    updateCartTotals();
  }

  function removeCartItem(cartId) {
    const index = state.cart.findIndex(function (item) {
      return item.id === cartId;
    });
    if (index === -1) return;

    state.cart.splice(index, 1);
    renderCart();
    showToast("Позиция удалена", { key: "cart-remove" });
  }

  function getTopDialog() {
    if (els.cropOverlay.classList.contains("is-open")) return els.cropPanel;
    if (els.orderModal.classList.contains("is-open")) return els.orderDialog;
    if (els.cart.classList.contains("is-open")) return els.cartPanel;
    if (els.docPhotoModal.classList.contains("is-open")) return els.docPhotoDialog;
    if (els.docPrintModal.classList.contains("is-open")) return els.docPrintDialog;
    if (els.modal.classList.contains("is-open")) return els.modalDialog;
    return null;
  }

  function trapTab(event, dialog) {
    const focusable = Array.from(
      dialog.querySelectorAll(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
    ).filter(isVisible);

    if (!focusable.length) {
      event.preventDefault();
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = document.activeElement;

    if (!dialog.contains(active)) {
      event.preventDefault();
      (event.shiftKey ? last : first).focus();
      return;
    }

    if (event.shiftKey && active === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function bindEvents() {
    els.grid.addEventListener("click", function (event) {
      const card = event.target.closest("[data-card-id]");
      if (!card) return;

      const item = catalog.find(function (catalogItem) {
        return catalogItem.id === card.dataset.cardId;
      });
      if (!item) return;

      if (item.form === "print-photo") {
        openPrintModal();
      } else if (item.form === "doc-photo") {
        openDocPhotoModal();
      } else if (item.form === "print-doc") {
        openDocPrintModal();
      } else {
        showToast("Демо-карточка", { key: "demo" });
      }
    });

    els.modal.addEventListener("click", function (event) {
      if (event.target.closest("[data-close-modal]")) {
        closePrintModal();
      }
    });

    els.docPhotoModal.addEventListener("click", function (event) {
      if (event.target.closest("[data-close-doc-photo][data-scroll-contacts]")) {
        event.preventDefault();
        closeDocPhotoModal();
        scrollToContacts();
        return;
      }

      if (event.target.closest("[data-close-doc-photo]")) {
        closeDocPhotoModal();
      }
    });

    els.docPrintModal.addEventListener("click", function (event) {
      if (event.target.closest("[data-close-doc-print]")) {
        closeDocPrintModal();
      }
    });

    els.docColorGroup.addEventListener("click", function (event) {
      const button = event.target.closest("[data-doc-color]");
      if (!button || button.dataset.docColor === state.docColor) return;

      state.docColor = button.dataset.docColor;
      renderDocColor();
    });

    els.docDropzone.addEventListener("click", function () {
      els.docFileInput.click();
    });

    els.docFileInput.addEventListener("change", function () {
      const files = Array.from(els.docFileInput.files || []);
      els.docFileInput.value = "";
      handleDocFiles(files);
    });

    ["dragenter", "dragover"].forEach(function (eventName) {
      els.docDropzone.addEventListener(eventName, function (event) {
        event.preventDefault();
        event.stopPropagation();
        els.docDropzone.classList.add("is-dragover");
      });
    });

    ["dragleave", "drop"].forEach(function (eventName) {
      els.docDropzone.addEventListener(eventName, function (event) {
        event.preventDefault();
        event.stopPropagation();
        els.docDropzone.classList.remove("is-dragover");
      });
    });

    els.docDropzone.addEventListener("drop", function (event) {
      if (event.dataTransfer && event.dataTransfer.files.length) {
        handleDocFiles(event.dataTransfer.files);
      }
    });

    els.docList.addEventListener("click", function (event) {
      const row = event.target.closest("[data-doc-id]");
      if (!row) return;

      const pagesButton = event.target.closest("[data-doc-pages-step]");
      if (pagesButton) {
        stepDocPages(row.dataset.docId, Number(pagesButton.dataset.docPagesStep));
        return;
      }

      const copiesButton = event.target.closest("[data-doc-copies]");
      if (copiesButton) {
        changeDocCopies(row.dataset.docId, Number(copiesButton.dataset.docCopies));
        return;
      }

      if (event.target.closest("[data-doc-remove]")) {
        removeDocFile(row.dataset.docId);
      }
    });

    els.docList.addEventListener("input", function (event) {
      const row = event.target.closest("[data-doc-id]");
      if (!row) return;

      if (event.target.matches("[data-doc-pages]")) {
        changeDocPages(row.dataset.docId, event.target.value);
        return;
      }

      if (event.target.matches("[data-doc-copies-input]")) {
        setDocCopies(row.dataset.docId, event.target.value);
      }
    });

    els.docList.addEventListener("focusout", function (event) {
      const row = event.target.closest("[data-doc-id]");
      if (!row) return;
      const file = state.docFiles.find(function (item) {
        return item.id === row.dataset.docId;
      });
      if (!file) return;

      if (event.target.matches("[data-doc-pages]")) {
        event.target.value = file.pages;
      } else if (event.target.matches("[data-doc-copies-input]")) {
        event.target.value = file.copies;
      }
    });

    els.docAddToCart.addEventListener("click", addDocToCart);

    els.headerCart.addEventListener("click", openCart);
    els.cart.addEventListener("click", function (event) {
      if (event.target.closest("[data-close-cart]")) {
        closeCart();
      }
    });

    els.sizeGrid.addEventListener("click", function (event) {
      const button = event.target.closest("[data-size-id]");
      if (!button || button.dataset.sizeId === state.sizeId) return;

      const previousSize = selectedSize();
      state.sizeId = button.dataset.sizeId;
      const nextSize = selectedSize();

      inheritCropForSize(previousSize, nextSize);

      if (!nextSize.premium && state.quality === "premium") {
        state.quality = "standard";
      }
      renderSizes();
      renderQuality();
      renderPhotos();
    });

    els.finishGroup.addEventListener("click", function (event) {
      const button = event.target.closest("[data-finish]");
      if (!button) return;

      state.finish = button.dataset.finish;
      renderFinish();
      updateSummary();
    });

    els.qualityGroup.addEventListener("click", function (event) {
      const button = event.target.closest("[data-quality]");
      if (!button || button.disabled) return;

      state.quality = button.dataset.quality;
      renderQuality();
      updateSummary();
    });

    els.dropzone.addEventListener("click", function () {
      els.fileInput.click();
    });

    els.fileInput.addEventListener("change", function () {
      const files = Array.from(els.fileInput.files || []);
      els.fileInput.value = "";
      handleFiles(files);
    });

    ["dragenter", "dragover"].forEach(function (eventName) {
      els.dropzone.addEventListener(eventName, function (event) {
        event.preventDefault();
        event.stopPropagation();
        els.dropzone.classList.add("is-dragover");
      });
    });

    ["dragleave", "drop"].forEach(function (eventName) {
      els.dropzone.addEventListener(eventName, function (event) {
        event.preventDefault();
        event.stopPropagation();
        els.dropzone.classList.remove("is-dragover");
      });
    });

    els.dropzone.addEventListener("drop", function (event) {
      if (event.dataTransfer && event.dataTransfer.files.length) {
        handleFiles(event.dataTransfer.files);
      }
    });

    window.addEventListener("dragover", function (event) {
      event.preventDefault();
    });

    window.addEventListener("drop", function (event) {
      event.preventDefault();
    });

    els.photoList.addEventListener("click", function (event) {
      const row = event.target.closest("[data-photo-id]");
      if (!row) return;

      const photo = getPhoto(row.dataset.photoId);
      if (!photo) return;

      const qtyButton = event.target.closest("[data-qty]");
      if (qtyButton) {
        photo.qty = Math.min(99, Math.max(1, photo.qty + Number(qtyButton.dataset.qty)));
        row.querySelector("[data-qty-value]").textContent = photo.qty;
        row.querySelector('[data-qty="-1"]').disabled = photo.qty <= 1;
        row.querySelector('[data-qty="1"]').disabled = photo.qty >= 99;
        updateSummary();
        return;
      }

      if (event.target.closest("[data-crop]")) {
        openCrop(photo.id);
        return;
      }

      if (event.target.closest("[data-remove-photo]")) {
        removePhoto(photo.id);
      }
    });

    els.addToCart.addEventListener("click", addToCart);

    els.cropOverlay.addEventListener("click", function (event) {
      if (event.target.closest("[data-close-crop]")) {
        closeCrop(false);
      }
    });

    els.cropApply.addEventListener("click", function () {
      closeCrop(true);
    });

    els.cropPrev.addEventListener("click", function () {
      navigateCrop(-1);
    });

    els.cropNext.addEventListener("click", function () {
      navigateCrop(1);
    });

    els.cartList.addEventListener("click", function (event) {
      const row = event.target.closest("[data-cart-id]");
      if (!row) return;

      const qtyButton = event.target.closest("[data-cart-qty]");
      if (qtyButton) {
        updateCartItemQuantity(row.dataset.cartId, Number(qtyButton.dataset.cartQty));
        return;
      }

      if (event.target.closest("[data-cart-remove]")) {
        removeCartItem(row.dataset.cartId);
      }
    });

    els.orderModal.addEventListener("click", function (event) {
      if (event.target.closest("[data-close-order]")) {
        closeOrderModal();
      }
    });

    els.orderForm.addEventListener("submit", submitOrder);
    els.downloadOrderArchive.addEventListener("click", triggerOrderArchiveDownload);

    [
      [els.orderOffice, els.orderOfficeError, "change"],
      [els.orderName, els.orderNameError, "input"],
      [els.orderPhone, els.orderPhoneError, "input"],
      [els.orderConsent, els.orderConsentError, "change"]
    ].forEach(function (pair) {
      pair[0].addEventListener(pair[2], function () {
        pair[0].removeAttribute("aria-invalid");
        pair[1].hidden = true;
        pair[1].textContent = "";
      });
    });

    els.checkout.addEventListener("click", openOrderModal);

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") {
        if (els.cropOverlay.classList.contains("is-open")) {
          event.preventDefault();
          closeCrop(false);
          return;
        }
        if (els.orderModal.classList.contains("is-open")) {
          event.preventDefault();
          closeOrderModal();
          return;
        }
        if (els.cart.classList.contains("is-open")) {
          event.preventDefault();
          closeCart();
          return;
        }
        if (els.docPhotoModal.classList.contains("is-open")) {
          event.preventDefault();
          closeDocPhotoModal();
          return;
        }
        if (els.docPrintModal.classList.contains("is-open")) {
          event.preventDefault();
          closeDocPrintModal();
          return;
        }
        if (els.modal.classList.contains("is-open")) {
          event.preventDefault();
          closePrintModal();
          return;
        }
      }

      if (
        els.cropOverlay.classList.contains("is-open") &&
        (event.key === "ArrowLeft" || event.key === "ArrowRight") &&
        !event.altKey &&
        !event.ctrlKey &&
        !event.metaKey &&
        !(event.target.closest && event.target.closest("input, textarea, select"))
      ) {
        event.preventDefault();
        navigateCrop(event.key === "ArrowLeft" ? -1 : 1);
        return;
      }

      if (event.key === "Tab") {
        const dialog = getTopDialog();
        if (dialog) trapTab(event, dialog);
      }
    });

    window.addEventListener("beforeunload", function () {
      state.photos.forEach(function (photo) {
        if (photo.url) URL.revokeObjectURL(photo.url);
      });
      if (state.orderArchiveUrl) {
        URL.revokeObjectURL(state.orderArchiveUrl);
      }
    });
  }

  function init() {
    cacheElements();
    renderCatalog();
    CropEditor.init({
      stage: els.cropStage,
      canvas: els.cropCanvas,
      wrap: els.cropWrap,
      zoom: els.cropZoom,
      zoomLabel: els.cropZoomLabel,
      modeButtons: els.cropModeButtons,
      rotate: els.cropRotate,
      reset: els.cropReset,
      angleLabel: els.cropAngle,
      hint: els.cropHint
    });
    bindEvents();
    renderSizes();
    renderFinish();
    renderQuality();
    renderPhotos();
    renderCart();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
