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

export function markWord(range: WordRange) {
    let span = document.createElement("span")
    span.classList.add("metword")
    span.setAttribute("times", range.times.toString())
    span.style.textDecorationLine = "underline"
    span.style.textDecorationColor = "red"
    span.style.textDecorationStyle = "solid"
    span.style.textUnderlinePosition = "under"
    range.range.surroundContents(span)
}


function isWordCharacter(s: string): boolean {
    let re = /^[a-zA-Z]$/
    return re.test(s)
}

function isWordDelimiter(s: string): boolean {
    let re = /^[\s.,!?;:'")(\]\[]$/
    return re.test(s)
}

// NOTE: This is a "good enough" algorithm, with some cases that may fail.
export function getSceneSentence(range: Range, word: string): string {
    let parent = range.commonAncestorContainer
    if (range.startContainer == range.endContainer) {
        parent = range.startContainer.parentNode!
    }
    let result = {
        text: "",
        start: false
    }
    result = getText(parent, range, result)
    const text = result.text
    let start = 0
    let end = text.length
    let found = false
    const delimiter = /^[.!?。！？]$/
    const close = /^[\s"')]$/
    const chineseDelimeter = /^[。！？]$/
    for (let i = 0; i < text.length; i++) {
        if (delimiter.test(text[i]) && found == false && (close.test(text[i + 1]) || chineseDelimeter.test(text[i]))) {
            start = i
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
    if (start == 0) {
        return text.slice(start, end).trim()
    }
    return text.slice(start + 1, end).trim()
}

const paddings = new Map<string, boolean>([
    ["SUP", true],
    ["BR", true]
])

type result = {
    text: string
    start: boolean
}

function getText(n: Node, range: Range, r: result): result {
    // Some articles use <br> to divide paragraphs.
    if (n.nodeType == Node.ELEMENT_NODE && n.nodeName == "BR" && r.start == false) {
        return {
            text: "",
            start: r.start
        }
    }

    if (n.nodeType == Node.ELEMENT_NODE && paddings.get(n.nodeName) == true) {
        return {
            text: r.text + " ",
            start: r.start
        }
    }

    if (n == range.startContainer) {
        r.start = true
    }

    if (n.nodeType == Node.TEXT_NODE) {
        r.text = r.text + n.nodeValue
    }

    for (let c = n.firstChild; c != null; c = c.nextSibling) {
        r = getText(c, range, r)
    }

    return r
}