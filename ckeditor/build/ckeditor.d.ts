/**
 * @license Copyright (c) 2014-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
import {ClassicEditor} from '@ckeditor/ckeditor5-editor-classic';
import {UploadAdapter} from '@ckeditor/ckeditor5-adapter-ckfinder';
import {Alignment} from '@ckeditor/ckeditor5-alignment';
import {Autoformat} from '@ckeditor/ckeditor5-autoformat';
import {Bold, Code, Italic, Strikethrough, Subscript, Superscript, Underline} from '@ckeditor/ckeditor5-basic-styles';
import {BlockQuote} from '@ckeditor/ckeditor5-block-quote';
import {CodeBlock} from '@ckeditor/ckeditor5-code-block';
import type {EditorConfig} from '@ckeditor/ckeditor5-core';
import {Essentials} from '@ckeditor/ckeditor5-essentials';
import {FindAndReplace} from '@ckeditor/ckeditor5-find-and-replace';
import {FontBackgroundColor, FontColor, FontFamily, FontSize} from '@ckeditor/ckeditor5-font';
import {Heading} from '@ckeditor/ckeditor5-heading';
import {HorizontalLine} from '@ckeditor/ckeditor5-horizontal-line';
import {GeneralHtmlSupport} from '@ckeditor/ckeditor5-html-support';
import {Image, ImageCaption, ImageInsert, ImageResize, ImageStyle, ImageToolbar, ImageUpload} from '@ckeditor/ckeditor5-image';
import {Indent, IndentBlock} from '@ckeditor/ckeditor5-indent';
import {AutoLink, Link, LinkImage} from '@ckeditor/ckeditor5-link';
import {DocumentList, DocumentListProperties} from '@ckeditor/ckeditor5-list';
import {MediaEmbed, MediaEmbedToolbar} from '@ckeditor/ckeditor5-media-embed';
import {PageBreak} from '@ckeditor/ckeditor5-page-break';
import {Paragraph} from '@ckeditor/ckeditor5-paragraph';
import {PasteFromOffice} from '@ckeditor/ckeditor5-paste-from-office';
import {RemoveFormat} from '@ckeditor/ckeditor5-remove-format';
import {SelectAll} from '@ckeditor/ckeditor5-select-all';
import {ShowBlocks} from '@ckeditor/ckeditor5-show-blocks';
import {SourceEditing} from '@ckeditor/ckeditor5-source-editing';
import {SpecialCharacters, SpecialCharactersEssentials} from '@ckeditor/ckeditor5-special-characters';
import {Style} from '@ckeditor/ckeditor5-style';
import {Table, TableCaption, TableCellProperties, TableColumnResize, TableProperties, TableToolbar} from '@ckeditor/ckeditor5-table';
import {TextTransformation} from '@ckeditor/ckeditor5-typing';
import {Undo} from '@ckeditor/ckeditor5-undo';
import {WordCount} from '@ckeditor/ckeditor5-word-count';

declare class Editor extends ClassicEditor {
    static builtinPlugins: (typeof Alignment | typeof AutoLink | typeof Autoformat | typeof BlockQuote | typeof Bold | typeof Code | typeof CodeBlock | typeof DocumentList | typeof DocumentListProperties | typeof Essentials | typeof FindAndReplace | typeof FontBackgroundColor | typeof FontColor | typeof FontFamily | typeof FontSize | typeof GeneralHtmlSupport | typeof Heading | typeof HorizontalLine | typeof Image | typeof ImageCaption | typeof ImageInsert | typeof ImageResize | typeof ImageStyle | typeof ImageToolbar | typeof ImageUpload | typeof Indent | typeof IndentBlock | typeof Italic | typeof Link | typeof LinkImage | typeof MediaEmbed | typeof MediaEmbedToolbar | typeof PageBreak | typeof Paragraph | typeof PasteFromOffice | typeof RemoveFormat | typeof SelectAll | typeof ShowBlocks | typeof SourceEditing | typeof SpecialCharacters | typeof SpecialCharactersEssentials | typeof Strikethrough | typeof Style | typeof Subscript | typeof Superscript | typeof Table | typeof TableCaption | typeof TableCellProperties | typeof TableColumnResize | typeof TableProperties | typeof TableToolbar | typeof TextTransformation | typeof Underline | typeof Undo | typeof UploadAdapter | typeof WordCount)[];
    static defaultConfig: EditorConfig;
}
export default Editor;
