import { getWordIndexes, getWordRanges, WordRange } from './lib'

const queryURL = "http://127.0.0.1:8080/word?word="

async function start() {
    console.log("Metwords worker started")
    let url = "http://127.0.0.1:8080/word/mets"

    try {
        const res = await fetch(url)
        if (res.status != 200) {
            return
        }
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

    const markWrap = document.createElement("div")
    markWrap.setAttribute("id", "metwords-tip")
    const bodyCollection = document.getElementsByTagName("body")
    if (bodyCollection.length != 1) {
        return
    }
    const body = bodyCollection[0]
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
        if (resp.status != 200) {
            return
        }
        const parser = new DOMParser()
        const doc = parser.parseFromString(await resp.text(), "text/html")
        const node = doc.getElementById("words")!

        const target = range.getBoundingClientRect()

        const tip = document.getElementById("metwords-tip")!
        tip.innerHTML = node.innerHTML
        tip.style.display = "block"

        var top = target.y + window.scrollY + target.height + 5
        if (target.y + tip.clientHeight > window.innerHeight) {
            top = top - tip.clientHeight - target.height - 10
        }
        tip.style.top = top + "px"

        var left = target.x
        if (left + tip.clientWidth > window.innerWidth) {
            left = left - tip.clientWidth
        }
        tip.style.left = left + "px"
    }
}

const listenMouseDown = (e: MouseEvent) => {
    const markWrap = document.getElementById("metwords-tip")!
    markWrap.style.display = "none"
}