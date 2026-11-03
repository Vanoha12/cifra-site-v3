/* Редактор кадра. Смещения хранятся в долях от размера рамки,
   поэтому кадр одинаково выглядит в редакторе, списке фото и корзине. */
(function () {
  "use strict";

  const MIN_ZOOM = 1;
  const MAX_ZOOM = 3;

  const DEFAULTS = {
    zoom: 1,
    offsetX: 0,
    offsetY: 0,
    rotation: 0,
    mode: "cover"
  };

  let els = null;
  let image = null;
  let state = null;
  let aspect = 2 / 3;
  let stageW = 0;
  let stageH = 0;
  let dpr = 1;
  let isOpen = false;

  let drag = null;
  let pinch = null;
  const pointers = new Map();

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function normalizedRotation(value) {
    return ((value % 360) + 360) % 360;
  }

  function rotatedDimensions(img, rotation) {
    const turned = normalizedRotation(rotation) % 180 !== 0;
    return {
      w: turned ? img.naturalHeight : img.naturalWidth,
      h: turned ? img.naturalWidth : img.naturalHeight
    };
  }

  function baseScale(w, h, img, st) {
    const dims = rotatedDimensions(img, st.rotation);
    return st.mode === "contain"
      ? Math.min(w / dims.w, h / dims.h)
      : Math.max(w / dims.w, h / dims.h);
  }

  function currentScale(w, h) {
    const base = baseScale(w, h, image, state);
    return base * (state.mode === "contain" ? 1 : state.zoom);
  }

  function clampOffsets() {
    if (!image || !state) return;

    if (state.mode === "contain") {
      state.offsetX = 0;
      state.offsetY = 0;
      return;
    }

    const dims = rotatedDimensions(image, state.rotation);
    const scale = currentScale(stageW, stageH);
    const maxX = Math.max(0, (dims.w * scale - stageW) / 2 / stageW);
    const maxY = Math.max(0, (dims.h * scale - stageH) / 2 / stageH);

    state.offsetX = clamp(state.offsetX, -maxX, maxX);
    state.offsetY = clamp(state.offsetY, -maxY, maxY);
  }

  function paint(ctx, w, h, img, st) {
    ctx.save();
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, w, h);

    const scale = baseScale(w, h, img, st) * (st.mode === "contain" ? 1 : st.zoom);
    const rotation = normalizedRotation(st.rotation);

    ctx.translate(w / 2 + st.offsetX * w, h / 2 + st.offsetY * h);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(scale, scale);
    ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);
    ctx.restore();
  }

  function draw() {
    if (!els || !image || !state || !stageW || !stageH) return;

    const ctx = els.canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    paint(ctx, stageW, stageH, image, state);
  }

  function layout() {
    if (!isOpen || !els || !image) return;

    const styles = window.getComputedStyle(els.wrap);
    const padX = parseFloat(styles.paddingLeft) + parseFloat(styles.paddingRight);
    const padY = parseFloat(styles.paddingTop) + parseFloat(styles.paddingBottom);
    const maxW = Math.max(160, els.wrap.clientWidth - padX);
    const maxH = Math.max(180, Math.min(window.innerHeight * 0.44, 430) - padY);

    let w = maxW;
    let h = w / aspect;

    if (h > maxH) {
      h = maxH;
      w = h * aspect;
    }

    stageW = Math.floor(w);
    stageH = Math.floor(h);
    dpr = Math.min(window.devicePixelRatio || 1, 2);

    els.stage.style.width = stageW + "px";
    els.stage.style.height = stageH + "px";
    els.canvas.width = Math.round(stageW * dpr);
    els.canvas.height = Math.round(stageH * dpr);

    clampOffsets();
    draw();
  }

  function syncUI() {
    if (!els || !state) return;

    els.modeButtons.forEach(function (button) {
      const active = button.dataset.mode === state.mode;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });

    els.zoom.disabled = state.mode === "contain";
    els.zoom.value = String(Math.round(state.zoom * 100));
    els.zoomLabel.textContent = Math.round(state.zoom * 100) + "%";
    els.angleLabel.textContent = normalizedRotation(state.rotation) + "°";

    if (state.mode === "contain") {
      els.hint.textContent = "Фото вписано целиком. Белые поля сохранятся на печати.";
    } else {
      const coarsePointer = window.matchMedia && window.matchMedia("(pointer: coarse)").matches;
      els.hint.textContent =
        "Перетащите фото, чтобы выбрать кадр. Масштаб — " +
        (coarsePointer ? "ползунком или двумя пальцами." : "колесиком, ползунком или двумя пальцами.");
    }
  }

  function setMode(mode) {
    if (!state || (mode !== "cover" && mode !== "contain")) return;
    if (state.mode === mode) return;

    state.mode = mode;
    state.touched = true;
    if (mode === "contain") {
      state.zoom = 1;
      state.offsetX = 0;
      state.offsetY = 0;
    }
    syncUI();
    draw();
  }

  function rotate() {
    if (!state) return;
    state.rotation = (normalizedRotation(state.rotation) + 90) % 360;
    state.offsetX = 0;
    state.offsetY = 0;
    state.touched = true;
    syncUI();
    draw();
  }

  function reset() {
    if (!state) return;
    state.zoom = DEFAULTS.zoom;
    state.offsetX = DEFAULTS.offsetX;
    state.offsetY = DEFAULTS.offsetY;
    state.rotation = DEFAULTS.rotation;
    state.mode = DEFAULTS.mode;
    state.touched = true;
    syncUI();
    draw();
  }

  function distance(a, b) {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return Math.hypot(dx, dy);
  }

  function midpoint(a, b) {
    return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
  }

  function onPointerDown(event) {
    if (!isOpen || !state || state.mode === "contain") return;
    if (event.pointerType === "mouse" && event.button !== 0) return;

    event.preventDefault();
    els.stage.setPointerCapture(event.pointerId);
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });

    if (pointers.size === 1) {
      drag = {
        id: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        offsetX: state.offsetX,
        offsetY: state.offsetY
      };
      pinch = null;
    } else if (pointers.size === 2) {
      const values = Array.from(pointers.values());
      const mid = midpoint(values[0], values[1]);
      pinch = {
        distance: Math.max(1, distance(values[0], values[1])),
        zoom: state.zoom,
        midX: mid.x,
        midY: mid.y,
        offsetX: state.offsetX,
        offsetY: state.offsetY
      };
      drag = null;
    }
  }

  function onPointerMove(event) {
    if (!isOpen || !state || !pointers.has(event.pointerId)) return;

    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });

    if (pinch && pointers.size >= 2) {
      event.preventDefault();
      const values = Array.from(pointers.values());
      const mid = midpoint(values[0], values[1]);
      const nextZoom = clamp(pinch.zoom * (distance(values[0], values[1]) / pinch.distance), MIN_ZOOM, MAX_ZOOM);

      state.zoom = nextZoom;
      state.offsetX = pinch.offsetX + (mid.x - pinch.midX) / stageW;
      state.offsetY = pinch.offsetY + (mid.y - pinch.midY) / stageH;
      state.touched = true;

      clampOffsets();
      els.zoom.value = String(Math.round(state.zoom * 100));
      els.zoomLabel.textContent = Math.round(state.zoom * 100) + "%";
      draw();
      return;
    }

    if (drag && drag.id === event.pointerId && pointers.size === 1) {
      event.preventDefault();
      state.offsetX = drag.offsetX + (event.clientX - drag.startX) / stageW;
      state.offsetY = drag.offsetY + (event.clientY - drag.startY) / stageH;
      state.touched = true;
      clampOffsets();
      draw();
    }
  }

  function releasePointer(event) {
    if (!pointers.has(event.pointerId)) return;
    pointers.delete(event.pointerId);

    if (pointers.size === 1 && state && state.mode === "cover") {
      const remaining = Array.from(pointers.entries())[0];
      drag = {
        id: remaining[0],
        startX: remaining[1].x,
        startY: remaining[1].y,
        offsetX: state.offsetX,
        offsetY: state.offsetY
      };
    } else {
      drag = null;
    }

    if (pointers.size < 2) pinch = null;
  }

  function onZoomInput() {
    if (!state || state.mode === "contain") return;
    const nextZoom = clamp(Number(els.zoom.value) / 100, MIN_ZOOM, MAX_ZOOM);
    if (Math.abs(nextZoom - state.zoom) < 0.0001) return;

    state.zoom = nextZoom;
    state.touched = true;
    clampOffsets();
    els.zoomLabel.textContent = Math.round(state.zoom * 100) + "%";
    draw();
  }

  function onWheel(event) {
    if (!isOpen || !state || state.mode === "contain" || !stageW || !stageH) return;

    event.preventDefault();

    const rect = els.stage.getBoundingClientRect();
    const anchorX = event.clientX - rect.left;
    const anchorY = event.clientY - rect.top;
    const delta = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? stageH : 1);
    const factor = Math.exp(-delta * (event.ctrlKey ? 0.01 : 0.0015));
    const nextZoom = clamp(state.zoom * factor, MIN_ZOOM, MAX_ZOOM);

    if (Math.abs(nextZoom - state.zoom) < 0.0001) return;

    state.touched = true;
    const scaleFactor = nextZoom / state.zoom;
    const centerX = stageW / 2 + state.offsetX * stageW;
    const centerY = stageH / 2 + state.offsetY * stageH;
    const nextCenterX = anchorX - (anchorX - centerX) * scaleFactor;
    const nextCenterY = anchorY - (anchorY - centerY) * scaleFactor;

    state.zoom = nextZoom;
    state.offsetX = (nextCenterX - stageW / 2) / stageW;
    state.offsetY = (nextCenterY - stageH / 2) / stageH;
    clampOffsets();

    els.zoom.value = String(Math.round(state.zoom * 100));
    els.zoomLabel.textContent = Math.round(state.zoom * 100) + "%";
    draw();
  }

  function init(refs) {
    els = refs;

    els.stage.addEventListener("pointerdown", onPointerDown);
    els.stage.addEventListener("pointermove", onPointerMove);
    els.stage.addEventListener("pointerup", releasePointer);
    els.stage.addEventListener("pointercancel", releasePointer);
    els.stage.addEventListener("wheel", onWheel, { passive: false });
    els.zoom.addEventListener("input", onZoomInput);

    els.modeButtons.forEach(function (button) {
      button.addEventListener("click", function () {
        setMode(button.dataset.mode);
      });
    });

    els.rotate.addEventListener("click", rotate);
    els.reset.addEventListener("click", reset);

    window.addEventListener("resize", function () {
      if (isOpen) layout();
    });
  }

  function open(config) {
    image = config.image;
    state = config.state;
    aspect = config.aspect;
    isOpen = true;

    syncUI();
    requestAnimationFrame(layout);
  }

  function close() {
    isOpen = false;
    image = null;
    state = null;
    drag = null;
    pinch = null;
    pointers.clear();
  }

  function renderPreview(img, st, ratio, maxWidth) {
    try {
      const width = Math.max(80, Math.round(maxWidth));
      const height = Math.max(80, Math.round(width / ratio));
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      paint(ctx, width, height, img, st);
      return canvas.toDataURL("image/jpeg", 0.84);
    } catch (error) {
      return null;
    }
  }

  function sizePixels(size) {
    return {
      w: Math.round((size.w / 2.54) * 300),
      h: Math.round((size.h / 2.54) * 300)
    };
  }

  function isLowResolution(img, size) {
    const required = sizePixels(size);
    const imageMin = Math.min(img.naturalWidth, img.naturalHeight);
    const imageMax = Math.max(img.naturalWidth, img.naturalHeight);
    const requiredMin = Math.min(required.w, required.h);
    const requiredMax = Math.max(required.w, required.h);
    return imageMin < requiredMin || imageMax < requiredMax;
  }

  window.CropEditor = {
    init: init,
    open: open,
    close: close,
    layout: layout,
    renderPreview: renderPreview,
    sizePixels: sizePixels,
    isLowResolution: isLowResolution,
    defaults: DEFAULTS
  };
})();
