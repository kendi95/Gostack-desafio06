import crypto from 'crypto';
import multer from 'multer';
import { resolve } from 'path';

const folder = resolve(__dirname, '..', '..', 'temp');

export default {
  directory: folder,
  storage: multer.diskStorage({
    destination: folder,
    filename: (req, file, callback) => {
      const hash = crypto.randomBytes(10).toString('HEX');
      const filename = `${hash}-${file.originalname}`;
      return callback(null, filename);
    },
  }),
};
