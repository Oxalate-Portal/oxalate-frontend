import type { UploadProps } from "antd";
import { Button, message, Upload } from "antd";
import { UploadOutlined } from "@ant-design/icons";

const props: UploadProps = {
    name: 'file',
    action: `${import.meta.env.VITE_APP_API_URL}` + "/api/files/upload/certificate-files",
    headers: {
        authorization: 'authorization-text',
    },
    onChange(info) {
        if (info.file.status !== 'uploading') {
            console.log(info.file, info.fileList);
        }
        if (info.file.status === 'done') {
            message.success(`${info.file.name} file uploaded successfully`);
        } else if (info.file.status === 'error') {
            message.error(`${info.file.name} file upload failed.`);
        }
    },
};

export function CertificateUploader() {
    return (
            <Upload {...props}>
                <Button icon={<UploadOutlined />}>Click to Upload</Button>
            </Upload>
    );
}
