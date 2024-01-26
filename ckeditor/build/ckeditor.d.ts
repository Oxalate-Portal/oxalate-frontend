/**
 * @license Copyright (c) 2014-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
import { ClassicEditor } from "@ckeditor/ckeditor5-editor-classic";
import { CKFinderUploadAdapter } from "@ckeditor/ckeditor5-adapter-ckfinder";
import { Alignment } from "@ckeditor/ckeditor5-alignment";
import { Autoformat } from "@ckeditor/ckeditor5-autoformat";
import { BlockQuote } from "@ckeditor/ckeditor5-block-quote";
import { CodeBlock } from "@ckeditor/ckeditor5-code-block";
import type { EditorConfig } from "@ckeditor/ckeditor5-core";
import { Essentials } from "@ckeditor/ckeditor5-essentials";
import { FindAndReplace } from "@ckeditor/ckeditor5-find-and-replace";
import { FontBackgroundColor, FontColor, FontFamily, FontSize } from "@ckeditor/ckeditor5-font";
import { Heading } from "@ckeditor/ckeditor5-heading";
import { HorizontalLine } from "@ckeditor/ckeditor5-horizontal-line";
import { GeneralHtmlSupport } from "@ckeditor/ckeditor5-html-support";
import { Image } from "@ckeditor/ckeditor5-image";
import { Indent } from "@ckeditor/ckeditor5-indent";
import { Link } from "@ckeditor/ckeditor5-link";
import { MediaEmbed } from "@ckeditor/ckeditor5-media-embed";
import { PageBreak } from "@ckeditor/ckeditor5-page-break";
import { Paragraph } from "@ckeditor/ckeditor5-paragraph";
import { PasteFromOffice } from "@ckeditor/ckeditor5-paste-from-office";
import { RemoveFormat } from "@ckeditor/ckeditor5-remove-format";
import { SelectAll } from "@ckeditor/ckeditor5-select-all";
import { ShowBlocks } from "@ckeditor/ckeditor5-show-blocks";
import { SourceEditing } from "@ckeditor/ckeditor5-source-editing";
import { SpecialCharacters, SpecialCharactersEssentials } from "@ckeditor/ckeditor5-special-characters";
import { Style } from "@ckeditor/ckeditor5-style";
import { Table } from "@ckeditor/ckeditor5-table";
import { Undo } from "@ckeditor/ckeditor5-undo";
import { WordCount } from "@ckeditor/ckeditor5-word-count";

declare class Editor extends ClassicEditor {
    static builtinPlugins: (typeof Alignment | typeof Autoformat | typeof BlockQuote | typeof CKFinderUploadAdapter | typeof CodeBlock | typeof Essentials | typeof FindAndReplace | typeof FontBackgroundColor | typeof FontColor | typeof FontFamily | typeof FontSize | typeof GeneralHtmlSupport | typeof Heading | typeof HorizontalLine | typeof Image | typeof Indent | typeof Link | typeof MediaEmbed | typeof PageBreak | typeof Paragraph | typeof PasteFromOffice | typeof RemoveFormat | typeof SelectAll | typeof ShowBlocks | typeof SourceEditing | typeof SpecialCharacters | typeof SpecialCharactersEssentials | typeof Style | typeof Table | typeof Undo | typeof WordCount)[];
    static defaultConfig: EditorConfig;
}
export default Editor;
