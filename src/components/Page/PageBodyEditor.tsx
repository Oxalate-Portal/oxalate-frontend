import { CKEditor } from "@ckeditor/ckeditor5-react";
import "./ckeditor_dark_theme.css";
import ClassicEditor from "@ckeditor/ckeditor5-build-classic";

interface PageBodyEditorProps {
    value: string;
    onChange: (data: string) => void;
}

export function PageBodyEditor({value, onChange}: PageBodyEditorProps): JSX.Element {
    function contentUpdated(event: any, editor: any) {
        const data = editor.getData();
        onChange(data);
    }

    /*
    * TODO Once we start working on the file upload, we should begin by properly configuring the CKEditor to use additional plugins.
    *  See here for more information: https://ckeditor.com/docs/ckeditor5/latest/installation/plugins/installing-plugins.html
    */

    return (
            <CKEditor
                    editor={ClassicEditor}
                    onChange={contentUpdated}
                    config={{
                        removePlugins: ["CKFinderUploadAdapter", "CKFinder", "EasyImage", "Image", "ImageCaption", "ImageStyle", "ImageToolbar", "ImageUpload", "MediaEmbed"],
                        toolbar: {
                            removeItems: ["uploadImage", "mediaEmbed"],
                            shouldNotGroupWhenFull: true
                        }
                    }}
                    data={value}
            />
    );
}
