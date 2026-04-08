const state = {
  isDrawing: false,
  tool: 'pen', // 'pen' | 'eraser'
  color: '#ff4d4f',
  brushSize: 8,
  points: [], // for undo stack snapshots
  undoStack: [],
  viewport: { width: 0, height: 0 },
  handVisible: false,
  smoothLandmarks: null,
  emaAlpha: 0.35,
  pinchCloseFrames: 0,
  pinchOpenFrames: 0,
  gestureHold: { middle: 0, ring: 0, pinky: 0 },
  tongueHold: 0,
  colorIndex: 1,
  lastNormalBrushSize: 8,
  isBigBrush: false,
  tongueEraseEnabled: true,
};

const COLORS = ['#ffffff', '#ff4d4f', '#faad14', '#fadb14', '#52c41a', '#13c2c2', '#1677ff', '#722ed1', '#eb2f96', '#8c8c8c'];

const video = document.getElementById('camera');
const drawCanvas = document.getElementById('drawCanvas');
const overlayCanvas = document.getElementById('overlayCanvas');
const statusEl = document.getElementById('status');

const toolPenBtn = document.getElementById('tool-pen');
const toolEraserBtn = document.getElementById('tool-eraser');
const undoBtn = document.getElementById('undo');
const clearBtn = document.getElementById('clear');
const saveBtn = document.getElementById('save');
const colorsEl = document.getElementById('colors');
const brushSizeInput = document.getElementById('brushSize');
const brushLabel = document.getElementById('brushLabel');
const toggleTongueBtn = document.getElementById('toggle-tongue');

const drawCtx = drawCanvas.getContext('2d');
const overlayCtx = overlayCanvas.getContext('2d');

function setStatus(text) {
  statusEl.textContent = text;
}

function resizeCanvases() {
  const rect = video.getBoundingClientRect();
  state.viewport.width = rect.width;
  state.viewport.height = rect.height;
  [drawCanvas, overlayCanvas].forEach((c) => {
    const dpr = window.devicePixelRatio || 1;
    c.width = Math.floor(rect.width * dpr);
    c.height = Math.floor(rect.height * dpr);
    c.style.width = `${rect.width}px`;
    c.style.height = `${rect.height}px`;
  });
  const dpr = window.devicePixelRatio || 1;
  drawCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
  overlayCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function setupUI() {
  // Colors
  COLORS.forEach((c, idx) => {
    const el = document.createElement('button');
    el.className = 'color-swatch' + (idx === 1 ? ' active' : '');
    el.style.background = c;
    el.addEventListener('click', () => {
      setColorIndex(idx);
    });
    colorsEl.appendChild(el);
  });

  toolPenBtn.addEventListener('click', () => setTool('pen'));
  toolEraserBtn.addEventListener('click', () => setTool('eraser'));
  undoBtn.addEventListener('click', undo);
  clearBtn.addEventListener('click', clearCanvas);
  saveBtn.addEventListener('click', saveImage);

  brushSizeInput.addEventListener('input', () => {
    setBrushSize(Number(brushSizeInput.value));
  });
  brushLabel.textContent = `${state.brushSize}px`;

  window.addEventListener('resize', resizeCanvases);

  // Toggle tongue erase
  const refreshTongueToggle = () => {
    toggleTongueBtn.classList.toggle('active', state.tongueEraseEnabled);
    toggleTongueBtn.title = state.tongueEraseEnabled ? 'Dil ile silme: Açık' : 'Dil ile silme: Kapalı';
  };
  toggleTongueBtn.addEventListener('click', () => {
    state.tongueEraseEnabled = !state.tongueEraseEnabled;
    refreshTongueToggle();
    setStatus(state.tongueEraseEnabled ? 'Dil ile silme: Açık' : 'Dil ile silme: Kapalı');
  });
  refreshTongueToggle();
}

function setTool(tool) {
  state.tool = tool;
  [toolPenBtn, toolEraserBtn].forEach((b) => b.classList.remove('active'));
  (tool === 'pen' ? toolPenBtn : toolEraserBtn).classList.add('active');
}

function setBrushSize(size) {
  state.brushSize = Math.max(2, Math.min(40, Math.round(size)));
  brushSizeInput.value = String(state.brushSize);
  brushLabel.textContent = `${state.brushSize}px`;
}

function setColorIndex(idx) {
  const safe = ((idx % COLORS.length) + COLORS.length) % COLORS.length;
  state.colorIndex = safe;
  state.color = COLORS[safe];
  const children = [...colorsEl.children];
  children.forEach((ch) => ch.classList.remove('active'));
  if (children[safe]) children[safe].classList.add('active');
  setStatus(`Renk: ${state.color}`);
}

function cycleColor(forward = true) {
  const next = state.colorIndex + (forward ? 1 : -1);
  setColorIndex(next);
}

function clearCanvas() {
  const { width, height } = state.viewport;
  drawCtx.clearRect(0, 0, width, height);
}

function saveSnapshot() {
  state.undoStack.push(drawCanvas.toDataURL('image/png'));
  if (state.undoStack.length > 20) state.undoStack.shift();
}

function undo() {
  const last = state.undoStack.pop();
  if (!last) return;
  const img = new Image();
  img.onload = () => {
    clearCanvas();
    drawCtx.drawImage(img, 0, 0, state.viewport.width, state.viewport.height);
  };
  img.src = last;
}

function saveImage() {
  const a = document.createElement('a');
  a.download = `cam-drawer-${Date.now()}.png`;
  a.href = drawCanvas.toDataURL('image/png');
  a.click();
}

function drawCircle(x, y, r, color) {
  drawCtx.save();
  drawCtx.globalCompositeOperation = state.tool === 'eraser' ? 'destination-out' : 'source-over';
  drawCtx.fillStyle = state.tool === 'eraser' ? 'rgba(0,0,0,1)' : color;
  drawCtx.beginPath();
  drawCtx.arc(x, y, r, 0, Math.PI * 2);
  drawCtx.fill();
  drawCtx.restore();
}

function drawLine(x1, y1, x2, y2, width, color) {
  drawCtx.save();
  drawCtx.globalCompositeOperation = state.tool === 'eraser' ? 'destination-out' : 'source-over';
  drawCtx.strokeStyle = state.tool === 'eraser' ? 'rgba(0,0,0,1)' : color;
  drawCtx.lineWidth = width;
  drawCtx.lineCap = 'round';
  drawCtx.lineJoin = 'round';
  drawCtx.beginPath();
  drawCtx.moveTo(x1, y1);
  drawCtx.lineTo(x2, y2);
  drawCtx.stroke();
  drawCtx.restore();
}

function drawHandOverlay(landmarks, viewportWidth, viewportHeight) {
  overlayCtx.clearRect(0, 0, viewportWidth, viewportHeight);
  if (!landmarks) return;

  // mirror x (video is flipped)
  const mapX = (x) => viewportWidth - x * viewportWidth;
  const mapY = (y) => y * viewportHeight;

  overlayCtx.strokeStyle = 'rgba(255,255,255,0.6)';
  overlayCtx.lineWidth = 2;

  const INDEX_TIP = 8;
  const THUMB_TIP = 4;
  const pt = (i) => ({ x: mapX(landmarks[i].x), y: mapY(landmarks[i].y) });

  const index = pt(INDEX_TIP);
  const thumb = pt(THUMB_TIP);

  overlayCtx.beginPath();
  overlayCtx.moveTo(index.x, index.y);
  overlayCtx.lineTo(thumb.x, thumb.y);
  overlayCtx.stroke();

  overlayCtx.fillStyle = 'rgba(138,180,255,0.8)';
  overlayCtx.beginPath();
  overlayCtx.arc(index.x, index.y, 5, 0, Math.PI * 2);
  overlayCtx.fill();
  overlayCtx.beginPath();
  overlayCtx.arc(thumb.x, thumb.y, 5, 0, Math.PI * 2);
  overlayCtx.fill();
}

function pinchDistance(landmarks, viewportWidth, viewportHeight) {
  const mapX = (x) => viewportWidth - x * viewportWidth;
  const mapY = (y) => y * viewportHeight;
  const a = { x: mapX(landmarks[4].x), y: mapY(landmarks[4].y) };
  const b = { x: mapX(landmarks[8].x), y: mapY(landmarks[8].y) };
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.hypot(dx, dy);
}

function indexTipPosition(landmarks, viewportWidth, viewportHeight) {
  const mapX = (x) => viewportWidth - x * viewportWidth;
  const mapY = (y) => y * viewportHeight;
  const p = { x: mapX(landmarks[8].x), y: mapY(landmarks[8].y) };
  return p;
}

function drawTongueOverlay(faceLandmarks, viewportWidth, viewportHeight) {
  if (!faceLandmarks) return;
  const mapX = (x) => viewportWidth - x * viewportWidth;
  const mapY = (y) => y * viewportHeight;
  const p = (i) => ({ x: mapX(faceLandmarks[i].x), y: mapY(faceLandmarks[i].y) });

  const left = p(61);
  const right = p(291);
  const topLip = p(13);
  const bottomLip = p(14);
  const cx = (topLip.x + bottomLip.x) / 2;
  const cy = (topLip.y + bottomLip.y) / 2;
  const lipWidth = Math.hypot(left.x - right.x, left.y - right.y);
  const r = Math.max(10, lipWidth * 0.22);

  overlayCtx.save();
  overlayCtx.strokeStyle = 'rgba(255, 105, 180, 0.95)';
  overlayCtx.fillStyle = 'rgba(255, 105, 180, 0.2)';
  overlayCtx.lineWidth = 3;
  overlayCtx.beginPath();
  overlayCtx.arc(cx, cy, r, 0, Math.PI * 2);
  overlayCtx.fill();
  overlayCtx.stroke();

  overlayCtx.fillStyle = 'rgba(255,255,255,0.9)';
  overlayCtx.font = '14px ui-sans-serif, system-ui';
  overlayCtx.textAlign = 'center';
  overlayCtx.fillText('Dil', cx, cy - r - 6);
  overlayCtx.restore();
}

function smoothLandmarks(rawLandmarks) {
  if (!rawLandmarks) return null;
  if (!state.smoothLandmarks) {
    state.smoothLandmarks = rawLandmarks.map((p) => ({ x: p.x, y: p.y, z: p.z }));
    return state.smoothLandmarks;
  }
  const a = state.emaAlpha;
  for (let i = 0; i < rawLandmarks.length; i++) {
    state.smoothLandmarks[i].x = a * rawLandmarks[i].x + (1 - a) * state.smoothLandmarks[i].x;
    state.smoothLandmarks[i].y = a * rawLandmarks[i].y + (1 - a) * state.smoothLandmarks[i].y;
    state.smoothLandmarks[i].z = a * rawLandmarks[i].z + (1 - a) * state.smoothLandmarks[i].z;
  }
  return state.smoothLandmarks;
}

function setupHands() {
  const hands = new Hands({ locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}` });
  hands.setOptions({
    maxNumHands: 1,
    modelComplexity: 1,
    minDetectionConfidence: 0.7,
    minTrackingConfidence: 0.7,
  });

  let lastPoint = null;
  let nextGestureAllowedAt = 0;
  const gestureCooldownMs = 900;

  // FaceMesh (dil jesti için)
  const faceMesh = new FaceMesh({ locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}` });
  faceMesh.setOptions({
    maxNumFaces: 1,
    refineLandmarks: false,
    minDetectionConfidence: 0.6,
    minTrackingConfidence: 0.6,
  });

  const sampleCanvas = document.createElement('canvas');
  sampleCanvas.width = 180;
  sampleCanvas.height = 100;
  const sampleCtx = sampleCanvas.getContext('2d');

  hands.onResults((results) => {
    const { width, height } = state.viewport;
    const hasHand = !!results.multiHandLandmarks && results.multiHandLandmarks.length > 0;
    state.handVisible = hasHand;
    overlayCtx.clearRect(0, 0, width, height);

    if (!hasHand) {
      setStatus('El algılanmadı');
      state.isDrawing = false;
      lastPoint = null;
      state.pinchCloseFrames = 0;
      state.pinchOpenFrames = 0;
      state.gestureHold.middle = 0;
      state.gestureHold.ring = 0;
      state.gestureHold.pinky = 0;
      return;
    }

    const smoothed = smoothLandmarks(results.multiHandLandmarks[0]);
    drawHandOverlay(smoothed, width, height);
    const pinch = pinchDistance(smoothed, width, height);
    const tip = indexTipPosition(smoothed, width, height);

    // Gesture thresholds (in px): tweak based on viewport
    const startThreshold = Math.max(12, Math.min(width, height) * 0.012);
    const stopThreshold = Math.max(26, Math.min(width, height) * 0.032);

    // Histerezis + ardışık kare onayı
    if (pinch < startThreshold) {
      state.pinchCloseFrames += 1;
      state.pinchOpenFrames = 0;
    } else if (pinch > stopThreshold) {
      state.pinchOpenFrames += 1;
      state.pinchCloseFrames = 0;
    } else {
      state.pinchCloseFrames = 0;
      state.pinchOpenFrames = 0;
    }

    const needFramesToStart = 3;
    const needFramesToStop = 3;

    if (!state.isDrawing && state.pinchCloseFrames >= needFramesToStart) {
      state.isDrawing = true;
      saveSnapshot();
      setStatus('Çizim: AÇIK');
      lastPoint = tip;
      drawCircle(tip.x, tip.y, state.brushSize / 2, state.color);
      return;
    }

    if (state.isDrawing && state.pinchOpenFrames >= needFramesToStop) {
      state.isDrawing = false;
      setStatus('Çizim: KAPALI');
      lastPoint = null;
      // not returning; allow tool gestures right after releasing pinch
    }

    if (state.isDrawing && lastPoint) {
      drawLine(lastPoint.x, lastPoint.y, tip.x, tip.y, state.brushSize, state.color);
      lastPoint = tip;
    } else {
      lastPoint = tip;
    }

    // Tool gestures when not drawing (thumb with other fingertips)
    if (!state.isDrawing) {
      const now = Date.now();
      if (now >= nextGestureAllowedAt) {
        const dist = (a, b) => {
          const mapX = (x) => width - x * width;
          const mapY = (y) => y * height;
          const pa = { x: mapX(smoothed[a].x), y: mapY(smoothed[a].y) };
          const pb = { x: mapX(smoothed[b].x), y: mapY(smoothed[b].y) };
          return Math.hypot(pa.x - pb.x, pa.y - pb.y);
        };

        const gThreshold = Math.max(18, Math.min(width, height) * 0.014);
        const holdFrames = 6;
        const dThumbMiddle = dist(4, 12);
        const dThumbRing = dist(4, 16);
        const dThumbPinky = dist(4, 20);

        state.gestureHold.middle = dThumbMiddle < gThreshold ? state.gestureHold.middle + 1 : 0;
        state.gestureHold.ring = dThumbRing < gThreshold ? state.gestureHold.ring + 1 : 0;
        state.gestureHold.pinky = dThumbPinky < gThreshold ? state.gestureHold.pinky + 1 : 0;

        if (state.gestureHold.middle >= holdFrames) {
          // Büyük fırça <-> normal fırça geçişi
          if (!state.isBigBrush) {
            state.lastNormalBrushSize = state.brushSize;
            setBrushSize(Math.max(24, state.brushSize * 2));
            state.isBigBrush = true;
            setStatus(`Fırça: Büyük (${state.brushSize}px)`);
          } else {
            setBrushSize(state.lastNormalBrushSize || 8);
            state.isBigBrush = false;
            setStatus(`Fırça: Normal (${state.brushSize}px)`);
          }
          nextGestureAllowedAt = now + gestureCooldownMs;
          state.gestureHold.middle = 0;
        } else if (state.gestureHold.ring >= holdFrames) {
          undo();
          setStatus('Geri al');
          nextGestureAllowedAt = now + gestureCooldownMs;
          state.gestureHold.ring = 0;
        } else if (state.gestureHold.pinky >= holdFrames) {
          cycleColor(true);
          setStatus(`Renk: ${state.color}`);
          nextGestureAllowedAt = now + gestureCooldownMs;
          state.gestureHold.pinky = 0;
        }
      }
    }
  });

  // Face results: dil çıkarma ile temizle
  faceMesh.onResults((results) => {
    const faces = results.multiFaceLandmarks;
    if (!faces || faces.length === 0) {
      state.tongueHold = 0;
      return;
    }
    if (!state.tongueEraseEnabled) return;
    const lm = faces[0];
    const dist = (a, b) => {
      const dx = lm[a].x - lm[b].x;
      const dy = lm[a].y - lm[b].y;
      return Math.hypot(dx, dy);
    };
    const mouthOpenRatio = dist(13, 14) / (dist(61, 291) + 1e-6);

    // Frame'i küçük tuvale çiz ve merkez ağız rengini örnekle
    sampleCtx.drawImage(video, 0, 0, sampleCanvas.width, sampleCanvas.height);
    const cx = Math.max(0, Math.min(sampleCanvas.width - 1, Math.round(((lm[13].x + lm[14].x) / 2) * sampleCanvas.width)));
    const cy = Math.max(0, Math.min(sampleCanvas.height - 1, Math.round(((lm[13].y + lm[14].y) / 2) * sampleCanvas.height)));
    const { data } = sampleCtx.getImageData(cx, cy, 1, 1);
    const r = data[0], g = data[1], b = data[2];
    const redDominant = r > 120 && r > g + 25 && r > b + 25;

    const openThreshold = 0.22; // ağız açıklığı oranı
    if (mouthOpenRatio > openThreshold && redDominant) {
      // Overlay'e dil bölgesini çiz
      drawTongueOverlay(lm, state.viewport.width, state.viewport.height);
      state.tongueHold += 1;
    } else {
      state.tongueHold = 0;
    }

    const holdFrames = 6;
    const now = Date.now();
    if (state.tongueHold >= holdFrames && now >= nextGestureAllowedAt) {
      clearCanvas();
      setStatus('Dil algılandı: Tuval temizlendi');
      nextGestureAllowedAt = now + 1200;
      state.tongueHold = 0;
    }
  });

  const cam = new Camera(video, {
    onFrame: async () => {
      await hands.send({ image: video });
      await faceMesh.send({ image: video });
    },
    width: 1280,
    height: 720,
  });
  video.addEventListener('loadedmetadata', () => {
    resizeCanvases();
    setStatus('Kamera hazır');
  });
  cam.start();
}

function init() {
  setupUI();
  setupHands();
}

document.addEventListener('DOMContentLoaded', init);


