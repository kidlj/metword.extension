import { browser } from "webextension-polyfill-ts"
import React, { useState } from 'react'
import ReactDOM from 'react-dom'
import ErrorMessage from "./ErrorMessage"
import { Spinner, SpinnerSize, PrimaryButton, Stack, IStackTokens, DefaultButton } from "@fluentui/react"
import { IArticleState } from "../background_scripts"
import config from "../config"

const _rootDiv = document.getElementById("content")
const homeURL = config.homeURL

const stackTokens: IStackTokens = { childrenGap: 40 }

ReactDOM.render(
	<React.StrictMode>
		<Popup />
	</React.StrictMode>,
	_rootDiv
)

function Popup() {
	const [errMessage, setErrMessage] = useState<string | boolean>(false)
	const { state, setState } = useArticleState()
	if (errMessage) return (
		<Stack verticalAlign="center" horizontalAlign="center" tokens={stackTokens}>
			<ErrorMessage errMessage={errMessage}></ErrorMessage>
		</Stack>
	)
	if (!state) return (
		<Stack verticalAlign="center" horizontalAlign="center" tokens={stackTokens}>
			<Spinner size={SpinnerSize.medium}></Spinner>
		</Stack>
	)

	if (!state.inCollection) {
		return (
			<Stack verticalAlign="center" horizontalAlign="center" tokens={stackTokens}>
				<Stack verticalAlign="center" horizontalAlign="center">
					<p>页面还未添加到收藏夹</p>
					<PrimaryButton text="添加到收藏夹" onClick={() => { addCollection() }}></PrimaryButton>
				</Stack>
				<Stack verticalAlign="center" horizontalAlign="center">
					<p>Powered by <a href={homeURL}>MetWord</a>.</p>
				</Stack>
			</Stack>
		)
	}

	return (
		<Stack verticalAlign="center" horizontalAlign="center" tokens={stackTokens}>
			<Stack verticalAlign="center" horizontalAlign="center">
				<p>页面已添加到收藏夹</p>
				<DefaultButton text="从收藏夹删除" onClick={() => { deleteCollection(state.id) }} style={{ backgroundColor: 'yellow' }} ></DefaultButton>
			</Stack>
			<Stack verticalAlign="center" horizontalAlign="center">
				<p>Powered by <a href={homeURL}>MetWord</a>.</p>
			</Stack>
		</Stack>
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