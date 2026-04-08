# Hand Canvas

A browser-based drawing application that lets you draw in the air using hand gestures via your webcam. It uses MediaPipe for real-time hand and face tracking -- pinch your thumb and index finger together to start drawing.

## Features

- **Hand drawing** -- Pinch thumb + index finger to draw, release to stop
- **Pen & Eraser** -- Switch between tools via the toolbar or hand gestures
- **Color palette** -- 10 color options (white, red, orange, yellow, green, cyan, blue, purple, pink, gray)
- **Brush size** -- Adjustable slider from 2px to 40px
- **Undo** -- Supports up to 20 undo steps
- **Save** -- Download your drawing as a PNG
- **Tongue erase** -- Stick out your tongue to clear the canvas (can be toggled on/off)

## Hand Gestures

| Gesture | Action |
|---------|--------|
| Thumb + Index finger (pinch) | Draw |
| Thumb + Middle finger | Toggle big / normal brush |
| Thumb + Ring finger | Undo |
| Thumb + Pinky finger | Cycle to next color |
| Stick out tongue | Clear canvas |

## Technologies

- **HTML5 Canvas** -- Drawing and overlay layers
- **MediaPipe Hands** -- Hand landmark detection and tracking
- **MediaPipe Face Mesh** -- Face landmark detection (for tongue detection)
- **MediaPipe Camera Utils** -- Webcam access
- Vanilla JavaScript, no external frameworks

## Getting Started

No build tools or `npm install` required. Just serve the files over an HTTP server:

```bash
# With Python
python3 -m http.server 8000

# With Node.js (npx)
npx serve .

# Or use VS Code's Live Server extension
```

Open `http://localhost:8000` in your browser and allow camera access when prompted.

## File Structure

```
hand-canvas/
  index.html    # Main HTML page with toolbar and canvas elements
  app.js        # Application logic: hand tracking, gesture detection, drawing engine
  styles.css    # UI styles
```

## How It Works

1. The app opens the webcam and sends each frame to MediaPipe Hands + Face Mesh models
2. Hand landmarks are smoothed using EMA (Exponential Moving Average) to prevent jitter
3. The distance between the thumb tip (landmark 4) and index finger tip (landmark 8) is calculated
4. When the distance drops below a threshold for 3 consecutive frames (hysteresis), drawing begins
5. During drawing, the index finger tip position is tracked and lines are drawn on the canvas
6. For tongue detection, the mouth openness ratio and red color dominance in the mouth region are checked

## Browser Requirements

- A modern browser with camera access support (Chrome, Edge, Firefox)
- HTTPS or localhost (required for camera permissions)

## License

This project was developed for personal use.
