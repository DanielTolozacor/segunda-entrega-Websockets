import { Router } from 'express';
import { getProducts } from '../productManager.js';

const router = Router();

// Ruta de login
router.get('/login', (req, res) => {
  res.render('login', {
    title: 'Login de Administrador'
  });
});

// Ruta para la vista estática
router.get('/home', async (req, res) => {
  const products = await getProducts();
  res.render('home', {
    title: 'Home',
    products
  });
});

// Ruta para la vista en tiempo real
router.get('/realtimeproducts', (req, res) => {
  res.render('realTimeProducts', {
    title: 'Productos en tiempo real'
  });
});

// Ruta para la vista HTTP + WebSocket híbrida
router.get('/httpproducts', (req, res) => {
  res.render('httpProducts', {
    title: 'Productos HTTP + WebSocket'
  });
});

export default router;