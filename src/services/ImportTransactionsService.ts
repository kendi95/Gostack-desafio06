import csvParse from 'csv-parse';
import fs from 'fs';
import { getCustomRepository, getRepository, In } from 'typeorm';
import Category from '../models/Category';
import Transaction from '../models/Transaction';
import TransactionRepository from '../repositories/TransactionsRepository';

interface TransactionDTO {
  title: string;
  type: 'income' | 'outcome';
  value: number;
  category: string;
}

class ImportTransactionsService {
  public async execute(filePath: string): Promise<Transaction[]> {
    const contactsReactStream = fs.createReadStream(filePath);
    const parses = csvParse({
      from_line: 2,
    });
    const parseCSV = contactsReactStream.pipe(parses);
    const transactions: TransactionDTO[] = [];
    const categories: string[] = [];
    parseCSV.on('data', async line => {
      const [title, type, value, category] = line.map((cell: string) =>
        cell.trim(),
      );
      if (!title || !value || !type) {
        return;
      }
      categories.push(category);
      transactions.push({ title, type, value, category });
    });
    await new Promise(resolve => parseCSV.on('end', resolve));

    const cateroryRepository = getRepository(Category);
    const transactionRepository = getCustomRepository(TransactionRepository);

    const existsCategories = await cateroryRepository.find({
      where: {
        title: In(categories),
      },
    });

    const existentCategoriesTitle = existsCategories.map(
      (category: Category) => category.title,
    );

    const addCategoryTitle = categories
      .filter(category => !existentCategoriesTitle.includes(category))
      .filter((value, index, self) => self.indexOf(value) === index);

    const newCategories = cateroryRepository.create(
      addCategoryTitle.map(title => ({
        title,
      })),
    );

    await cateroryRepository.save(newCategories);

    const finalCategories = [...newCategories, ...existsCategories];

    const createdTransactions = await transactionRepository.create(
      transactions.map(transaction => ({
        title: transaction.title,
        type: transaction.type,
        value: transaction.value,
        category: finalCategories.find(
          category => category.title === transaction.category,
        ),
      })),
    );

    await transactionRepository.save(createdTransactions);
    await fs.promises.unlink(filePath);

    return createdTransactions;
  }
}

export default ImportTransactionsService;
