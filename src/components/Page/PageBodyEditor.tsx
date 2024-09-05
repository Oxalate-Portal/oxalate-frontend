import { CKEditor } from "@ckeditor/ckeditor5-react";
import "./ckeditor_dark_theme.css";
import ClassicEditor from "@ckeditor/ckeditor5-build-classic";
import { CKUploadAdapter } from "../../services";
import { SessionVO } from "../../models";

interface PageBodyEditorProps {
    value: string,
    language: string,
    pageId: number,
    onChange: (data: string) => void
}

export function PageBodyEditor({value, onChange, language, pageId}: PageBodyEditorProps): JSX.Element {
    function contentUpdated(event: any, editor: any) {
        const data = editor.getData();
        onChange(data);
    }

    function initiateUploadAdapter(editor: any) {
        const session: SessionVO = JSON.parse(localStorage.getItem("user") || "{}");

        if (session == undefined || session.accessToken == undefined) {
            return {};
        }

        editor.plugins.get("FileRepository").createUploadAdapter = (loader: any) => {
            return new CKUploadAdapter(loader, language, pageId, session.accessToken, `${import.meta.env.VITE_APP_API_URL}` + "/files/upload");
        };
    }

    return (
            <CKEditor
                    editor={ClassicEditor}
                    onChange={contentUpdated}
                    config={{
                        extraPlugins: [initiateUploadAdapter],
                        toolbar: {
                            shouldNotGroupWhenFull: true
                        },
                        image: {
                            toolbar: [
                                "imageStyle:wrapText",
                                "imageStyle:breakText",
                                "|",
                                "toggleImageCaption",
                                "imageTextAlternative"
                            ],
                            upload: {
                                types: ["jpeg", "png", "gif", "bmp", "webp"],
                            }
                        }
                    }}
                    data={value}
            />
    );
}
