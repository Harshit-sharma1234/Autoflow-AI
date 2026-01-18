import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { FILE_UPLOAD } from '@autoflow/shared';
import { ValidationError } from '../utils/errors';

// Configure multer storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../../uploads'));
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `${uuidv4()}${ext}`);
    },
});

// File filter
const fileFilter = (
    req: Express.Request,
    file: Express.Multer.File,
    cb: multer.FileFilterCallback
) => {
    const ext = path.extname(file.originalname).toLowerCase();

    if (!FILE_UPLOAD.ALLOWED_EXTENSIONS.includes(ext as any)) {
        cb(new ValidationError(`File type ${ext} is not allowed`));
        return;
    }

    if (!FILE_UPLOAD.ALLOWED_TYPES.includes(file.mimetype as any)) {
        cb(new ValidationError(`MIME type ${file.mimetype} is not allowed`));
        return;
    }

    cb(null, true);
};

export const uploadMiddleware = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: FILE_UPLOAD.MAX_SIZE,
        files: 1,
    },
});
