import { Router } from 'express';
import multer from 'multer';
import { getCustomRepository, getRepository } from 'typeorm';
import uploadConfig from '../configs/multer';
import Transaction from '../models/Transaction';
import TransactionsRepository from '../repositories/TransactionsRepository';
import CreateTransactionService from '../services/CreateTransactionService';
import DeleteTransactionService from '../services/DeleteTransactionService';
import ImportTransactionsService from '../services/ImportTransactionsService';
// import ImportTransactionsService from '../services/ImportTransactionsService';

const transactionsRouter = Router();
const upload = multer(uploadConfig);

transactionsRouter.get('/', async (request, response) => {
  const transactionRepository = getRepository(Transaction);
  const customTransactionRepository = getCustomRepository(
    TransactionsRepository,
  );
  const transactions = await transactionRepository.find({
    relations: ['category'],
    select: ['title', 'type', 'value', 'id'],
  });
  const balance = await customTransactionRepository.getBalance();
  return response.status(200).json({ transactions, balance });
});

transactionsRouter.post('/', async (request, response) => {
  const service = new CreateTransactionService();
  const { title, value, type, category } = request.body;
  const transaction = await service.execute({ title, value, type, category });
  return response.status(201).json(transaction);
});

transactionsRouter.delete('/:id', async (request, response) => {
  const { id } = request.params;
  const service = new DeleteTransactionService();
  await service.execute({ id });
  return response.status(204).send();
});

transactionsRouter.post(
  '/import',
  upload.single('file'),
  async (request, response) => {
    const service = new ImportTransactionsService();
    const transaction = await service.execute(request.file.path);
    return response.status(201).json(transaction);
  },
);

export default transactionsRouter;
