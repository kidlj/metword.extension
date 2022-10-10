import React from 'react';
import ReactDOM from 'react-dom';
import Tip from './Tip';
import './style.css';
import { getWord, getWordRanges, WordRange, markWord, markSelected, getSelectedElement } from './lib'
import { browser } from 'webextension-polyfill-ts';
import { Callout } from '@fluentui/react'
import { mergeStyleSets } from '@fluentui/react/lib/Styling';
import { Meets, IArticleState, IFeedMetadata, IPageMetadata } from '../background_scripts/index'
import config from '../config'
import ErrorMessage from './ErrorMessage';
import { ShadowView } from "shadow-view";
import { wordStyles } from './Word';

// 1s
const waitDuration = 1000

const feedURL = config.feedURL
const collectionsURL = config.collectionsURL
const wordsURL = config.wordsURL

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
				id="metword-tip"
				className={styles.callout}
				role="alertdialog"
				gapSpace={0}
				target={`#metword-selected`}
				hideOverflow={true}
			>
				<ShadowView styleContent={wordStyles}>
					<Tip word={word} selectText={selectText} />
				</ShadowView>
			</Callout>
		</React.StrictMode>,
		_rootDiv
	)
}

const dismiss = (e: MouseEvent | Event) => {
	const selectedElement = getSelectedElement()
	selectedElement?.removeAttribute("id")

	ReactDOM.unmountComponentAtNode(_rootDiv)
}

const styles = mergeStyleSets({
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

const menuStyles = `
.menu {
	padding: 4px 10px;
	display: flex;
	flex-direction: row;
	column-gap: 12px;
	vertical-align: center;
	justify-content: space-evenly;
}

.button {
	cursor: pointer;
}

.button img {
	height: 18px;
	width: 18px;
}

.disabled {
	cursor: default;
}

.message {
	display: flex;
	flex-direction: row;
	vertical-align: center;
	justify-content: space-between;
}
`

function openMenu() {
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
				<ShadowView styleContent={menuStyles}>
					<Menu></Menu>
				</ShadowView>
			</Callout>
		</React.StrictMode >,
		_rootDiv
	)
}

const closeMenu = () => {
	ReactDOM.unmountComponentAtNode(_rootDiv)
}

const starIcon = browser.runtime.getURL("icons_normal/star.png")
const rssIcon = browser.runtime.getURL("icons_normal/rss.png")
const searchIcon = browser.runtime.getURL("icons_normal/search.png")
const bookIcon = browser.runtime.getURL("icons_normal/book.png")
const closeIcon = browser.runtime.getURL("icons_normal/close.png")

const starActive = browser.runtime.getURL("icons_active/star.png")
const rssActive = browser.runtime.getURL("icons_active/rss.png")

const rssDisabled = browser.runtime.getURL("icons_normal/rss-disabled.png")

export function Menu() {
	const [errMessage, setErrMessage] = React.useState<string | false>(false)
	const { state, setState } = useArticleState()

	if (errMessage) return (
		<div className='message'>
			<ErrorMessage errMessage={errMessage}></ErrorMessage>
			<div className='button'>
				<a onClick={() => closeMenu()}>
					<img src={closeIcon}></img>
				</a>
			</div>
		</div>
	)
	if (!state) return (
		<div className='message'>
			<ErrorMessage errMessage={"Loading..."}></ErrorMessage>
		</div>
	)

	const metadata = getPageMetadata()
	const pageMetadata = metadata.page
	const feedMetadata = metadata.feed
	const collection = state.collection
	const feed = state.feed

	return (
		<div className='menu'>
			{!collection.inCollection &&
				<div className='button'>
					<a title="Add To Collections" onClick={() => addCollection(pageMetadata.url, pageMetadata.title)}>
						<img src={starIcon}></img>
					</a>
				</div>
			}

			{collection.inCollection &&
				<div className='button'>
					<a title='Remove From Collections' onClick={() => deleteCollection(collection.id!)}>
						<img src={starActive}></img>
					</a>
				</div>
			}

			{!feedMetadata &&
				<div className='button disabled'>
					<a title="未发现订阅">
						<img src={rssDisabled}></img>
					</a>
				</div>
			}
			{feedMetadata && feed && !feed.subscribed &&
				<div className='button'>
					<a title='订阅' onClick={() => subscribe(feedMetadata.url, feedMetadata.title)}>
						<img src={rssIcon}></img>
					</a>
				</div>
			}
			{feedMetadata && feed && feed.subscribed &&
				<div title='查看订阅' className="button">
					<a href={feedURL + feed.id}>
						<img src={rssActive}></img>
					</a>
				</div>
			}

			<div className="button">
				<a title="搜索" href={collectionsURL}>
					<img src={searchIcon}></img>
				</a>
			</div>

			<div className='button'>
				<a title="单词本" href={wordsURL}>
					<img src={bookIcon}></img>
				</a>
			</div>

			<div className='button'>
				<a title="关闭" onClick={() => closeMenu()}>
					<img src={closeIcon}></img>
				</a>
			</div>
		</div>
	)

	async function addCollection(url: string, title: string) {
		const { data, errMessage } = await browser.runtime.sendMessage({
			action: "addCollection",
			url: url,
			title: title,
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

	async function deleteCollection(id: number) {
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

	async function subscribe(feedURL: string, feedTitle: string) {
		const { data, errMessage } = await browser.runtime.sendMessage({
			action: "subscribe",
			feedURL: feedURL,
			feedTitle: feedTitle,
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
