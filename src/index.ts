import { getWordIndexes, getWordRanges, WordRange } from './lib'

const metsURL = "http://127.0.0.1:8080/word/mets"
const queryURL = "http://127.0.0.1:8080/word?word="
const meetURL = "http://127.0.0.1:8080/word/meet"

async function start() {
    console.log("Metwords worker started")

    try {
        const res = await fetch(metsURL)
        if (res.status != 200) {
            return
        }
        const result = JSON.parse(await res.text())
        const mets = result.mets
        let ranges = new Map<string, WordRange>()
        ranges = getWordRanges(document.getRootNode(), ranges)
        ranges.forEach((val, key) => {
            if (mets[key] == undefined) {
                ranges.delete(key)
            } else {
                val.times = mets[key]
            }
        })
        for (let range of ranges.values()) {
            markWord(range)
        }
    } catch (err) {
        console.log("Metwords extension: get words error", err)
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
    const tip = document.getElementById("metwords-tip")!
    if ((<Node>tip).contains(<Node>e.target)) {
        return
    }
    const selection = window.getSelection()
    if (selection == null) return

    if (selection.rangeCount == 0) return
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
    const html = await resp.text()

    console.log("start:", range.startContainer)
    console.log("end:", range.endContainer)
    if (range.startContainer.nodeType != Node.TEXT_NODE) {
        return
    }

    tip.innerHTML = html
    tip.style.display = "block"

    const target = range.getBoundingClientRect()
    var top = target.y + window.scrollY + target.height + 5
    if (target.y + tip.clientHeight > window.innerHeight) {
        const shouldTop = top - tip.clientHeight - target.height - 10
        if (shouldTop > 0) {
            top = shouldTop
        }
    }
    tip.style.top = top + "px"

    var left = target.x
    if (left + tip.clientWidth > window.innerWidth) {
        left = left - tip.clientWidth
    }
    tip.style.left = left + "px"

    const button = tip.getElementsByTagName("button")[0]
    button.onclick = async (e: Event) => {
        const id = button.getAttribute("value")!
        const text = range.startContainer.nodeValue!
        const url = window.location.href

        const form = new FormData()
        form.append("id", id)
        form.append("url", url)
        form.append("text", text)

        try {
            const meetResult = await fetch(meetURL, {
                method: "POST",
                body: form
            })
            if (meetResult.status != 200) {
                console.log("meet word return:", status)
                return
            }
            button.setAttribute("disabled", "true")
        } catch (err) {
            console.log("meet word failed", err)
        }
    }
}

const listenMouseDown = (e: MouseEvent) => {
    const tip = document.getElementById("metwords-tip")!
    if ((<Node>tip).contains(<Node>e.target)) {
        return
    }
    tip.style.display = "none"
}