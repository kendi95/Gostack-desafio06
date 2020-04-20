// import AppError from '../errors/AppError';
import { getCustomRepository, getRepository } from 'typeorm';
import AppError from '../errors/AppError';
import Category from '../models/Category';
import Transaction from '../models/Transaction';
import TransactionRepository from '../repositories/TransactionsRepository';

interface TransactionDTO {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;
}

class CreateTransactionService {
  public async execute({
    title,
    value,
    type,
    category,
  }: TransactionDTO): Promise<Transaction> {
    const transactionRepository = getRepository(Transaction);
    const categoryRepository = getRepository(Category);
    const customRepository = getCustomRepository(TransactionRepository);

    const balance = await customRepository.getBalance();

    if (balance.total < value && type === 'outcome') {
      throw new AppError('You can not transaction with negative value.');
    }

    const categories = await categoryRepository.findOne({
      where: { title: category },
    });

    if (!categories) {
      const newCategory = categoryRepository.create({ title: category });
      await categoryRepository.save(newCategory);

      const transaction = transactionRepository.create({
        title,
        value,
        type,
        category_id: newCategory.id,
      });
      await transactionRepository.save(transaction);
      return transaction;
    }

    const transaction = transactionRepository.create({
      title,
      value,
      type,
      category_id: categories.id,
    });
    await transactionRepository.save(transaction);
    return transaction;
  }
}

export default CreateTransactionService;
