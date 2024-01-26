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

// You can read more about extending the build with additional plugins in the "Installing plugins" guide.
// See https://ckeditor.com/docs/ckeditor5/latest/installation/plugins/installing-plugins.html for details.

class Editor extends ClassicEditor {
	public static override builtinPlugins = [
		Alignment,
		Autoformat,
		BlockQuote,
		CKFinderUploadAdapter,
		CodeBlock,
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
		Indent,
		Link,
		MediaEmbed,
		PageBreak,
		Paragraph,
		PasteFromOffice,
		RemoveFormat,
		SelectAll,
		ShowBlocks,
		SourceEditing,
		SpecialCharacters,
		SpecialCharactersEssentials,
		Style,
		Table,
		Undo,
		WordCount
	];

	public static override defaultConfig: EditorConfig = {
		toolbar: {
			items: [
				'heading',
				'style',
				'|',
				'link',
				'|',
				'outdent',
				'indent',
				'alignment',
				'fontFamily',
				'fontSize',
				'fontColor',
				'fontBackgroundColor',
				'|',
				'horizontalLine',
				'blockQuote',
				'removeFormat',
				'insertTable',
				'codeBlock',
				'specialCharacters',
				'mediaEmbed',
				'undo',
				'redo',
				'findAndReplace',
				'selectAll',
				'showBlocks',
				'sourceEditing'
			]
		},
		language: 'en'
	};
}

export default Editor;
