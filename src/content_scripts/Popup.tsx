import { browser } from "webextension-polyfill-ts"
import React, { useState } from 'react'
import ReactDOM from 'react-dom'
import ErrorMessage from "./ErrorMessage"
import { Spinner, SpinnerSize, DefaultButton, Stack, IStackTokens, Text } from "@fluentui/react"
import { IArticleState } from "../background_scripts"
import config from "../config"

const _rootDiv = document.getElementById("content")
const homeURL = config.homeURL
const feedURL = config.feedURL

const stackTokens: IStackTokens = { childrenGap: 30, padding: 30 }
const subStackTokens: IStackTokens = { childrenGap: 10 }

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

	return (
		<Stack verticalAlign="center" horizontalAlign="center" tokens={stackTokens}>
			{!state.collection.inCollection &&
				<Stack verticalAlign="center" horizontalAlign="center" tokens={subStackTokens}>
					<Text>页面还未添加到收藏夹</Text>
					<DefaultButton text="收藏" onClick={() => { addCollection() }}></DefaultButton>
				</Stack>
			}
			{state.collection.inCollection &&
				<Stack verticalAlign="center" horizontalAlign="center" tokens={subStackTokens}>
					<Text>页面已添加到收藏夹</Text>
					<DefaultButton text="移除" onClick={() => { deleteCollection(state.collection.id) }}></DefaultButton>
				</Stack>
			}

			{state.feed && !state.feed.subscribed &&
				<Stack verticalAlign="center" horizontalAlign="center" tokens={subStackTokens}>
					<Text>可订阅</Text>
					<Text variant="small">{state.feed.url}</Text>
					<DefaultButton text="订阅" onClick={() => { subscribe() }}></DefaultButton>
				</Stack>
			}
			{state.feed && state.feed.subscribed &&
				<Stack verticalAlign="center" horizontalAlign="center" tokens={subStackTokens}>
					<Text>已订阅</Text>
					<Text variant="small">{state.feed.url}</Text>
					<DefaultButton text="查看" href={`${feedURL}${state.feed?.id}`} target="_blank"></DefaultButton>
				</Stack>
			}

			<Stack verticalAlign="center" horizontalAlign="center">
				<Text>Powered by <a href={homeURL}>MetWord</a>.</Text>
			</Stack>
		</Stack>
	)

	async function addCollection() {
		const { data, errMessage } = await browser.runtime.sendMessage({
			action: "addCollection",
		})
		if (errMessage) {
			setErrMessage(errMessage)
			return
		}
		setState({
			collection: {
				inCollection: true,
				id: data.collection.id,
			},
			feed: state?.feed
		})
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
		setState({
			collection: {
				inCollection: false,
			},
			feed: state?.feed
		})
	}

	async function subscribe() {
		const { data, errMessage } = await browser.runtime.sendMessage({
			action: "subscribe",
		})
		if (errMessage) {
			setErrMessage(errMessage)
			return
		}
		setState({
			collection: state!.collection,
			feed: {
				url: state!.feed!.url,
				subscribed: true,
				id: data.feed.id,
			}
		})
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