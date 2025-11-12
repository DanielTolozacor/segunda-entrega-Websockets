import { Router } from 'express';
import multer from 'multer';
import path from 'path';

const router = Router();

// ✅ Acá va la configuración de storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(process.cwd(), 'src/public/uploads')); // Guarda en carpeta accesible
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + file.originalname;
    cb(null, uniqueName); // Nombre único para evitar conflictos
  }
});

const upload = multer({ storage });

// ✅ Acá va la ruta que usa ese storage
router.post('/upload-image', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No se subió ninguna imagen' });
  }

  const imageUrl = `/uploads/${req.file.filename}`;
  res.json({ imageUrl });
});

export default router;