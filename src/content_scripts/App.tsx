import React from 'react';
import ReactDOM from 'react-dom';
import Tip from './Tip';
import './style.css';
import { getWord, getSceneSentence, markWords } from './lib'
import { Callout } from '@fluentui/react'
import { mergeStyleSets } from '@fluentui/react/lib/Styling';
import { ShadowView } from "shadow-view";
import { wordStyles } from './Word';

// 1s
const waitDuration = 1000

async function start() {
	await markWords()

	document.addEventListener('mouseup', show)
	document.addEventListener('mousedown', dismiss)
}

// waiting a while for client side rendered dom ready
setTimeout(start, waitDuration)

let _rootDiv: HTMLElement

const show = async (e: MouseEvent) => {
	const selection = window.getSelection()
	if (selection == null) return
	if (selection.isCollapsed) return

	if (selection.type != "Range") return
	if (selection.rangeCount != 1) return
	const range = selection.getRangeAt(0)
	if (range.collapsed) {
		return
	}

	const selectText = selection.toString().trim()
	const word = getWord(selectText)
	if (word == "") {
		return
	}

	if (range.startContainer.nodeType != Node.TEXT_NODE || range.endContainer.nodeType != Node.TEXT_NODE) {
		console.log("Selection not supported: range startContainer or endContainer is not text node")
		return
	}

	const sceneText = getSceneSentence(range)

	if (!_rootDiv) {
		_rootDiv = document.createElement('div')
		document.body.appendChild(_rootDiv)
	}

	ReactDOM.render(
		<React.StrictMode>
			<Callout
				id="metword-tip"
				className={styles.callout}
				role="dialog"
				gapSpace={0}
				target={range.getBoundingClientRect()}
				hideOverflow={true}
			>
				<ShadowView styleContent={wordStyles}>
					<Tip word={word} sceneText={sceneText} />
				</ShadowView>
			</Callout>
		</React.StrictMode>,
		_rootDiv
	)
}

const dismiss = (e: MouseEvent | Event) => {
	try {
		ReactDOM.unmountComponentAtNode(_rootDiv)
	} catch (e) { }
}

const styles = mergeStyleSets({
	callout: {
		display: "block !important",
		width: 520,
		padding: '20px 20px',
	},
})
