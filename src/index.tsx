import React from 'react';
import ReactDOM from 'react-dom';
import './style.css';
import Tip from './Tip';
import { getWordIndexes, getWordRanges, WordRange } from './lib'

const metsURL = "http://127.0.0.1:8080/word/mets"

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

    const tipWrap = document.createElement("div")
    tipWrap.setAttribute("id", "metwords-tip")
    const bodyCollection = document.getElementsByTagName("body")
    if (bodyCollection.length != 1) {
        return
    }
    const body = bodyCollection[0]
    body.appendChild(tipWrap)
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
    if ((tip as Node).contains(e.target as Node)) {
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
    const word = words[0].word

    console.log("start:", range.startContainer)
    console.log("end:", range.endContainer)
    if (range.startContainer.nodeType != Node.TEXT_NODE) {
        return
    }

    // display tip
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

    ReactDOM.render(
        <React.StrictMode>
            <Tip word={word} selectText={selectText} range={range} />
        </React.StrictMode>,
        tip
    )
}

const listenMouseDown = (e: MouseEvent) => {
    const tip = document.getElementById("metwords-tip")!
    if ((tip as Node).contains(e.target as Node)) {
        return
    }
    ReactDOM.unmountComponentAtNode(tip)
    tip.style.display = "none"
}