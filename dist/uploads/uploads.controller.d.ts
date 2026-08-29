import { UploadsService } from './uploads.service';
export declare class UploadsController {
    private readonly uploadsService;
    constructor(uploadsService: UploadsService);
    uploadSingle(file: Express.Multer.File): Promise<{
        path: string;
        url: string;
        filename: string;
    }>;
    uploadMultiple(files: Express.Multer.File[]): Promise<{
        path: string;
        url: string;
        filename: string;
    }[]>;
}
