import React from 'react';
import ReactDOM from 'react-dom';
import './style.css';
import Tip from './Tip';
import { getWord, getWordRanges, WordRange, markWord, markSelected, getSelectedElement } from './lib'
import { browser } from 'webextension-polyfill-ts';

// 1s
const waitDuration = 1000

async function getMeets() {
	const meets = await browser.runtime.sendMessage({
		action: "getMeets"
	})
	return meets
}

async function start() {
	try {
		// switch
		const store = await browser.storage.local.get("disabled")
		if (store.disabled == true) {
			return
		}
		const meets = await getMeets()
		let ranges = new Map<string, WordRange>()
		ranges = getWordRanges(document.getRootNode(), ranges)
		ranges.forEach((val, key) => {
			if (meets[key] == undefined) {
				ranges.delete(key)
			} else {
				val.times = meets[key]
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
}

// waiting a while for client side rendered dom ready
setTimeout(start, waitDuration)

const listenMouseup = async (e: MouseEvent) => {
	let tip = document.getElementById("metwords-tip")
	if (tip == null) {
		tip = document.createElement("div")
		tip.setAttribute("id", "metwords-tip")
		const body = document.getElementsByTagName("body").item(0)!
		body.appendChild(tip)
	}
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
	// don't trim here.
	const selectText = selection.toString()
	const word = getWord(selectText)
	if (word == "") {
		return
	}

	if (range.startContainer.nodeType != Node.TEXT_NODE) {
		return
	}

	let parent = range.commonAncestorContainer
	if (range.startContainer == range.endContainer) {
		parent = range.startContainer.parentNode!
	}
	// fix Safari range
	if (parent.firstChild == parent.lastChild) {
		parent = parent.parentNode!
	}

	markSelected(range, selectText)

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
			<Tip word={word} selectText={selectText} parent={parent} />
		</React.StrictMode>,
		tip
	)
}

const listenMouseDown = (e: MouseEvent) => {
	const tip = document.getElementById("metwords-tip")!
	if ((tip as Node).contains(e.target as Node)) {
		return
	}
	const selectedElement = getSelectedElement()
	if (selectedElement != null) {
		selectedElement.removeAttribute("id")
	}
	ReactDOM.unmountComponentAtNode(tip)
	tip.style.display = "none"
}

browser.storage.onChanged.addListener(({ disabled }) => {
	if (disabled.newValue == true) {
		document.removeEventListener('mouseup', listenMouseup)
		document.removeEventListener('mousedown', listenMouseDown)

		const tip = document.getElementById("metwords-tip")!
		tip.style.display = "none"
	}
})
