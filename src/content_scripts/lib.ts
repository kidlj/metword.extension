import { browser } from 'webextension-polyfill-ts';
import { Meets } from '../background_scripts/index'

export interface WordRange {
	name: string
	times: number,
	range: Range,
}

interface WordIndex {
	word: string,
	start: number
	end: number
}

const skipTags = new Map<string, boolean>([
	["HEAD", true],
	["SCRIPT", true],
	["STYLE", true],
	["PRE", true],
	["CODE", true],
	["SAMP", true],
	["TEXTAREA", true],
	["IMG", true],
	["SVG", true],
	["CANVAS", true],
	["VIDEO", true],
	["AUDIO", true],
	["FORM", true],
	["INPUT", true],
	["SELECT", true],
	["BUTTON", true],
	["A", true],
	["MARK", true],
	["INS", true],
	["DEL", true],
	["SUP", true],
	["SUB", true],
	["SMALL", true],
	["BIG", true],
	["CITE", true],
	["FIELDSET", true],
	["LEGEND", true],
	["CAPTION", true],
	["LABEL", true],
	["OBJECT", true],
	["VAR", true],
	["KBD", true],
	["SUMMARY", true],
])

export function getWordRanges(n: Node, s: Array<WordRange>): Array<WordRange> {
	if (n.nodeType == Node.ELEMENT_NODE && skipTags.get(n.nodeName) == true) {
		return s
	}

	if (n.nodeType == Node.TEXT_NODE) {
		let wordIndexes = getWordIndexes(n.nodeValue!)
		wordIndexes.forEach((v: WordIndex) => {
			let range = document.createRange()
			range.setStart(n, v.start)
			range.setEnd(n, v.end)

			s.push({
				name: v.word,
				times: 0,
				range: range
			})
		})
	}

	for (let c = n.firstChild; c != null; c = c.nextSibling) {
		s = getWordRanges(c, s)
	}

	return s
}

export function getWordIndexes(s: string): Array<WordIndex> {
	const indexes = new Array<WordIndex>()
	let inWord = false
	let start = 0
	let end = start
	for (let i = 0; i < s.length; i++) {
		let c = s[i]
		if (isWordCharacter(c) && inWord == false && (i == 0 || isWordDelimiter(s[i - 1]))) {
			inWord = true
			start = i
		}

		if (isWordDelimiter(c) && inWord == true) {
			inWord = false
			end = i
		}

		if (isWordCharacter(c) && i == s.length - 1 && inWord == true) {
			inWord = false
			end = s.length
		}

		if (!isWordCharacter(c)) {
			inWord = false
		}

		// at least 2 characters long
		if (end - start >= 2) {
			let word = s.slice(start, end).toLowerCase()
			let wordIndex = {
				word: word,
				start: start,
				end: end
			}
			indexes.push(wordIndex)

			// reset end
			end = start
		}

	}
	return indexes
}

export async function markWords() {
	const meets: Meets = await browser.runtime.sendMessage({
		action: "getMeets"
	})

	// reset old marks
	const marks = document.getElementsByTagName("xmetword")
	for (const mark of marks) {
		mark.setAttribute("data-times", "")
	}

	let ranges = new Array<WordRange>()
	ranges = getWordRanges(document.getRootNode(), ranges)
	ranges.forEach((r, i) => {
		if (meets[r.name] > 0) {
			r.times = meets[r.name]
			markWord(r)
		} else {
			delete ranges[i]
		}
	})
}

export function markWord(range: WordRange) {
	const color = "red"
	// test if range already wrapped in <xmetword>
	let ele = range.range.commonAncestorContainer.parentNode as HTMLElement
	if (ele.nodeName != "XMETWORD") {
		ele = document.createElement("xmetword")
		range.range.surroundContents(ele)
	}
	ele.style.setProperty("--met-color", color)
	ele.setAttribute("data-times", "-".repeat(range.times))
}

function isWordCharacter(s: string): boolean {
	let re = /^[a-zA-Z]$/
	return re.test(s)
}

function isWordDelimiter(s: string): boolean {
	let re = /^[\s.,!?;:'")(\]\[]$/
	return re.test(s)
}

const delimiter = /^[.!?。！？]$/
const close = /^[\s"'’”]$/
const chineseClose = /^[。！？]$/
const space = /^[\s]$/

// This is a 'good enough' algorithm that gets the sentence a 'selection' resides in.
// It only relies on sentence delimiters, so in some cases periods like in 'Mellon C. Collie' produce wrong sentence.
// This is a known bug and results are acceptable to me. To keep code simple, I choose not to fix it.
export function getSceneSentence(range: Range): string {
	let selectedText = ""
	if (range.startContainer == range.endContainer) {
		selectedText = range.startContainer.nodeValue!.slice(range.startOffset, range.endOffset)
	} else {
		selectedText = range.startContainer.nodeValue!.slice(range.startOffset) + range.endContainer.nodeValue!.slice(0, range.endOffset)
	}
	const word = paddingLeft + selectedText + paddingRight
	const parent = getEnclosingNode(range.startContainer)
	const text = getText(parent, "", range)
	let start = 0
	let end = text.length
	let found = false
	for (let i = 0; i < text.length; i++) {
		if (delimiter.test(text[i]) && found == false && (close.test(text[i + 1]) || chineseClose.test(text[i]))) {
			start = i + 1
		}
		for (let j = 0; j < word.length; j++) {
			if (text[i + j] != word[j]) {
				break
			}
			if (j == word.length - 1) {
				found = true
				i = i + j
			}
		}
		if (found == true && delimiter.test(text[i]) && (close.test(text[i + 1]) || chineseClose.test(text[i]))) {
			end = i + 1
			break
		}
	}

	return text.slice(start, end).trim()
}

const dropped = new Map<string, boolean>([
	["SCRIPT", true],
	["STYLE", true],
	["PRE", true],
	["SUP", true],
	["SUB", true],
])

const paddingSpace = new Map<string, boolean>([
	["BR", true],
])

// All block level elements, via
// https://developer.mozilla.org/en-US/docs/Web/HTML/Block-level_elements
function isBlockElement(n: Node): boolean {
	const elements = new Map<string, boolean>([
		["ADDRESS", true],
		["ARTICLE", true],
		["ASIDE", true],
		["BLOCKQUOTE", true],
		["DETAILS", true],
		["DIALOG", true],
		["DD", true],
		["DIV", true],
		["DL", true],
		["DT", true],
		["FIELDSET", true],
		["FIGCAPTION", true],
		["FIGURE", true],
		["FOOTER", true],
		["H1", true],
		["H2", true],
		["H3", true],
		["H4", true],
		["H5", true],
		["H6", true],
		["FORM", true],
		["HEADER", true],
		["HGROUP", true],
		// ["HR", true],
		["LI", true],
		["MAIN", true],
		["NAV", true],
		["OL", true],
		["P", true],
		["PRE", true],
		["SECTION", true],
		["TABLE", true],
		["UL", true],

	])
	return elements.get(n.nodeName) == true
}

function getEnclosingNode(n: Node): Node {
	for (n = n.parentNode!; !isBlockElement(n); n = n.parentNode!) {
		for (let c = n.firstChild; c != null; c = c.nextSibling) {
			if (c.nodeType == Node.TEXT_NODE && c.nodeValue!.match(`[,.!;?，。！；？]`)) {
				return n
			}
		}
	}
	return n
}

// for highlighting and exact matching
const paddingLeft = "<xmet>"
const paddingRight = "</xmet>"

function getText(n: Node, text: string, range: Range): string {
	// asserted: range.startContainer and range.endContainer are text nodes and are same node or siblings. 
	if (n == range.startContainer) {
		if (range.startContainer == range.endContainer) {
			const prefix = range.startContainer.nodeValue!.slice(0, range.startOffset)
			const selected = range.startContainer.nodeValue!.slice(range.startOffset, range.endOffset)
			const postfix = range.startContainer.nodeValue!.slice(range.endOffset)
			return text + prefix + paddingLeft + selected + paddingRight + postfix
		} else {
			const prefix = range.startContainer.nodeValue!.slice(0, range.startOffset)
			const selected = range.startContainer.nodeValue!.slice(range.startOffset)
			return text + prefix + paddingLeft + selected
		}
	}

	if (n == range.endContainer) {
		// n must not equal range.startContainer
		const selected = range.endContainer.nodeValue!.slice(0, range.endOffset)
		const postfix = range.endContainer.nodeValue!.slice(range.endOffset)
		return text + selected + paddingRight + postfix
	}

	if (n.nodeType == Node.TEXT_NODE) {
		return text + n.nodeValue
	}

	if (n.nodeType == Node.ELEMENT_NODE && dropped.get(n.nodeName) == true) {
		return text
	}

	for (let c = n.firstChild; c != null; c = c.nextSibling) {
		text = getText(c, text, range)
	}

	// post decorations
	if (n.nodeType == Node.ELEMENT_NODE && paddingSpace.get(n.nodeName) == true) {
		if (!space.test(text.slice(-1)))
			return text + " "
	}

	return text
}

export function getWord(selectedText: string): string {
	const re = /^([a-zA-Z]?[a-z]+|[A-Z]+)$/
	if (selectedText.match(re)) {
		return selectedText.toLowerCase()
	}
	return ""
}