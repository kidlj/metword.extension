import { browser } from "webextension-polyfill-ts"
import config from '../config'

const meetsURL = config.meetsURL
const queryURL = config.queryURL
const addSceneURL = config.addSceneURL
const forgetSceneURL = config.forgetSceneURL
const knowURL = config.knowURL

const articleStateURL = config.articleStateURL
const collectionURL = config.collectionURL
const feedStateURL = config.feedStateURL
const subscribeURL = config.subscribeURL
const shareURL = config.shareURL

browser.runtime.onMessage.addListener(async (msg) => {
	switch (msg.action) {
		// Word
		case "query":
			return await queryWord(msg.word)
		case 'getMeets':
			return await getMeets()
		case 'addScene':
			return await addScene(msg.scene)
		case 'forgetScene':
			return await forgetScene(msg.id)
		case 'toggleKnown':
			return await toggleKnown(msg.id)

		// News
		case 'getArticleStatePopup':
			return await getArticleStatePopup()
		case 'addCollection':
			return await addCollection(msg.url, msg.title)
		case 'deleteCollection':
			return await deleteCollection(msg.id)
		case 'subscribe':
			return await subscribe(msg.feedURL, msg.feedTitle)
		case 'share':
			return await share(msg.url, msg.title)
		case 'updateBadge':
			return await updateBadge()
	}
})

export interface Meets {
	[key: string]: number
}

let meetsCacheValid = false
let meets: Meets = {}

interface FetchResult {
	data: any,
	errMessage: string | false
}

async function addScene(scene: any) {
	const body = {
		id: scene.id,
		url: scene.url,
		text: scene.text
	}
	const payload = JSON.stringify(body)
	const result = await fetchData(addSceneURL, {
		method: "POST",
		body: payload,
	})
	return result
}

async function toggleKnown(id: number) {
	const url = knowURL + id
	const result = await fetchData(url, {
		method: "POST",
	})
	return result
}

async function forgetScene(id: number) {
	const url = forgetSceneURL + id
	const result = await fetchData(url, {
		method: "DELETE",
	})
	return result
}

async function queryWord(word: string) {
	// any query invalidate meets cache for better user experience:
	// we use asynchronous model, after users have makred a word(which invalidates the cache on server side asynchronously),
	// they may refresh the page to see whether results persist, if the old cache hasn't been purged at the right moment, 
	// another word query will fetch the new cache.
	meetsCacheValid = false
	const url = queryURL + word
	const result = await fetchData(url, {})
	return result
}

async function getMeets() {
	if (meetsCacheValid) {
		return meets
	}
	try {
		const resp = await fetch(meetsURL, {})
		const result = JSON.parse(await resp.text())
		meets = result.data || {}
		meetsCacheValid = true
	} catch (err) {
		meets = {}
		meetsCacheValid = false
	}
	return meets
}


interface FetchResult {
	data: any,
	errMessage: string | false
}

async function fetchData(url: string, init: RequestInit): Promise<FetchResult> {
	const jsonHeaders = new Headers({
		// Our Go backend implementation needs 'Accept' header to distinguish between requests, like via JSON or Turbo.
		'Accept': 'application/json',
		'Content-Type': "application/json"
	})
	if (!init.headers) {
		init.headers = jsonHeaders
	}

	try {
		const res = await fetch(encodeURI(url), init)
		const result = await res.json()
		return {
			// We can rely on .message field to distinguish between successful or failed requests, but not on .data field.
			data: result.data || null,
			errMessage: result.message || false
		}
	} catch (err) {
		return {
			data: null,
			errMessage: "网络异常"
		}
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

async function getCollectionState(url: string, canonicalURL?: string): Promise<ICollectionState> {
	const body = {
		url: url,
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

async function getArticleStatePopup(): Promise<IArticleState> {
	try {
		const tabs = await getActiveTab()
		// sendMessage may cause exceptions, like when in illegal tab
		const pageMetadata: IPageMetadata = await browser.tabs.sendMessage(tabs[0].id!, { action: "queryPageMetadata" })
		const url = pageMetadata.page.url
		const canonicalURL = pageMetadata.page.canonicalURL
		const feedURL = pageMetadata.feed?.url
		const collectionState = await getCollectionState(url, canonicalURL)
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
	} catch (err) {
		return {
			collection: {
				inCollection: false
			}
		}
	}
}

async function getActiveTab() {
	return await browser.tabs.query({ currentWindow: true, active: true })
}

async function addCollection(url: string, title: string): Promise<FetchResult> {
	const body = {
		url: url,
		title: title,
	}
	const payload = JSON.stringify(body)
	const result = await fetchData(collectionURL, {
		method: "POST",
		body: payload,
	})
	return result
}

async function deleteCollection(id: number): Promise<FetchResult> {
	const body = {
		id: id,
	}
	const payload = JSON.stringify(body)
	const result = await fetchData(collectionURL, {
		method: "DELETE",
		body: payload,
	})
	return result
}

async function subscribe(feedURL: string, feedTitle: string): Promise<FetchResult> {
	try {
		const body = {
			url: feedURL,
			title: feedTitle,
		}
		const payload = JSON.stringify(body)
		const result = await fetchData(subscribeURL, {
			method: "POST",
			body: payload,
		})
		return result
	} catch (err) {
		return {
			errMessage: "Unsupported URL",
			data: null
		}
	}
}

async function share(url: string, title: string): Promise<FetchResult> {
	try {
		const body = {
			url: url,
			title: title,
		}
		const payload = JSON.stringify(body)
		const result = await fetchData(shareURL, {
			method: "POST",
			body: payload,
		})
		return result
	} catch (err) {
		return {
			errMessage: "Unsupported URL",
			data: null
		}
	}
}


// Feed notification
async function updateBadge() {
	try {
		const tabs = await getActiveTab()
		// sendMessage may cause exceptions, like when in illegal tab
		const page: IPageMetadata = await browser.tabs.sendMessage(tabs[0].id!, { action: "queryPageMetadata" })
		if (page && page.feed) {
			await chrome.action.setBadgeText({ text: "1" })
			await chrome.action.setBadgeBackgroundColor({ color: "deepskyblue" })
		} else {
			await chrome.action.setBadgeText({ text: "" })
		}
	} catch (err) {
		await chrome.action.setBadgeText({ text: "" })
	}
}

async function updateActiveTab() {
	await updateBadge()
}

// tab switch
browser.tabs.onActivated.addListener(updateActiveTab);
browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
	if (changeInfo.url && tab.active) {
		updateActiveTab()
	}
})

chrome.action.onClicked.addListener(async () => {
	const tabs = await getActiveTab()
	try {
		await browser.tabs.sendMessage(tabs[0].id!, { action: "openMenu" })
	} catch (e) { }
})