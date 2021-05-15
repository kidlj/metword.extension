import { getWordIndexes, getWordRanges, WordRange } from './lib'

const queryURL = "http://127.0.0.1:8080/word?word="

async function start() {
    console.log("Metwords worker started")
    let url = "http://127.0.0.1:8080/word/mets"

    try {
        const res = await fetch(url)
        const result = JSON.parse(await res.text())
        console.log("success:", result.success)
        const mets = result.mets
        let ranges = new Map<string, WordRange>()
        ranges = getWordRanges(document.getRootNode(), ranges)
        ranges.forEach((val, key) => {
            console.log(key)
            if (mets[key] == undefined) {
                ranges.delete(key)
            } else {
                val.times = mets[key]
            }
        })
        console.log(ranges)
        for (let range of ranges.values()) {
            markWord(range)
        }
    } catch (err) {
        console.trace("errored", err)
    }

    document.addEventListener('mouseup', listenMouseup)
    document.addEventListener('mousedown', listenMouseDown)

    const markWrap = document.createElement("markword")
    markWrap.setAttribute("id", "wordmark-popup")
    const bodyCollection = document.getElementsByTagName("body")
    if (bodyCollection.length != 1) {
        return
    }
    const body = bodyCollection[0]
    body.style.position = "relative"
    body.style.height = "100%"
    body.appendChild(markWrap)
}

start()

document.onload = function (e: Event) {
    start()
}

function markWord(range: WordRange) {
    let span = document.createElement("span")
    span.classList.add("metword")
    span.setAttribute("times", range.times.toString())
    span.style.textDecorationLine = "underline"
    span.style.textDecorationColor = "red"
    span.style.textDecorationStyle = "solid"
    span.style.textUnderlinePosition = "under"
    range.range.surroundContents(span)
}

const listenMouseup = async (e: MouseEvent) => {
    const selection = window.getSelection()
    if (selection == null) return

    if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        if (range.collapsed) {
            return
        }
        let selectText = selection.toString().trim();
        const words = getWordIndexes(selectText)
        if (words.length != 1) {
            return
        }
        const query = queryURL + words[0].word
        const resp = await fetch(query)
        const parser = new DOMParser()
        const doc = parser.parseFromString(await resp.text(), "text/html")
        const node = doc.getElementById("words")!

        const target = range.getBoundingClientRect()

        const markWrap = document.getElementById("wordmark-popup")!
        markWrap.innerHTML = node.innerHTML
        markWrap.style.display = "block"

        var top = target.y + window.scrollY + target.height + 5
        if (target.y + markWrap.clientHeight > window.innerHeight) {
            top = top - markWrap.clientHeight - target.height - 10
        }
        markWrap.style.top = top + "px"

        var left = target.x
        if (left + markWrap.clientWidth > window.innerWidth) {
            left = left - markWrap.clientWidth
        }
        markWrap.style.left = left + "px"
    }
}

const listenMouseDown = (e: MouseEvent) => {
    const markWrap = document.getElementById("wordmark-popup")!
    markWrap.style.display = "none"
}