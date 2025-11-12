import express from 'express';
import http from 'http'; 
import { Server } from 'socket.io';
import { create } from 'express-handlebars';
import path from 'path';
import { fileURLToPath } from 'url';
import viewsRouter from './routes/views.router.js';
import productsRouter from './routes/products.router.js';
import uploadRouter from './routes/uploader.js';
import authRouter from './routes/auth.router.js';
import { addProduct, deleteProduct, getProducts, updateProduct } from './productManager.js';



const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Almacenamiento simple de sesiones (en memoria)
const sessions = new Map();

// Middleware para verificar autenticación (definir pero no usar aún)
function isAdmin(req, res, next) {
  const sessionId = req.headers['session-id'];
  if (sessionId && sessions.has(sessionId) && sessions.get(sessionId).isAdmin) {
    next();
  } else {
    res.status(401).json({ error: 'No autorizado. Se requiere login de administrador.' });
  }
}

io.on('connection', async socket => {
  console.log('Cliente conectado');
  const products = await getProducts(); 
  socket.emit('products', products);

  socket.on('addProduct', async product => {
    const updated = await addProduct(product); 
    io.emit('products', updated);              
  });

  socket.on('updateProduct', async ({ id, product }) => {
    try {
      const updated = await updateProduct(id, product);
      io.emit('products', updated);
    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  });

  socket.on('deleteProduct', async id => {
    const updated = await deleteProduct(id);   
    io.emit('products', updated);              
  });

  socket.on('disconnect', () => {
    console.log('Cliente desconectado');
  });
});

const hbs = create({ extname: '.handlebars' });
app.engine('.handlebars', hbs.engine);

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'handlebars');


// Middleware (IMPORTANTE: antes de los routers)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Middleware para hacer disponible io y sessions en todas las rutas
app.use((req, res, next) => {
  req.io = io;
  req.sessions = sessions;
  next();
});

app.use((req, res, next) => {
  res.setHeader("Content-Security-Policy", "default-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; connect-src 'self' ws://localhost:8080");
  next();
});


app.use('/', uploadRouter);

// Router de autenticación
app.use('/api/auth', authRouter);

// Router de API REST para productos
app.use('/api/products', productsRouter);

// Usa el router
app.use('/', viewsRouter);
app.get('/', (req, res) => {
  res.redirect('/home');
});

server.listen(8080, () => {
  console.log('Servidor escuchando en http://localhost:8080');
});
// Inicia el servidor
//app.listen(8080, () => console.log('Servidor en puerto 8080'));//
