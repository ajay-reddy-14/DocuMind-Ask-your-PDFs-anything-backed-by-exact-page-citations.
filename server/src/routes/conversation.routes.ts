import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { validateBody, validateParams } from '../middleware/validate';
import {
  idParamSchema,
  createConversationSchema,
  createMessageSchema,
} from '../validators/conversation.validators';
import * as conversationController from '../controllers/conversation.controller';

export const conversationRouter = Router();

// All conversation routes require authentication
conversationRouter.use(authenticate);

conversationRouter.post('/', validateBody(createConversationSchema), conversationController.createConversation);
conversationRouter.get('/', conversationController.listConversations);
conversationRouter.get('/:id', validateParams(idParamSchema), conversationController.getConversation);
conversationRouter.delete('/:id', validateParams(idParamSchema), conversationController.deleteConversation);
conversationRouter.get('/:id/messages', validateParams(idParamSchema), conversationController.getMessages);
conversationRouter.post(
  '/:id/messages',
  validateParams(idParamSchema),
  validateBody(createMessageSchema),
  conversationController.sendMessage
);

