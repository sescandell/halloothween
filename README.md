# Halloothween Photobooth

A modern photobooth application designed for events and parties. Capture, process, and print photos with real-time preview, cloud streaming support, and customizable print overlays.

## Features

- **Multi-camera Support**: Works with DSLR cameras (via gphoto2) and webcams
- **Real-time Preview**: Live camera feed with Socket.IO
- **Image Processing**: Automatic generation of thumbnails and display versions
- **Photo Printing**: DNP QW410 dye-sublimation printer support (CUPS on Linux/RPI)
- **Print Frame Overlay**: Add customizable PNG borders/frames to printed photos
- **Cloud Streaming**: Optional Azure integration for remote photo access
- **Multi-interface**: Controller, displayer, and manager views for flexible setups
- **Zero Security Vulnerabilities**: Modern dependencies with regular updates

## Requirements

### Node.js

**Version 18.0.0 or higher** is required.

```bash
node --version  # Should output >= 18.0.0
```

#### Installing Node.js 18+ on Raspberry Pi

```bash
# Download and install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version
npm --version
```

### System Dependencies

#### For Raspberry Pi (DSLR cameras with gphoto2)

```bash
# Install gphoto2 runtime libraries (required)
sudo apt install libgphoto2-6 libgphoto2-port12

# Install development libraries (for legacy driver compilation if needed)
sudo apt install libgphoto2-dev

# Verify gphoto2 is working
gphoto2 --version
gphoto2 --auto-detect
```

#### For Raspberry Pi (CUPS printing)

```bash
# Install CUPS for DNP QW410 printer
sudo apt install cups

# Add user to lpadmin group
sudo usermod -a -G lpadmin pi

# Configure printer via CUPS web interface
# http://localhost:631
```

#### For Windows Development

No additional system dependencies required. The application:
- Automatically uses your system webcam for capture
- Uses SIMULATION mode for printing (saves to `/public/print/` folder instead of real printer)

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/sescandell/halloothween.git
cd halloothween
```

### 2. Install dependencies

```bash
# Main project
npm install

# Azure streamer service (optional)
cd PhotoboothStreamer
npm install
cd ..
```

The `postinstall` script will automatically attempt to install optional camera dependencies based on your platform.

### 3. Configuration

Copy the example environment file and configure:

```bash
cp .env.example .env
```

Edit `.env` with your settings:

```bash
# ============================================
# CAMERA CONFIGURATION
# ============================================

# Camera driver: auto, gphoto2, gphoto2-legacy, webcam
CAMERA_DRIVER=auto

# Capture mode
# - false: Direct capture (Raspberry Pi + gphoto2)
# - true: Pause stream before capture (Windows webcam)
PAUSE_STREAM_ON_CAPTURE=true

# ============================================
# PRINTER CONFIGURATION
# ============================================

# Enable/disable printer (true/false)
PRINTER_ENABLED=true

# Printer name (Linux/RPI only - Windows always uses SIMULATION)
# Options: "DNP_QW410" or "__SIMULATION__"
PRINTER_NAME=DNP_QW410

# Print mode
PRINTER_MODE=auto

# ============================================
# PRINT FRAME OVERLAY
# ============================================

# Enable/disable frame overlay on printed photos (true/false)
PRINT_FRAME_ENABLED=false

# Path to frame PNG overlay (relative to project root)
# Requirements: 1844x1240 pixels (10x15cm @ 300 DPI), PNG with transparency
PRINT_FRAME_PATH=

# ============================================
# AZURE STREAMING (OPTIONAL)
# ============================================

# Azure streamer URL
STREAMER_URL=http://192.168.0.56:3000

# Shared secret (same value as in your streamer)
STREAMER_SHARED_SECRET=

# Unique RPI identifier
RPI_ID=rpi-001

# Enable/disable streamer (true/false)
STREAMER_ENABLED=false
```

### 4. Create required directories

The following directories will be automatically created on first run, but you can create them manually:

```bash
mkdir -p public/pictures public/thumbnails public/display public/print public/print-framed
```

## Usage

### Start the photobooth server

```bash
npm start
```

The server will start on **port 8181**.

### Access the interfaces

Open your browser and navigate to:

- **All-in-one interface**: http://localhost:8181/all-in-one (controller + displayer)
- **Controller**: http://localhost:8181/controller (capture controls)
- **Displayer**: http://localhost:8181/displayer (photo display)
- **Manager**: http://localhost:8181/manager (photo management)

### Start the Azure streaming service (optional)

In a separate terminal:

```bash
cd PhotoboothStreamer
npm start
```

The streaming service will start on **port 3000**.

## Camera Drivers

The application supports multiple camera drivers with automatic fallback:

| Driver | Description | Platform | Best For |
|--------|-------------|----------|----------|
| `auto` | Automatic detection with fallback | All | Most users (recommended) |
| `gphoto2` | Modern FFI-based driver | Linux/RPI | DSLR cameras (best performance) |
| `gphoto2-legacy` | Legacy native driver | Linux/RPI | Fallback if modern driver fails |
| `webcam` | System webcam driver | All | Windows dev or webcam setups |

### Auto-Detection Behavior

**Windows**: Uses `webcam` driver automatically

**Linux/Raspberry Pi**: Tries `gphoto2` → `gphoto2-legacy` → `webcam` (in order until one succeeds)

### Camera Configuration

Set `CAMERA_DRIVER` in `.env`:

```bash
CAMERA_DRIVER=auto   # Automatic detection (recommended)
```

Or force a specific driver:

```bash
CAMERA_DRIVER=webcam  # Force webcam driver
```

## Printing

### Overview

The application supports printing to DNP QW410 dye-sublimation printers via CUPS on Linux/Raspberry Pi. Windows automatically uses SIMULATION mode.

| Platform | Print Method | Output |
|----------|--------------|--------|
| **Linux/RPI** | CUPS (lp command) | Real printer (DNP_QW410) or simulation |
| **Windows** | SIMULATION | Saves to `public/print/` folder |

### Print Specifications

- **Format**: 10x15 cm (4x6 inches)
- **Resolution**: 1844x1240 pixels @ 300 DPI
- **Output**: High-quality JPEG

### Printer Setup (Linux/RPI)

1. Install CUPS and configure DNP QW410 printer
2. Verify printer is available:
   ```bash
   lpstat -p -d
   ```
3. Set `PRINTER_ENABLED=true` and `PRINTER_NAME=DNP_QW410` in `.env`

### Simulation Mode

To test printing without a real printer:

```bash
# Linux/RPI - Use simulation
PRINTER_NAME=__SIMULATION__

# Windows - Always simulation (automatic)
```

Photos will be copied to `public/print/` folder.

## Print Frame Overlay

Add custom PNG borders/frames to printed photos (e.g., event branding, text overlays).

### Features

- **Customizable frames**: Use any PNG overlay with transparency
- **Automatic composition**: Photo is resized and overlaid with frame before printing
- **Graceful fallback**: If frame is missing/invalid, prints without frame
- **Persistent storage**: Composed photos saved to `public/print-framed/` for reference

### Frame Specifications

- **Dimensions**: 1844x1240 pixels (exactly)
- **Format**: PNG with alpha channel (transparency)
- **DPI**: 300 (for 10x15 cm output)
- **Structure**: 
  - Top zone: Transparent (photo visible through)
  - Bottom/sides: Opaque (frame decorations, text, logos)

### Setup

1. Create or obtain a PNG frame matching specifications above
2. Save to `assets/print-frames/your-frame.png`
3. Configure in `.env`:
   ```bash
   PRINT_FRAME_ENABLED=true
   PRINT_FRAME_PATH=assets/print-frames/your-frame.png
   ```

### Example Frame Template

An example frame template is provided at `assets/print-frames/example-frame.png`:
- Transparent top zone (1040px) for photo visibility
- Blue bottom zone (200px) with placeholder text
- Ready to use or customize in your image editor

### Creating Custom Frames

See `assets/print-frames/README.md` for detailed instructions on creating custom frames.

### Disable Frame Overlay

```bash
PRINT_FRAME_ENABLED=false
```

## Architecture

### Technology Stack

| Component | Technology | Version |
|-----------|-----------|---------|
| Runtime | Node.js | >= 18.0.0 |
| Module System | ES Modules | Native |
| Web Framework | Express | 5.2.1 |
| Real-time | Socket.IO | 4.8.3 |
| Image Processing | Sharp | 0.34.5 |
| Template Engine | EJS | 4.0.1 |
| Camera (Modern) | @photobot/gphoto2-camera | 2.8.0 (optional) |
| Camera (Legacy) | gphoto2 | 0.3.2 (optional) |
| Camera (Webcam) | node-webcam | 0.8.1 (optional) |

### Project Structure

```
halloothween/
├── server.js                      # Main server (Express 5 + Socket.IO)
├── routes.js                      # HTTP routes and Socket.IO handlers
├── config.js                      # Runtime application configuration
├── app-config.js                  # Application configuration factory
├── .env                           # Environment variables (create from .env.example)
│
├── utils/
│   ├── camera-config.js           # Camera driver configuration
│   ├── CameraAdapter.js           # Async factory for camera selection
│   ├── cameras/
│   │   ├── GPhoto2Camera.js       # Modern gphoto2 driver (FFI-based)
│   │   ├── GPhoto2LegacyCamera.js # Legacy gphoto2 driver (native)
│   │   └── WebcamCamera.js        # Webcam driver
│   ├── PrinterClient.js           # Printer interface (CUPS/simulation)
│   ├── FrameComposer.js           # Print frame overlay composition
│   ├── AzureStreamingClient.js    # Azure connection client
│   ├── InMemoryStore.js           # Simple in-memory storage
│   └── bmpToSharp.js              # BMP format auto-detection
│
├── assets/
│   └── print-frames/              # PNG frame overlays for printing
│       ├── example-frame.png      # Example template (1844x1240px)
│       └── README.md              # Frame creation guide
│
├── public/
│   ├── pictures/                  # Original photos (high quality)
│   ├── thumbnails/                # Thumbnail versions (158px wide)
│   ├── display/                   # Display versions (1024px wide)
│   ├── print/                     # Simulation mode prints (Windows)
│   ├── print-framed/              # Composed photos with frame overlay
│   ├── js/                        # Client-side JavaScript
│   └── css/                       # Stylesheets
│
├── views/                         # EJS templates
│   ├── all-in-one.html
│   ├── controller.html
│   ├── displayer.html
│   └── manager.html
│
└── PhotoboothStreamer/            # Azure streaming service
    ├── server.js                  # Express 5 + Socket.IO server
    └── package.json               # Separate dependencies
```

### Image Processing Pipeline

When a photo is captured, Sharp generates multiple versions in parallel:

1. **Original** (95% quality JPEG) → `public/pictures/`
2. **Thumbnail** (158px wide) → `public/thumbnails/`
3. **Display** (1024px wide) → `public/display/`

When printing with frame overlay enabled:

4. **Composed** (photo + frame, 1844x1240px) → `public/print-framed/`
5. **Print** (sent to CUPS or saved to `public/print/`)

All processing is done asynchronously with `Promise.all` for maximum performance.

## Development

### ES Modules

This project uses **ES Modules** (not CommonJS). All imports must use ES syntax:

```javascript
// ✅ Correct (ES Modules)
import express from 'express';
import { Server } from 'socket.io';
export default myFunction;
export class MyClass {}

// ❌ Incorrect (CommonJS - not supported)
const express = require('express');
module.exports = myFunction;
```

### Windows Development

For development on Windows without a DSLR:

1. Application automatically uses webcam
2. Set `PAUSE_STREAM_ON_CAPTURE=true` in `.env`
3. Printing uses SIMULATION mode (saves to `public/print/`)

### BMP Format Support

Windows webcams may return BMP format. The application automatically detects and converts BMP to JPEG using `bmpToSharp.js`.

### Video Preview over HTTP

To enable webcam preview over HTTP on Chrome:

1. Navigate to: `chrome://flags/#unsafely-treat-insecure-origin-as-secure`
2. Add your Raspberry Pi IP: `http://192.168.x.x:8181`
3. Restart Chrome

## Troubleshooting

### Camera Issues

**Check driver detection:**
```
# Server logs show which driver is active:
[CameraAdapter] Using driver: webcam (Windows platform)
[CameraAdapter] Using driver: gphoto2 (modern driver loaded successfully)
[CameraAdapter] Using driver: gphoto2-legacy (fallback from modern driver)
```

**Camera not detected (Linux/RPI):**
```bash
# Verify gphoto2 can see your camera
gphoto2 --auto-detect

# Check camera is in PTP/MTP mode (not mass storage)
```

**Camera not detected (Windows):**
```bash
# Check webcam permissions
Settings > Privacy > Camera > Allow desktop apps
```

**Force specific driver for testing:**
```bash
# In .env
CAMERA_DRIVER=webcam
```

### Printer Issues

**Printer not found:**
```bash
# Check CUPS printer status (Linux/RPI)
lpstat -p -d

# Verify printer name matches .env
lpstat -p DNP_QW410
```

**Windows printing:**
Windows always uses SIMULATION mode (by design). Check `public/print/` for output files.

**Test with simulation:**
```bash
# Linux/RPI - Force simulation mode
PRINTER_NAME=__SIMULATION__
```

### Frame Overlay Issues

**Frame not detected:**
- Check `PRINT_FRAME_ENABLED=true` in `.env`
- Verify `PRINT_FRAME_PATH` points to valid PNG file
- Check server logs for `[FRAME]` messages

**Frame quality issues:**
- Ensure PNG is exactly 1844x1240 pixels
- Verify PNG has alpha channel (transparency)
- Check photo zone is transparent in image editor
- Test with `example-frame.png` first

**Composed photos location:**
```bash
# Check composed photos with frame
ls -lh public/print-framed/
```

### General Issues

**Error: "Cannot use import statement outside a module"**

Make sure you're using Node.js >= 18.0.0 and `package.json` has `"type": "module"`.

**Error: "gphoto2 module not found" on Windows**

This is normal. On Windows, the application automatically falls back to webcam mode.

**Photos not generated:**

Check file permissions:
```bash
ls -la public/pictures/ public/thumbnails/ public/display/
```

Ensure directories exist and are writable.

## Additional Documentation

- **[CHANGELOG.md](CHANGELOG.md)**: Version history and breaking changes
- **[CAMERA_SETUP.md](CAMERA_SETUP.md)**: Camera configuration and troubleshooting
- **[PRINTER_IMPLEMENTATION.md](PRINTER_IMPLEMENTATION.md)**: Printer setup and technical details
- **[QR_OPTIMIZATION.md](QR_OPTIMIZATION.md)**: QR code generation optimization
- **[assets/print-frames/README.md](assets/print-frames/README.md)**: Frame creation guide

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -m "Add my feature"`
4. Push to the branch: `git push origin feature/my-feature`
5. Open a Pull Request

## License

See repository for license information.

## Author

**sescandell**

- GitHub: [@sescandell](https://github.com/sescandell)
- Repository: [halloothween](https://github.com/sescandell/halloothween)
