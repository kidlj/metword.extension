import { browser } from "webextension-polyfill-ts"
import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import ErrorMessage from "./ErrorMessage";
import { Spinner, SpinnerSize } from "@fluentui/react";
import { IArticleState } from "../background_scripts";

const _rootDiv = document.getElementById("content")

ReactDOM.render(
	<React.StrictMode>
		<Popup />
	</React.StrictMode>,
	_rootDiv
)

function Popup() {
	const [errMessage, setErrMessage] = useState<string | boolean>(false)
	const { state, setState } = useArticleState()
	console.log("state is:", state)
	if (errMessage) return <ErrorMessage errMessage={errMessage}></ErrorMessage>
	if (!state) return <Spinner size={SpinnerSize.medium}></Spinner>

	if (!state.inCollection) {
		return (
			<div>
				<p>Not in collection</p>
				<button onClick={() => { addCollection() }}>添加到收藏</button>
			</div>
		)
	}

	return (
		<div>
			<p>In collection</p>
			<button onClick={() => { removeCollection() }}>从收藏移除 </button>
		</div>
	)

	async function addCollection() {
		const { data: state, errMessage } = await browser.runtime.sendMessage({
			action: "addCollection",
		})
		if (errMessage) {
			setErrMessage(errMessage)
			return
		}
		// addCollection requests don't response inCollection state
		setState({ inCollection: true })
	}

	async function removeCollection() {
		const { data: state, errMessage } = await browser.runtime.sendMessage({
			action: "removeCollection",
		})
		if (errMessage) {
			setErrMessage(errMessage)
			return
		}
		// removeCollection requests don't response inCollection state
		setState({ inCollection: false })
	}
}

function useArticleState() {
	const [state, setState] = React.useState<IArticleState | null>(null)

	React.useEffect(() => {
		async function sendMessage(msg: { action: string }) {
			const data = await browser.runtime.sendMessage(msg)
			setState(data)
		}

		sendMessage({ action: "getArticleState" })
	}, [])

	return { state, setState }
}