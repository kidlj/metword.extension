import React from 'react';
import ReactDOM from 'react-dom';
import './style.css';
import Tip from './Tip';
import { getWordIndexes, getWordRanges, WordRange, markWord } from './lib'
import { browser } from 'webextension-polyfill-ts';

async function getMets() {
	const mets = await browser.runtime.sendMessage({
		action: "getMets"
	})
	return mets
}

async function start() {
	try {
		const mets = await getMets()
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
			markWord(range, false)
		}
	} catch (err) {
		console.log("Metwords extension: get words error", err)
	}

	document.addEventListener('mouseup', listenMouseup)
	document.addEventListener('mousedown', listenMouseDown)

	const tipWrap = document.createElement("div")
	tipWrap.setAttribute("id", "metwords-tip")
	const body = document.getElementsByTagName("body").item(0)!
	body.appendChild(tipWrap)
}

start()

document.onload = function (e: Event) {
	start()
}

const listenMouseup = async (e: MouseEvent) => {
	const tip = document.getElementById("metwords-tip")!
	if ((tip as Node).contains(e.target as Node)) {
		return
	}
	const selection = window.getSelection()
	if (selection == null) return

	if (selection.rangeCount == 0) return
	const range = selection.getRangeAt(0)
	if (range.collapsed) {
		return
	}
	console.log("---- startContainer:", range.startContainer)
	console.log("---- endContainer:", range.endContainer)
	let parent = range.commonAncestorContainer
	if (range.startContainer == range.endContainer) {
		parent = range.startContainer.parentNode!
	}
	console.log("---- parent:", parent)
	let selectText = selection.toString()
	const words = getWordIndexes(selectText)
	if (words.length != 1) {
		return
	}
	const word = words[0].word

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
			<Tip word={word} selectText={selectText} range={range} parent={parent} />
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
