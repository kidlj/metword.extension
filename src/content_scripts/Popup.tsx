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
			<button onClick={() => { deleteCollection(state.id) }}>从收藏删除</button>
		</div>
	)

	async function addCollection() {
		const { _, errMessage } = await browser.runtime.sendMessage({
			action: "addCollection",
		})
		if (errMessage) {
			setErrMessage(errMessage)
			return
		}
		// addCollection requests don't response inCollection state
		setState({ inCollection: true })
	}

	async function deleteCollection(id: number | undefined) {
		const { _, errMessage } = await browser.runtime.sendMessage({
			action: "deleteCollection",
			id: id
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

		sendMessage({ action: "getArticleStatePopup" })
	}, [])

	return { state, setState }
}