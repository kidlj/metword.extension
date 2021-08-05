import React from 'react';
import ReactDOM from 'react-dom';
import Tip from './Tip';
import './style.css';
import { getWord, getWordRanges, WordRange, markWord, markSelected, getSelectedElement } from './lib'
import { browser } from 'webextension-polyfill-ts';
import { Callout, mergeStyleSets, FontWeights } from '@fluentui/react'

// 1s
const waitDuration = 1000

async function start() {
	// switch
	const store = await browser.storage.local.get("disabled")
	if (store.disabled == true) {
		return
	}
	const meets = await browser.runtime.sendMessage({
		action: "getMeets"
	})
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

	document.addEventListener('mouseup', listenMouseup)
	document.addEventListener('mousedown', listenMouseDown)
	document.addEventListener('scroll', listenMouseDown)
}

// waiting a while for client side rendered dom ready
setTimeout(start, waitDuration)

let _rootDiv: HTMLElement

const listenMouseup = async (e: MouseEvent) => {
	if (!_rootDiv) {
		_rootDiv = document.createElement('div')
		document.body.appendChild(_rootDiv)
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
	console.log(selectText)
	console.log("word is:", word)
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

	ReactDOM.render(
		<React.StrictMode>
			<Callout
				className={styles.callout}
				role="alertdialog"
				gapSpace={0}
				target={`#metword-selected`}
			>
				<Tip word={word} selectText={selectText} parent={parent} />
			</Callout>
		</React.StrictMode>,
		_rootDiv
	)
}

const listenMouseDown = (e: MouseEvent | Event) => {
	const selectedElement = getSelectedElement()
	if (selectedElement != null) {
		selectedElement.removeAttribute("id")
	}
	ReactDOM.unmountComponentAtNode(_rootDiv)
}

browser.storage.onChanged.addListener(({ disabled }) => {
	if (disabled.newValue == true) {
		document.removeEventListener('mouseup', listenMouseup)
		document.removeEventListener('mousedown', listenMouseDown)
		document.removeEventListener('scroll', listenMouseDown)

		ReactDOM.unmountComponentAtNode(_rootDiv)
	}
})

const styles = mergeStyleSets({
	button: {
		width: 130,
	},
	callout: {
		display: "block !important",
		width: 520,
		padding: '20px 20px',
	},
	title: {
		marginBottom: 12,
		fontWeight: FontWeights.semilight,
	},
	words: {
		display: 'block',
		marginTop: 20,
	},
})
