export interface WordRange {
	node: Node,
	times: number,
	range: Range,
}

interface WordIndex {
	word: string,
	start: number
	end: number
}

const skips = new Map<string, boolean>([
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
])

export function getWordRanges(n: Node, m: Map<string, WordRange>): Map<string, WordRange> {
	// ELEMENT_NODE
	if (n.nodeType == 1 && skips.get(n.nodeName) == true) {
		return m
	}

	// TEXT_NODE
	if (n.nodeType == 3) {
		let wordIndexes = getWordIndexes(n.nodeValue!)
		wordIndexes.forEach((v: WordIndex) => {
			if (m.get(v.word) == undefined) {
				let range = document.createRange()
				range.setStart(n, v.start)
				range.setEnd(n, v.end)

				m.set(v.word, {
					node: n,
					times: 0,
					range: range
				})
			}
		})
	}

	for (let c = n.firstChild; c != null; c = c!.nextSibling) {
		m = getWordRanges(c, m)
	}

	return m
}

export function getWordIndexes(s: string): Array<WordIndex> {
	const indexes = new Array<WordIndex>()
	let inWord = false
	let start = 0
	let end = s.length
	for (let i = 0; i < s.length; i++) {
		let c = s[i]
		if (isWordCharacter(c) && inWord == false && (i == 0 || isSpaceCharacter(s[i - 1]))) {
			inWord = true
			start = i
		}
		if (isWordDelimiter(c) && inWord == true) {
			inWord = false
			end = i
			let word = s.slice(start, end).toLowerCase()
			let wordIndex = {
				word: word,
				start: start,
				end: end
			}
			indexes.push(wordIndex)
		}

		if (i == s.length - 1 && inWord == true) {
			inWord = false
			end = s.length
			let word = s.slice(start, end).toLowerCase()
			let wordIndex = {
				word: word,
				start: start,
				end: end
			}
			indexes.push(wordIndex)
		}
		if (!isWordCharacter(c)) {
			inWord = false
		}

	}
	return indexes
}

function isWordCharacter(s: string): boolean {
	let re = /^[a-zA-Z]$/
	return re.test(s)
}

function isSpaceCharacter(s: string): boolean {
	let re = /^\s$/
	return re.test(s)
}

function isWordDelimiter(s: string): boolean {
	let re = /^[\s\.,!?;:]$/
	return re.test(s)
}