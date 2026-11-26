import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { validateParams } from '../middleware/validate';
import { idParamSchema } from '../validators/conversation.validators';
import * as documentController from '../controllers/document.controller';
import { uploadMiddleware } from '../middleware/upload';

export const documentRouter = Router();

// All document routes require authentication
documentRouter.use(authenticate);

documentRouter.post('/upload', uploadMiddleware, documentController.uploadDocument);
documentRouter.get('/', documentController.listDocuments);
documentRouter.get('/:id', validateParams(idParamSchema), documentController.getDocument);
documentRouter.delete('/:id', validateParams(idParamSchema), documentController.deleteDocument);
documentRouter.post('/:id/summary', validateParams(idParamSchema), documentController.summarizeDocument);

