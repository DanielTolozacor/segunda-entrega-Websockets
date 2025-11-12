import { Router } from 'express';
import { addProduct, deleteProduct, getProducts, updateProduct } from '../productManager.js';

const router = Router();

// Obtener todos los productos
router.get('/', async (req, res) => {
  try {
    const products = await getProducts();
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener productos' });
  }
});

// Agregar un nuevo producto (HTTP POST + Socket.io emit)
router.post('/', async (req, res) => {
  try {
    const { name, price, image } = req.body;
    
    if (!name || !price) {
      return res.status(400).json({ error: 'Faltan campos obligatorios' });
    }

    const product = { name, price, image };
    const updatedProducts = await addProduct(product);
    
    // ✅ Aquí está la magia: usar io dentro del POST
    req.io.emit('products', updatedProducts);
    
    res.status(201).json({ 
      message: 'Producto agregado', 
      product: updatedProducts[updatedProducts.length - 1] 
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al agregar producto' });
  }
});

// Actualizar un producto por ID (HTTP PUT + Socket.io emit)
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, price, image } = req.body;
    
    if (!name || !price) {
      return res.status(400).json({ error: 'Faltan campos obligatorios' });
    }

    const updatedProducts = await updateProduct(id, { name, price, image });
    
    // ✅ Emitir actualización a todos los clientes conectados
    req.io.emit('products', updatedProducts);
    
    res.json({ 
      message: 'Producto actualizado', 
      product: updatedProducts.find(p => p.id === id)
    });
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
});

// Eliminar un producto por ID (HTTP DELETE + Socket.io emit)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updatedProducts = await deleteProduct(id);
    
    // ✅ Emitir actualización a todos los clientes conectados
    req.io.emit('products', updatedProducts);
    
    res.json({ message: 'Producto eliminado', id });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar producto' });
  }
});

export default router;
