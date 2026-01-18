import { Request, Response } from 'express';
import { buildSuccessResponse } from '../utils/errors';
import { NotFoundError } from '../utils/errors';

export class FileController {
    upload = async (req: Request, res: Response): Promise<void> => {
        if (!req.file) {
            throw new NotFoundError('File');
        }

        // TODO: Upload to S3/Cloudinary
        // For now, return local file info
        const fileInfo = {
            id: req.file.filename,
            originalName: req.file.originalname,
            mimeType: req.file.mimetype,
            size: req.file.size,
            path: req.file.path,
        };

        res.status(201).json(buildSuccessResponse(fileInfo));
    };

    getById = async (req: Request, res: Response): Promise<void> => {
        // TODO: Implement file retrieval
        res.json(buildSuccessResponse({ message: 'Not yet implemented' }));
    };

    delete = async (req: Request, res: Response): Promise<void> => {
        // TODO: Implement file deletion
        res.status(204).send();
    };
}
