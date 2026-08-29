export declare class UploadsService {
    private readonly uploadDir;
    constructor();
    processAndSaveImage(file: Express.Multer.File): Promise<{
        path: string;
        url: string;
        filename: string;
    }>;
}
