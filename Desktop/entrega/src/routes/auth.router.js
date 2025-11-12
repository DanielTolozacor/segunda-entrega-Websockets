import { Router } from 'express';
import crypto from 'crypto';

const router = Router();

// Credenciales del administrador
const ADMIN_USER = 'coder';
const ADMIN_PASS = 'coder';

// Login
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  
  if (username === ADMIN_USER && password === ADMIN_PASS) {
    const sessionId = crypto.randomUUID();
    req.sessions.set(sessionId, { 
      username: ADMIN_USER, 
      isAdmin: true,
      loginTime: new Date()
    });
    
    res.json({ 
      success: true, 
      sessionId,
      message: 'Login exitoso' 
    });
  } else {
    res.status(401).json({ 
      success: false, 
      message: 'Credenciales incorrectas' 
    });
  }
});

// Logout
router.post('/logout', (req, res) => {
  const sessionId = req.headers['session-id'];
  if (sessionId && req.sessions.has(sessionId)) {
    req.sessions.delete(sessionId);
  }
  res.json({ success: true, message: 'Sesión cerrada' });
});

// Verificar sesión
router.get('/check', (req, res) => {
  const sessionId = req.headers['session-id'];
  if (sessionId && req.sessions.has(sessionId)) {
    const session = req.sessions.get(sessionId);
    res.json({ isAdmin: session.isAdmin, username: session.username });
  } else {
    res.json({ isAdmin: false });
  }
});

export default router;
