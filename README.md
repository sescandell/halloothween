# Photobooth Halloothween

A modern photobooth application with real-time photo capture, processing, and Azure cloud streaming.

## 🚀 Version 2.0.0

This version includes major modernizations:
- ✅ **ES Modules** (modern JavaScript)
- ✅ **Express 5** (latest web framework)
- ✅ **Sharp** (fast image processing)
- ✅ **0 Security Vulnerabilities**
- ✅ **Node.js >= 18** support

See [CHANGELOG.md](CHANGELOG.md) for detailed changes.

---

## 📋 Requirements

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

#### For Raspberry Pi (gphoto2 for DSLR cameras)

```bash
# Install gphoto2 development libraries
sudo apt install libgphoto2-dev

# Verify gphoto2 is working
gphoto2 --version
```

#### For Windows Development (webcam)

No additional system dependencies required. The application will automatically use your system webcam.

### ~~ImageMagick~~ (No longer required in v2.0.0)

**Note**: ImageMagick has been replaced by Sharp (pure JavaScript, faster, no system dependencies).

---

## 📦 Installation

### 1. Clone the repository

```bash
git clone https://github.com/sescandell/halloothween.git
cd halloothween
```

### 2. Install dependencies

```bash
# Main project
npm install

# Azure streamer service
cd PhotoboothStreamer
npm install
cd ..
```

**Note**: The `postinstall` script will automatically attempt to install optional camera dependencies (gphoto2, node-webcam) based on your platform.

### 3. Configuration

Copy the example environment file and configure:

```bash
cp .env.example .env
```

Edit `.env` with your settings:

```bash
# Azure Streaming (optional)
AZURE_ENABLED=false                          # Set to true to enable Azure
AZURE_STREAMER_URL=https://your-app.azurewebsites.net
SHARED_SECRET=your-shared-secret-here
RPI_ID=rpi-001

# Capture Mode
PAUSE_STREAM_ON_CAPTURE=true                 # true for Windows webcam, false for Linux/gphoto2
```

---

## 🎯 Usage

### Start the main photobooth server

```bash
npm start
```

The server will start on **port 8181**.

### Start the Azure streaming service (optional)

In a separate terminal:

```bash
cd PhotoboothStreamer
npm start
```

The streaming service will start on **port 3000**.

### Access the photobooth

Open your browser and navigate to:

- **All-in-one interface**: http://localhost:8181/all-in-one
- **Controller**: http://localhost:8181/controller
- **Displayer**: http://localhost:8181/displayer
- **Manager**: http://localhost:8181/manager

---

## 🏗️ Architecture

### Technology Stack

| Component | Technology | Version |
|-----------|-----------|---------|
| Runtime | Node.js | >= 18.0.0 |
| Module System | ES Modules | Native |
| Web Framework | Express | 5.2.1 |
| Real-time | Socket.IO | 4.8.3 |
| Image Processing | Sharp | 0.34.5 |
| Template Engine | EJS | 4.0.1 |
| Camera (Linux) | gphoto2 | 0.3.2 (optional) |
| Camera (Windows) | node-webcam | 0.8.1 (optional) |

### Project Structure

```
halloothween/
├── server.js                 # Main server (Express 5 + Socket.IO)
├── routes.js                 # HTTP routes and Socket.IO handlers
├── config.js                 # Application configuration
├── azure-config.js           # Azure streaming configuration
├── .env                      # Environment variables (create from .env.example)
├── utils/
│   ├── CameraAdapter.js      # Async factory for camera selection
│   ├── GPhotoCamera.js       # gphoto2 wrapper (Linux/DSLR)
│   ├── WebcamCamera.js       # Webcam wrapper (Windows)
│   ├── AzureStreamingClient.js  # Azure connection client
│   ├── InMemoryStore.js      # Simple in-memory storage
│   └── bmpToSharp.js         # BMP format auto-detection and conversion
├── public/
│   ├── pictures/             # Original photos (high quality)
│   ├── thumbnails/           # Thumbnail versions (158px wide)
│   ├── display/              # Display versions (1024px wide)
│   ├── js/                   # Client-side JavaScript
│   └── css/                  # Stylesheets
├── views/                    # EJS templates
│   ├── all-in-one.html
│   ├── controller.html
│   ├── displayer.html
│   └── manager.html
└── PhotoboothStreamer/       # Azure streaming service
    ├── server.js             # Express 5 + Socket.IO server
    └── package.json          # Separate dependencies
```

### Camera Detection

The application automatically detects the platform and selects the appropriate camera:

- **Windows**: Uses system webcam via `node-webcam`
- **Linux/Raspberry Pi**: Uses gphoto2 for DSLR cameras

This is handled by `utils/CameraAdapter.js` using an async factory pattern:

```javascript
// ES Modules (v2.0.0+)
import { createCameraAdapter } from './utils/CameraAdapter.js';

const camera = await createCameraAdapter();  // Auto-detects platform
```

### Image Processing Pipeline (Sharp)

When a photo is captured, Sharp generates 3 versions in parallel:

1. **Original** (95% quality JPEG) → `public/pictures/`
2. **Thumbnail** (158px wide) → `public/thumbnails/`
3. **Display** (1024px wide) → `public/display/`

All processing is done asynchronously with `Promise.all` for maximum performance.

---

## 🌐 Video over HTTP

To enable webcam preview over HTTP on Chrome, you need to treat localhost as secure:

1. Navigate to: `chrome://flags/#unsafely-treat-insecure-origin-as-secure`
2. Add your Raspberry Pi IP: `http://192.168.x.x:8181`
3. Restart Chrome

---

## 🔧 Development

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

### Camera Development on Windows

For development on Windows without a DSLR, the application automatically uses your webcam.

Set in `.env`:
```bash
PAUSE_STREAM_ON_CAPTURE=true
```

This pauses the video stream before capture to avoid conflicts with the webcam driver.

### BMP Format Support

Windows webcams may return BMP format. The application automatically detects and converts BMP to JPEG using `bmpToSharp.js`.

---

## 📖 Additional Documentation

- **[CHANGELOG.md](CHANGELOG.md)**: Version history and breaking changes
- **[MIGRATION_TRACKER.md](MIGRATION_TRACKER.md)**: Detailed migration process from v1.x to v2.0.0
- **[CAMERA_SETUP.md](CAMERA_SETUP.md)**: Camera configuration and troubleshooting
- **[QR_OPTIMIZATION.md](QR_OPTIMIZATION.md)**: QR code generation optimization

---

## 🐛 Troubleshooting

### Error: "Cannot use import statement outside a module"

Make sure you're using Node.js >= 18.0.0 and `package.json` has `"type": "module"`.

### Error: "gphoto2 module not found" on Windows

This is normal. On Windows, the application will automatically fall back to webcam mode. The gphoto2 module is optional.

### Camera not detected

#### Linux/Raspberry Pi
```bash
# Check if gphoto2 can see your camera
gphoto2 --auto-detect

# If not, check USB connection and camera is in PTP/MTP mode
```

#### Windows
```bash
# Check webcam permissions in Windows Settings
Settings > Privacy > Camera > Allow desktop apps to access camera
```

### Photos are not generated

Check the logs for errors:
- Sharp processing errors
- File permission issues in `public/pictures/`, `public/thumbnails/`, `public/display/`

```bash
# Ensure directories exist and are writable
ls -la public/
```

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -m "Add my feature"`
4. Push to the branch: `git push origin feature/my-feature`
5. Open a Pull Request

---

## 📄 License

See repository for license information.

---

## 👤 Author

**sescandell**

- GitHub: [@sescandell](https://github.com/sescandell)
- Repository: [halloothween](https://github.com/sescandell/halloothween)

---

## ⚠️ Upgrading from v1.x

If you're upgrading from version 1.x, please read [CHANGELOG.md](CHANGELOG.md) for breaking changes and migration instructions.

Key breaking changes:
- Node.js >= 18.0.0 required
- ES Modules (not CommonJS)
- Express 5 (minor API changes)
- ImageMagick removed (replaced by Sharp)
- Environment variables required (`.env` file)
