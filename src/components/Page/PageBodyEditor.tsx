import { CKEditor } from "@ckeditor/ckeditor5-react";
import {
    Alignment,
    Bold,
    ClassicEditor,
    FindAndReplace,
    Heading,
    Image,
    ImageCaption,
    ImageResize,
    ImageSizeAttributes,
    ImageStyle,
    ImageTextAlternative,
    ImageToolbar,
    ImageUpload,
    Indent,
    IndentBlock,
    Italic,
    Link,
    LinkImage,
    List,
    Paragraph,
    PasteFromOffice,
    SourceEditing,
    Table,
    TableToolbar,
    TextTransformation,
    Undo
} from "ckeditor5";
import "ckeditor5/ckeditor5.css";
import "./ckeditor_dark_theme.css";
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
            return new CKUploadAdapter(loader, language, pageId, session.accessToken, `${import.meta.env.VITE_APP_API_URL}` + "/files/upload/page-files");
        };
    }

    return (
            <CKEditor
                    editor={ClassicEditor}
                    onChange={contentUpdated}
                    config={{
                        plugins: [Alignment, Bold, FindAndReplace, Italic, Heading, Image, ImageCaption, ImageResize, ImageSizeAttributes, ImageStyle, ImageTextAlternative, ImageToolbar,
                            ImageUpload, Indent, IndentBlock, Link, LinkImage, List, Paragraph, PasteFromOffice, SourceEditing, Table, TableToolbar,
                            TextTransformation, Undo],
                        extraPlugins: [initiateUploadAdapter],
                        toolbar: {
                            items: [
                                "heading",
                                "|",
                                "bold",
                                "italic",
                                "|",
                                "link",
                                "|",
                                "bulletedList",
                                "numberedList",
                                "alignment",
                                "|",
                                "imageUpload",
                                "insertTable",
                                "|",
                                "undo",
                                "redo",
                                "|",
                                "outdent",
                                "indent",
                                "|",
                                "sourceEditing",
                                "findAndReplace"
                            ],
                            shouldNotGroupWhenFull: true
                        },
                        image: {
                            toolbar: [
                                "imageStyle:wrapText",
                                "imageStyle:breakText",
                                "|",
                                "toggleImageCaption",
                                "imageTextAlternative",
                                "resizeImage",
                                "LinkImage"
                            ],
                            resizeOptions: [
                                {
                                    name: "resizeImage:original",
                                    label: "Original",
                                    value: null
                                },
                                {
                                    name: "resizeImage:50",
                                    label: "10%",
                                    value: "10"
                                },
                                {
                                    name: "resizeImage:50",
                                    label: "25%",
                                    value: "25"
                                },
                                {
                                    name: "resizeImage:50",
                                    label: "50%",
                                    value: "50"
                                },
                                {
                                    name: "resizeImage:75",
                                    label: "75%",
                                    value: "75"
                                }
                            ],
                            upload: {
                                types: ["jpeg", "png", "gif", "webp"],
                            }
                        }
                    }}
                    data={value}
            />
    );
}
