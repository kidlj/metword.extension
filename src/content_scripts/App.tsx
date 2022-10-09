import React from 'react';
import ReactDOM from 'react-dom';
import Tip from './Tip';
import './style.css';
import { getWord, getWordRanges, WordRange, markWord, markSelected, getSelectedElement, fetchData } from './lib'
import { browser } from 'webextension-polyfill-ts';
import { Callout } from '@fluentui/react'
import { mergeStyles, mergeStyleSets, FontWeights } from '@fluentui/react/lib/Styling';
import { Meets } from '../background_scripts/index'
import { IRenderFunction, Spinner, SpinnerSize, Stack, IStackTokens } from '@fluentui/react';
import { ActionButton, IButtonProps } from '@fluentui/react/lib/Button';
import { FavoriteStarIcon, GlobeFavoriteIcon, SearchIcon, ShareIcon, ChromeCloseIcon, } from '@fluentui/react-icons-mdl2';
import config from '../config'
import ErrorMessage from './ErrorMessage';

// 1s
const waitDuration = 1000

const articleStateURL = config.articleStateURL
const collectionURL = config.collectionURL
const shareURL = config.shareURL
const feedURL = config.feedURL
const collectionsURL = config.collectionsURL
const feedStateURL = config.feedStateURL
const subscribeURL = config.subscribeURL

async function start() {
	const meets: Meets = await browser.runtime.sendMessage({
		action: "getMeets"
	})
	let ranges = new Array<WordRange>()
	ranges = getWordRanges(document.getRootNode(), ranges)
	ranges.forEach((r, i) => {
		if (meets[r.name] > 0) {
			r.times = meets[r.name]
			markWord(r, false)
		} else {
			delete ranges[i]
		}
	})

	document.addEventListener('mouseup', show)
	document.addEventListener('mousedown', dismiss)
}


// On page loaded update feed notification
browser.runtime.sendMessage({
	"action": "updateBadge",
})

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
				<Tip word={word} selectText={selectText} />
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
	menu: {
		display: "block !important",
		width: 256,
		padding: '10px 20px',
		backgroundColor: "white",
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

function getPageCanonicalURL(): string | undefined {
	const canonicalURLLinkElement = document.querySelector('head link[rel="canonical"]') as HTMLLinkElement
	if (canonicalURLLinkElement) {
		return canonicalURLLinkElement.href
	}

	const canonicalURLMetaElement = document.querySelector('head meta[property="og:url"]') as HTMLMetaElement
	if (canonicalURLMetaElement) {
		return canonicalURLMetaElement.content
	}
	return
}

function getPageFeedMetadata(): IFeedMetadata | undefined {
	const rssLinkElement = document.querySelector('head link[type="application/rss+xml"]') as HTMLLinkElement
	if (rssLinkElement) {
		return {
			url: rssLinkElement.href,
			title: rssLinkElement.title
		}
	}
	const atomLinkElement = document.querySelector('head link[type="application/atom+xml"]') as HTMLLinkElement
	if (atomLinkElement) {
		return {
			url: atomLinkElement.href,
			title: atomLinkElement.title,
		}
	}
	return
}

function getPageMetadata(): IPageMetadata {
	const canonicalURL = getPageCanonicalURL()
	const feed = getPageFeedMetadata()
	return {
		page: {
			url: window.location.href,
			title: document.title,
			canonicalURL: canonicalURL,
		},
		feed: feed,
	}
}

browser.runtime.onMessage.addListener(async (msg) => {
	switch (msg.action) {
		case "queryPageMetadata":
			return getPageMetadata()
		case "openMenu":
			return openMenu()
	}
})

function openMenu() {
	console.log("openMenu")
	const left = window.innerWidth - 10
	const top = 10

	if (!_rootDiv) {
		_rootDiv = document.createElement('div')
		document.body.appendChild(_rootDiv)
	}

	ReactDOM.render(
		<React.StrictMode>
			<Callout
				id="metword-menu"
				className={styles.menu}
				role="dialog"
				gapSpace={0}
				isBeakVisible={false}
				target={{ left: left, top: top }}
			>
				<Menu></Menu>
			</Callout>
		</React.StrictMode>,
		_rootDiv
	)
}

const closeMenu = () => {
	ReactDOM.unmountComponentAtNode(_rootDiv)
}

// useless, no effect to ActionButton.
const buttonClass = mergeStyles({
	height: 20,
	width: 20,
})

const classNames = mergeStyleSets({
	deepSkyBlue: [{ color: 'deepskyblue' }, buttonClass],
})

const onRenderIcon: IRenderFunction<IButtonProps> = (props: IButtonProps | undefined) => {
	if (props == undefined) {
		return null
	}
	switch (props.label) {
		case 'AddCollection':
			return <FavoriteStarIcon title="Add to collections"></FavoriteStarIcon>
		case 'RemoveCollection':
			return <FavoriteStarIcon title="Remove from collections" className={classNames.deepSkyBlue}></FavoriteStarIcon>
		case 'Subscribe':
			return <GlobeFavoriteIcon title="Subscribe feed"></GlobeFavoriteIcon>
		case 'ViewFeed':
			return <GlobeFavoriteIcon title="View feed" className={classNames.deepSkyBlue}></GlobeFavoriteIcon>
		case 'Search':
			return <SearchIcon title="Search collections"></SearchIcon>
		case 'Share':
			return <ShareIcon title="Share to News"></ShareIcon>
		case 'Close':
			return <ChromeCloseIcon title="Close"></ChromeCloseIcon>
	}
	return null
}

const stackTokens: IStackTokens = { childrenGap: 16 }

export function Menu() {
	const [errMessage, setErrMessage] = React.useState<string | false>(false)
	const { state, setState } = useArticleState()

	if (errMessage) return (
		<Stack horizontal horizontalAlign='space-between' verticalAlign='center' tokens={stackTokens}>
			<ErrorMessage errMessage={errMessage}></ErrorMessage>
			<ActionButton onRenderIcon={onRenderIcon} label="Close" onClick={() => closeMenu()} />
		</Stack>
	)
	if (!state) return (
		<Spinner size={SpinnerSize.medium}></Spinner>
	)

	const metadata = getPageMetadata()
	const pageMetadata = metadata.page
	const feedMetadata = metadata.feed
	const collection = state.collection
	const feed = state.feed

	return (
		<div>
			<Stack horizontal verticalAlign="center" horizontalAlign="center" tokens={stackTokens}>
				{!collection.inCollection &&
					<ActionButton onRenderIcon={onRenderIcon} label="AddCollection" onClick={() => addCollection(pageMetadata.url, pageMetadata.title)} />
				}

				{collection.inCollection &&
					<ActionButton onRenderIcon={onRenderIcon} label="RemoveCollection" onClick={() => deleteCollection(collection.id!)} />
				}

				{!feedMetadata &&
					<ActionButton onRenderIcon={onRenderIcon} label="Subscribe" disabled />
				}
				{feedMetadata && feed && !feed.subscribed &&
					<ActionButton onRenderIcon={onRenderIcon} label="Subscribe" onClick={() => subscribe(feedMetadata.url, feedMetadata.title)} />
				}
				{feedMetadata && feed && feed.subscribed &&
					<ActionButton onRenderIcon={onRenderIcon} label="ViewFeed" href={feedURL + feed.id} />
				}

				<ActionButton onRenderIcon={onRenderIcon} label="Search" href={collectionsURL} />

				<ActionButton onRenderIcon={onRenderIcon} label="Share" onClick={() => share(pageMetadata.url, pageMetadata.title)} />

				<ActionButton onRenderIcon={onRenderIcon} label="Close" onClick={() => closeMenu()} />
			</Stack>
		</div>
	)

	async function addCollection(url: string, title: string) {
		const body = {
			url: url,
			title: title,
		}
		const payload = JSON.stringify(body)
		const { data, errMessage } = await fetchData(collectionURL, {
			method: "POST",
			body: payload,
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
			feed: state!.feed
		})
	}

	async function deleteCollection(id: number) {
		const body = {
			id: id,
		}
		const payload = JSON.stringify(body)
		const { data, errMessage } = await fetchData(collectionURL, {
			method: "DELETE",
			body: payload,
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

	async function subscribe(feedURL: string, feedTitle: string) {
		const body = {
			url: feedURL,
			title: feedTitle,
		}
		const payload = JSON.stringify(body)
		const { data, errMessage } = await fetchData(subscribeURL, {
			method: "POST",
			body: payload,
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

	async function share(url: string, title: string) {
		const body = {
			url: url,
			title: title,
		}
		const payload = JSON.stringify(body)
		const { data, errMessage } = await fetchData(shareURL, {
			method: "POST",
			body: payload,
		})
		if (errMessage) {
			setErrMessage(errMessage)
			return
		}
		setErrMessage("Success! Thanks for sharing!")
	}

}

export interface ICollectionState {
	inCollection: boolean
	id?: number
}

export interface IFeedState {
	url: string
	subscribed: boolean
	id?: number
}

export interface IArticleState {
	collection: ICollectionState
	feed?: IFeedState
}

export interface IFeedMetadata {
	url: string
	title: string
}

export interface IPageMetadata {
	page: {
		url: string
		title: string
		canonicalURL?: string
	}
	feed?: IFeedMetadata
}

function useArticleState() {
	const [state, setState] = React.useState<IArticleState | null>(null)

	React.useEffect(() => {
		async function getState() {
			const data = await getArticleState()
			setState(data)
		}

		getState()
	}, [])

	return { state, setState }
}

async function getCollectionState(tabURL?: string, canonicalURL?: string): Promise<ICollectionState> {
	const body = {
		url: tabURL,
		canonicalURL: canonicalURL,
	}
	const payload = JSON.stringify(body)
	const result = await fetchData(articleStateURL, {
		method: "POST",
		body: payload,
	})
	if (result.errMessage) {
		// Do not propogate error message here.
		return { inCollection: false }
	}
	return result.data
}

async function getFeedState(feedURL: string): Promise<IFeedState> {
	const body = {
		url: feedURL,
	}
	const payload = JSON.stringify(body)
	const result = await fetchData(feedStateURL, {
		method: "POST",
		body: payload,
	})
	if (result.errMessage) {
		// Do not propogate error message here.
		return { url: feedURL, subscribed: false }
	}
	return { url: feedURL, ...result.data }
}

async function getArticleState(): Promise<IArticleState> {
	const pageMetadata = getPageMetadata()
	const page = pageMetadata.page
	const feedURL = pageMetadata.feed?.url
	const collectionState = await getCollectionState(page.url, page.canonicalURL)
	if (!feedURL) {
		return {
			collection: collectionState
		}
	}
	const feedState = await getFeedState(feedURL)
	return {
		collection: collectionState,
		feed: feedState,
	}
}
