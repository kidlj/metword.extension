export interface WordRange {
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
	["H1", true],
	["H2", true],
	["H3", true],
	["H4", true],
	["H5", true],
	["H6", true],
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
	["DETAILS", true],
	["SUMMARY", true],
])

export function getWordRanges(n: Node, m: Map<string, WordRange>): Map<string, WordRange> {
	if (n.nodeType == Node.ELEMENT_NODE && skipTags.get(n.nodeName) == true) {
		return m
	}

	if (n.nodeType == Node.TEXT_NODE) {
		let wordIndexes = getWordIndexes(n.nodeValue!)
		wordIndexes.forEach((v: WordIndex) => {
			if (m.get(v.word) == undefined) {
				let range = document.createRange()
				range.setStart(n, v.start)
				range.setEnd(n, v.end)

				m.set(v.word, {
					times: 0,
					range: range
				})
			}
		})
	}

	for (let c = n.firstChild; c != null; c = c.nextSibling) {
		m = getWordRanges(c, m)
	}

	return m
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

const selectedID = "metword-selected"

export function markWord(range: WordRange, selected: boolean) {
	let ele = document.createElement("xmetword")
	if (selected) {
		ele.setAttribute("id", selectedID)
	}
	const color = "red"
	// To surround range contents with the mark element.
	// The surroundContent() may fail when a range spreads across Node element boundries:
	// range.range.surroundContents(ele)
	// See: https://developer.mozilla.org/en-US/docs/Web/API/Range/surroundContents
	// Use the extractContent() + insertNode() equivalent instead:
	ele.appendChild(range.range.extractContents())
	range.range.insertNode(ele)
	ele.style.setProperty("--met-color", color)
	ele.setAttribute("data-times", "-".repeat(range.times))
}

export function markSelected(range: Range, selectedText: string) {
	const parent = range.startContainer.parentNode!
	if (isMarkedNode(parent, selectedText)) {
		(parent as HTMLElement).setAttribute("id", selectedID)
		return
	}

	markWord({ range: range, times: 0 }, true)
}

function isMarkedNode(n: Node, selectedText: string): boolean {
	return (n.nodeType == Node.ELEMENT_NODE && n.nodeName == "XMETWORD" &&
		getText(n, "") == selectedText)
}

export function getSelectedElement(): HTMLElement | null {
	return document.getElementById(selectedID)
}

function isWordCharacter(s: string): boolean {
	let re = /^[a-zA-Z]$/
	return re.test(s)
}

function isWordDelimiter(s: string): boolean {
	let re = /^[\s.,!?;:'")(\]\[]$/
	return re.test(s)
}

// This is a 'good enough' algorithm that gets the sentence a 'selection' resides in.
// It only relies on sentence delimiters, so in some cases periods like in 'Mellon C. Collie' produce wrong sentence.
// This is a known bug and results are acceptable to me. To keep code simple, I choose not to fix it.
export function getSceneSentence(parent: Node, selectText: string): string {
	console.log("selectText is:", selectText)
	const word = paddingLeft + selectText + paddingRight
	const text = getText(parent, "")
	console.log("text is:", text)
	let start = 0
	let end = text.length
	let found = false
	const delimiter = /^[.!?。！？]$/
	const close = /^[\s"')A-Z]$/
	const chineseDelimeter = /^[。！？]$/
	for (let i = 0; i < text.length; i++) {
		if (delimiter.test(text[i]) && found == false && (close.test(text[i + 1]) || chineseDelimeter.test(text[i]))) {
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
		if (found == true && delimiter.test(text[i]) && (close.test(text[i + 1]) || chineseDelimeter.test(text[i]))) {
			end = i + 1
			break
		}
	}

	return text.slice(start, end).trim()
}

const dropped = new Map<string, boolean>([
	["SUP", true],
	["SUB", true],
])

const paddingDelimeter = new Map<string, boolean>([
	["H1", true],
	["H2", true],
	["H3", true],
	["H4", true],
	["H5", true],
	["H6", true],
	["LI", true],
])

// for highlighting and exact matching
const paddingLeft = "<xmet>"
const paddingRight = "</xmet>"

function getText(n: Node, text: string): string {
	// selection marked element
	if (n == getSelectedElement()) {
		// marked element may have an ElementNode child, like <em>selectedText</em>.
		var selectText = ""
		for (let c = n.firstChild; c != null; c = c.nextSibling) {
			selectText = getText(c, selectText)
		}
		return text + paddingLeft + selectText + paddingRight
	}

	if (n.nodeType == Node.TEXT_NODE) {
		return text + n.nodeValue
	}

	if (n.nodeType == Node.ELEMENT_NODE && dropped.get(n.nodeName) == true) {
		return text
	}

	for (let c = n.firstChild; c != null; c = c.nextSibling) {
		text = getText(c, text)
	}

	if (n.nodeType == Node.ELEMENT_NODE && paddingDelimeter.get(n.nodeName) == true) {
		return text + ". "
	}

	return text
}

export function getWord(selectedText: string): string {
	const re = /^[a-zA-Z]+$/
	// Safari needs to trim() selected text to drop the trailing space.
	if (selectedText.trim().match(re)) {
		return selectedText.toLowerCase()
	}
	return ""
}