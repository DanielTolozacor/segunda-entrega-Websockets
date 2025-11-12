import fs from 'fs/promises';
import path from 'path';

// Ruta absoluta al archivo JSON
const filePath = path.resolve('src/products.json');

// Genera un ID único basado en timestamp y título/nombre
function generateUniqueId(title) {
  const timestamp = Date.now();
  const cleanTitle = title.trim().replace(/\s+/g, '_');
  return `${timestamp}-${cleanTitle}`;
}

// Lee todos los productos
export async function getProducts() {
  try {
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

// Agrega un nuevo producto con ID único
export async function addProduct(product) {
  const products = await getProducts();
  // Usa 'name' o 'title' según lo que venga en el producto
  const productName = product.name || product.title || 'producto';
  product.id = generateUniqueId(productName);
  products.push(product);
  await fs.writeFile(filePath, JSON.stringify(products, null, 2));
  return products;
}

// Elimina un producto por ID
export async function deleteProduct(id) {
  let products = await getProducts();
  products = products.filter(p => p.id !== id);
  await fs.writeFile(filePath, JSON.stringify(products, null, 2));
  return products;
}

// Actualiza un producto por ID
export async function updateProduct(id, updatedData) {
  let products = await getProducts();
  const index = products.findIndex(p => p.id === id);
  
  if (index === -1) {
    throw new Error('Producto no encontrado');
  }
  
  // Mantener el ID original y actualizar los demás campos
  products[index] = { 
    ...products[index], 
    ...updatedData, 
    id: products[index].id // Preservar ID original
  };
  
  await fs.writeFile(filePath, JSON.stringify(products, null, 2));
  return products;
}
