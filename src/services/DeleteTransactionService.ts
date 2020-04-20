// import AppError from '../errors/AppError';
import { getRepository } from 'typeorm';
import Transaction from '../models/Transaction';

interface TransactionDTO {
  id: string;
}

class DeleteTransactionService {
  public async execute({ id }: TransactionDTO): Promise<void> {
    const transactionRepository = getRepository(Transaction);
    const transaction = await transactionRepository.findOne({ where: { id } });
    await transactionRepository.remove(transaction);
  }
}

export default DeleteTransactionService;
