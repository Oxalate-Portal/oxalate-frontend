import {FileUploadValidationError, validateUploadFile} from '../tools/FileUploadValidation';

describe('FileUploadValidation', () => {
    it('uploadAvatarFileValidOk', () => {
        const file = new File(['avatar'], 'avatar.png', {type: 'image/png'});
        const result = validateUploadFile(file, 'avatar');

        expect(result.valid).toBe(true);
        expect(result.error).toBeUndefined();
    });

    it('uploadAvatarFileInvalidTypeFail', () => {
        const file = new File(['avatar'], 'avatar.pdf', {type: 'application/pdf'});
        const result = validateUploadFile(file, 'avatar');

        expect(result.valid).toBe(false);
        expect(result.error).toBe(FileUploadValidationError.INVALID_TYPE);
    });

    it('uploadAvatarFileTooLargeFail', () => {
        const file = new File([new Uint8Array(1024 * 1024 + 1)], 'avatar.jpg', {type: 'image/jpeg'});
        const result = validateUploadFile(file, 'avatar');

        expect(result.valid).toBe(false);
        expect(result.error).toBe(FileUploadValidationError.FILE_TOO_LARGE);
    });

    it('retrieveDocumentFileOk', () => {
        const file = new File(['doc'], 'document.pdf', {type: 'application/pdf'});
        const result = validateUploadFile(file, 'document');

        expect(result.valid).toBe(true);
    });

    it('uploadDiveFileInvalidTypeFail', () => {
        const file = new File(['dive'], 'dive.zip', {type: 'application/zip'});
        const result = validateUploadFile(file, 'dive');

        expect(result.valid).toBe(false);
        expect(result.error).toBe(FileUploadValidationError.INVALID_TYPE);
    });
});

