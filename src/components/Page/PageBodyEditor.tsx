import { CKEditor } from "@ckeditor/ckeditor5-react";
import Editor from "ckeditor5-custom-build/build/ckeditor";
import "./ckeditor_dark_theme.css";

interface PageBodyEditorProps {
    value: string;
    onChange: (data: string) => void;
}

export function PageBodyEditor({ value, onChange }: PageBodyEditorProps): JSX.Element {

    function contentUpdated(event: any, editor: any) {
        const data = editor.getData();
        onChange(data);
    }

    return (
            <CKEditor
                    editor={Editor}
                    onChange={contentUpdated}
                    data={value}
            />
    );
}
