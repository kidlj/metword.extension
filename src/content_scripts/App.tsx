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

	document.addEventListener('mouseup', show)
	document.addEventListener('mousedown', dismiss)
}

// waiting a while for client side rendered dom ready
setTimeout(start, waitDuration)

let _rootDiv: HTMLElement

const show = async (e: MouseEvent) => {
	const selection = window.getSelection()
	if (selection == null) return

	if (selection.type != "Range") return
	if (selection.rangeCount != 1) return
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

	// range changed here.
	markSelected(range, selectText)

	// range has changed, add the new range to selection.
	// this fixes Safari selection collapsed issue.
	selection.removeAllRanges()
	selection.addRange(range)

	let parent = range.commonAncestorContainer
	if (range.startContainer == range.endContainer) {
		parent = range.startContainer.parentNode!
	}

	// that is: parent's only child is the selected element, so go one upper level.
	if (parent.firstChild == parent.lastChild) {
		parent = parent.parentNode!
	}

	if (!_rootDiv) {
		_rootDiv = document.createElement('div')
		document.body.appendChild(_rootDiv)
	}

	ReactDOM.render(
		<React.StrictMode>
			<Callout
				id="metwords-tip"
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

const dismiss = (e: MouseEvent | Event) => {
	const tip = document.getElementById("metwords-tip")
	if (!tip) { return }
	if ((tip as Node).contains(e.target as Node)) { return }

	const selectedElement = getSelectedElement()
	if (!selectedElement) { return }
	selectedElement.removeAttribute("id")

	ReactDOM.unmountComponentAtNode(_rootDiv)
}

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
