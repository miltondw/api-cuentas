import express from 'express';
import { previewTemplate, previewWithForm } from '../controllers/preview.controller.js';

const router = express.Router();

// Ruta para vista previa básica del template
router.get('/preview-template', previewTemplate);

// Ruta para vista previa con datos personalizados a través de query params
router.get('/preview-template-with-form', previewWithForm);

// Ruta para servir la interfaz de edición de plantilla
import { servePreviewForm } from '../controllers/preview.controller.js';
router.get('/template-editor', servePreviewForm);

export default router;
