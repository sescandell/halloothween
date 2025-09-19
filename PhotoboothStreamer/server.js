const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
const server = http.createServer(app);

// Configuration CORS
app.use(cors());
app.use(express.json());

// Socket.IO configuration
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Configuration
const PORT = process.env.PORT || 3000;
const SHARED_SECRET = process.env.SHARED_SECRET;

// Storage pour les connexions et requêtes en cours
const connectedRPIs = new Map(); // RPI connections
const pendingRequests = new Map(); // Photo requests waiting for RPI response

console.log('🚀 PhotoboothStreamer server starting...');
console.log('📡 Expected SHARED_SECRET:', SHARED_SECRET ? 'Configured' : 'NOT SET');

// Middleware pour vérifier le secret partagé
function validateSecret(socket, next) {
  const token = socket.handshake.auth.token;
  if (token === SHARED_SECRET) {
    next();
  } else {
    console.log('❌ Invalid token provided:', token);
    next(new Error('Authentication failed'));
  }
}

// Socket.IO connection handling
io.use(validateSecret);

io.on('connection', (socket) => {
  console.log('🔌 New connection:', socket.id);
  
  // RPI registration
  socket.on('register-rpi', (data) => {
    const { rpiId } = data;
    connectedRPIs.set(rpiId, socket.id);
    socket.rpiId = rpiId;
    
    console.log(`📱 RPI registered: ${rpiId} (socket: ${socket.id})`);
    socket.emit('registration-confirmed', { rpiId });
  });
  
  // Handle photo data from RPI
  socket.on('photo-data', (data) => {
    const { requestId, photoData, mimeType = 'image/jpeg', photoId } = data;
    
    console.log(`📸 Received photo data for request: ${requestId}`);
    
    if (pendingRequests.has(requestId)) {
      const { res, photoId: requestedPhotoId } = pendingRequests.get(requestId);
      
      try {
        // Convert base64 to buffer
        const imageBuffer = Buffer.from(photoData, 'base64');
        
        // Generate filename with timestamp if no photoId provided
        const filename = photoId || requestedPhotoId || `photo-${Date.now()}.jpg`;
        const safeFilename = filename.replace(/[^a-zA-Z0-9._-]/g, ''); // Sanitize filename
        
        // Set headers for download
        res.setHeader('Content-Type', mimeType);
        res.setHeader('Content-Length', imageBuffer.length);
        res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}"`);
        res.setHeader('Cache-Control', 'no-cache');
        res.send(imageBuffer);
        
        console.log(`✅ Photo downloaded successfully for request: ${requestId} as ${safeFilename}`);
      } catch (error) {
        console.error(`❌ Error streaming photo for request ${requestId}:`, error);
        res.status(500).json({ error: 'Failed to process image' });
      }
      
      // Clean up pending request
      pendingRequests.delete(requestId);
    } else {
      console.log(`⚠️ No pending request found for: ${requestId}`);
    }
  });
  
  // Handle RPI errors
  socket.on('photo-error', (data) => {
    const { requestId, error } = data;
    
    console.log(`❌ Photo error for request ${requestId}:`, error);
    
    if (pendingRequests.has(requestId)) {
      const { res } = pendingRequests.get(requestId);
      res.status(404).json({ 
        error: 'Photo not found or unavailable',
        details: error 
      });
      pendingRequests.delete(requestId);
    }
  });
  
  // Handle disconnection
  socket.on('disconnect', () => {
    if (socket.rpiId) {
      connectedRPIs.delete(socket.rpiId);
      console.log(`📱 RPI disconnected: ${socket.rpiId}`);
    }
    console.log('🔌 Socket disconnected:', socket.id);
  });
});

// HTTP Routes
app.get('/', (req, res) => {
  res.json({
    service: 'PhotoboothStreamer',
    status: 'running',
    connectedRPIs: connectedRPIs.size,
    pendingRequests: pendingRequests.size,
    timestamp: new Date().toISOString()
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    timestamp: new Date().toISOString()
  });
});

// Main streaming endpoint
app.get('/stream/:photoId', async (req, res) => {
  const { photoId } = req.params;
  const { rpi } = req.query; // Optional RPI ID, will use first available if not specified
  
  console.log(`🎯 Stream request for photo: ${photoId} from RPI: ${rpi || 'auto'}`);
  
  // Find target RPI
  let targetRPI = rpi;
  if (!targetRPI && connectedRPIs.size > 0) {
    // Use first available RPI if none specified
    targetRPI = Array.from(connectedRPIs.keys())[0];
  }
  
  if (!targetRPI || !connectedRPIs.has(targetRPI)) {
    return res.status(503).json({
      error: 'No RPI available',
      availableRPIs: Array.from(connectedRPIs.keys())
    });
  }
  
  const rpiSocketId = connectedRPIs.get(targetRPI);
  const rpiSocket = io.sockets.sockets.get(rpiSocketId);
  
  if (!rpiSocket) {
    connectedRPIs.delete(targetRPI); // Clean up stale connection
    return res.status(503).json({
      error: 'RPI connection lost'
    });
  }
  
  // Generate unique request ID
  const requestId = uuidv4();
  
  // Store the response object for later use (including photoId for filename)
  pendingRequests.set(requestId, { res, photoId, timestamp: Date.now() });
  
  // Request photo from RPI
  rpiSocket.emit('request-photo', {
    requestId,
    photoId
  });
  
  console.log(`📤 Requested photo ${photoId} from RPI ${targetRPI} (request: ${requestId})`);
  
  // Set timeout for request
  setTimeout(() => {
    if (pendingRequests.has(requestId)) {
      pendingRequests.delete(requestId);
      if (!res.headersSent) {
        res.status(408).json({
          error: 'Request timeout',
          photoId,
          requestId
        });
      }
    }
  }, 30000); // 30 second timeout
});

// Start server
server.listen(PORT, () => {
  console.log(`🌐 PhotoboothStreamer listening on port ${PORT}`);
  console.log(`🔗 Stream endpoint: http://localhost:${PORT}/stream/{photoId}`);
  console.log(`🏥 Health check: http://localhost:${PORT}/health`);
});