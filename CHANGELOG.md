# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2026-01-25

### 🚀 Major Changes

This is a major modernization release upgrading the entire stack to latest technologies.

### ✨ Added

- **ES Modules Support**: Full migration from CommonJS to ES Modules (`"type": "module"`)
- **Environment Variables**: Added `.env` file support with `dotenv` for configuration
  - `AZURE_ENABLED`: Enable/disable Azure streaming
  - `PAUSE_STREAM_ON_CAPTURE`: Windows webcam capture mode
  - `AZURE_STREAMER_URL`, `SHARED_SECRET`, `RPI_ID`: Azure configuration
- **Smart BMP Conversion**: Automatic BMP to Sharp format conversion for Windows webcam compatibility
- **QR Code Caching**: Client-side QR code generation caching for better performance
- **Debug Logging**: Enhanced logging with socket IDs for better troubleshooting

### 🔄 Changed

- **Node.js Requirement**: Now requires Node.js >= 18.0.0 (was unspecified)
- **Express**: Upgraded from 4.16.4 to 5.2.1
  - Added error handling to `server.listen()` callbacks (Express 5 requirement)
- **Socket.IO**: Upgraded from 4.7.2 to 4.8.3
- **Image Processing**: Replaced `imagemagick` (0.1.3) with `sharp` (0.34.5)
  - 🚀 Better performance with async/await and Promise.all parallelization
  - ✅ Modern, actively maintained library
  - 🖼️ Generates 3 image formats: original (95% quality), thumbnail (158px), display (1024px)
- **CORS**: Updated from 2.7.1 to 2.8.6
- **UUID**: Updated from 9.0.0 to 11.1.0 (PhotoboothStreamer)
- **EJS**: **Critical security update** from 0.8.5 to 4.0.1 (fixes 5 vulnerabilities)

### 🔧 Fixed

- **Stream Pause Race Condition**: Fixed Socket.IO event listener registration timing (routes.js:243-276)
  - Listener now registered BEFORE emitting `requestStreamPause` to avoid timeout
  - Removed redundant empty handler that was intercepting events
- **PhotoboothStreamer Import**: Fixed ES module import for socket.io
  - Changed from `import socketIo from 'socket.io'` to `import { Server } from 'socket.io'`
- **Windows Webcam Support**: Added BMP format auto-detection and conversion
- **Multiple Socket Connections**: Better handling of multiple client connections

### 🔐 Security

- **0 Vulnerabilities**: All security vulnerabilities resolved
  - Fixed 5 critical/high vulnerabilities in EJS (upgraded to 4.0.1)
  - Removed deprecated imagemagick dependency
  - All dependencies audited and updated

### 📚 Documentation

- Added comprehensive `MIGRATION_TRACKER.md` documenting the entire migration process
- Created `CHANGELOG.md` (this file)
- Updated `README.md` with new requirements and architecture
- Updated `CAMERA_SETUP.md` with ES Modules examples

### ⚠️ BREAKING CHANGES

#### For Developers

1. **Node.js Version**: Node.js >= 18.0.0 is now required
   ```bash
   node --version  # Must be >= 18.0.0
   ```

2. **ES Modules**: All JavaScript files now use ES Modules syntax
   ```javascript
   // OLD (CommonJS)
   const express = require('express');
   module.exports = MyClass;
   
   // NEW (ES Modules)
   import express from 'express';
   export class MyClass {}
   export default myFunction;
   ```

3. **CameraAdapter**: Changed from class to async factory function
   ```javascript
   // OLD
   const camera = new CameraAdapter();
   
   // NEW
   const camera = await createCameraAdapter();
   ```

4. **ImageMagick Removed**: Sharp is now used for image processing
   - No need to install `imagemagick` system package anymore
   - Faster and more reliable image processing

5. **Express 5**: Minor API changes
   - `app.listen()` callback now receives error as first parameter
   - Better error handling required

6. **Socket.IO 4.8+**: ES Modules import syntax
   ```javascript
   // PhotoboothStreamer
   import { Server } from 'socket.io';
   const io = new Server(server, options);
   ```

#### For System Administrators

1. **System Dependencies**: ImageMagick no longer required
   ```bash
   # CAN BE REMOVED (optional)
   apt remove imagemagick
   ```

2. **Environment Configuration**: Create `.env` file from `.env.example`
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Node.js Update**: Ensure Node.js >= 18.0.0 is installed
   ```bash
   # On Raspberry Pi / Debian
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

### 📦 Dependencies Summary

#### Main Project

| Package | Old Version | New Version | Notes |
|---------|-------------|-------------|-------|
| Node.js | Any | >= 18.0.0 | **Required** |
| express | 4.16.4 | 5.2.1 | Major upgrade |
| socket.io | 4.7.2 | 4.8.3 | Minor upgrade |
| socket.io-client | 4.7.2 | 4.8.3 | Minor upgrade |
| ejs | 0.8.5 | 4.0.1 | **Security fix** |
| cors | 2.7.1 | 2.8.6 | Minor upgrade |
| imagemagick | 0.1.3 | **REMOVED** | Replaced by sharp |
| sharp | - | 0.34.5 | **NEW** |
| dotenv | - | 17.2.3 | **NEW** |
| bmp-ts | - | 1.0.9 | **NEW** (BMP support) |

#### PhotoboothStreamer

| Package | Old Version | New Version | Notes |
|---------|-------------|-------------|-------|
| express | 4.x | 5.2.1 | Major upgrade |
| socket.io | 4.7.2 | 4.8.3 | Minor upgrade |
| uuid | 9.0.0 | 11.1.0 | Major upgrade |
| cors | 2.7.1 | 2.8.6 | Minor upgrade |

### 🧪 Testing

- ✅ 20/20 tests passed (100%)
- ✅ Windows webcam capture validated
- ✅ All HTTP endpoints functional
- ✅ Socket.IO communication validated
- ✅ Image processing (Sharp) working perfectly
- ✅ QR code generation operational
- ✅ Multiple photo capture stable (no memory leaks)
- ⚠️ Raspberry Pi + gphoto2 testing pending (production environment)

### 🎯 Migration Path

For users upgrading from v1.x to v2.0.0:

1. **Backup your current installation**
   ```bash
   cp -r halloothween halloothween-backup
   ```

2. **Update Node.js to >= 18.0.0**

3. **Pull the latest code**
   ```bash
   git pull origin migration/modern-stack
   ```

4. **Install dependencies**
   ```bash
   npm install
   cd PhotoboothStreamer && npm install && cd ..
   ```

5. **Create `.env` file**
   ```bash
   cp .env.example .env
   # Edit .env with your settings
   ```

6. **Test the application**
   ```bash
   npm start
   # In another terminal
   cd PhotoboothStreamer && npm start
   ```

7. **Verify photo capture works**
   - Open http://localhost:8181/all-in-one
   - Take a test photo
   - Verify 3 files generated (pictures/, thumbnails/, display/)

### 📊 Performance

- Image processing: < 3 seconds per photo (including capture + 3 formats)
- Memory: Stable after multiple captures (no leaks detected)
- Thumbnail generation: Parallel with display generation (Promise.all)
- QR code: Client-side caching for instant display on repeated views

### 🙏 Acknowledgments

- Express 5 migration codemods: [@expressjs/v5-migration-recipe](https://github.com/codemod-com/codemod/tree/main/packages/codemods/expressjs/v5-migration-recipe)
- Sharp library: [sharp](https://sharp.pixelplumbing.com/)
- Migration documentation inspired by [Keep a Changelog](https://keepachangelog.com/)

---

## [1.0.0] - 2024-01-02

### Initial Release

- Basic photobooth functionality with gphoto2 and webcam support
- Express 4 web server
- Socket.IO real-time communication
- ImageMagick image processing
- Azure streaming integration
- QR code generation for photo sharing
