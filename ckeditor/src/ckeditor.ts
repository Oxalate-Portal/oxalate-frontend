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

// You can read more about extending the build with additional plugins in the "Installing plugins" guide.
// See https://ckeditor.com/docs/ckeditor5/latest/installation/plugins/installing-plugins.html for details.

class Editor extends ClassicEditor {
	public static override builtinPlugins = [
		Alignment,
		AutoLink,
		Autoformat,
		BlockQuote,
		Bold,
		Code,
		CodeBlock,
		DocumentList,
		DocumentListProperties,
		Essentials,
		FindAndReplace,
		FontBackgroundColor,
		FontColor,
		FontFamily,
		FontSize,
		GeneralHtmlSupport,
		Heading,
		HorizontalLine,
		Image,
		ImageCaption,
		ImageInsert,
		ImageResize,
		ImageStyle,
		ImageToolbar,
		ImageUpload,
		Indent,
		IndentBlock,
		Italic,
		Link,
		LinkImage,
		MediaEmbed,
		MediaEmbedToolbar,
		PageBreak,
		Paragraph,
		PasteFromOffice,
		RemoveFormat,
		SelectAll,
		ShowBlocks,
		SourceEditing,
		SpecialCharacters,
		SpecialCharactersEssentials,
		Strikethrough,
		Style,
		Subscript,
		Superscript,
		Table,
		TableCaption,
		TableCellProperties,
		TableColumnResize,
		TableProperties,
		TableToolbar,
		TextTransformation,
		Underline,
		Undo,
		UploadAdapter,
		WordCount
	];

	public static override defaultConfig: EditorConfig = {
		toolbar: {
			items: [
				'heading',
				'style',
				'|',
				'bold',
				'italic',
				'strikethrough',
				'link',
				'underline',
				'bulletedList',
				'numberedList',
				'|',
				'fontBackgroundColor',
				'fontColor',
				'fontFamily',
				'fontSize',
				'|',
				'outdent',
				'indent',
				'|',
				'findAndReplace',
				'imageUpload',
				'imageInsert',
				'blockQuote',
				'insertTable',
				'mediaEmbed',
				'horizontalLine',
				'undo',
				'redo',
				'removeFormat',
				'selectAll',
				'sourceEditing'
			]
		},
		language: 'fi',
		image: {
			toolbar: [
				'imageTextAlternative',
				'toggleImageCaption',
				'imageStyle:inline',
				'imageStyle:block',
				'imageStyle:side',
				'linkImage'
			]
		},
		table: {
			contentToolbar: [
				'tableColumn',
				'tableRow',
				'mergeTableCells',
				'tableCellProperties',
				'tableProperties'
			]
		}
	};
}

export default Editor;
