import { browser } from "webextension-polyfill-ts"
import config from '../config'
import { fetchData } from "../content_scripts/lib"

const meetsURL = config.meetsURL
const queryURL = config.queryURL
const addSceneURL = config.addSceneURL
const forgetSceneURL = config.forgetSceneURL
const knowURL = config.knowURL

browser.runtime.onMessage.addListener(async (msg) => {
	switch (msg.action) {
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


export interface IFeedMetadata {
	url?: string
	title?: string
}

export interface IPageMetadata {
	canonicalURL?: string
	feed?: IFeedMetadata
}

async function getActiveTab() {
	return await browser.tabs.query({ currentWindow: true, active: true })
}

// Feed notification
async function updateBadge() {
	try {
		const tabs = await getActiveTab()
		// sendMessage may cause exceptions, like when in illegal tab
		const page: IPageMetadata = await browser.tabs.sendMessage(tabs[0].id!, { action: "queryPageMetadata" })
		if (page && page.feed) {
			await browser.browserAction.setBadgeText({ text: "1" })
			await browser.browserAction.setBadgeBackgroundColor({ color: "deepskyblue" })
		} else {
			await browser.browserAction.setBadgeText({ text: "" })
		}
	} catch (err) {
		await browser.browserAction.setBadgeText({ text: "" })
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

browser.browserAction.onClicked.addListener(async () => {
	const tabs = await getActiveTab()
	await browser.tabs.sendMessage(tabs[0].id!, { action: "openMenu" })
})