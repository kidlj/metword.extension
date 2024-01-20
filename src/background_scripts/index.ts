import { browser } from "webextension-polyfill-ts"
import config from '../config'

const ua = 'MetWord-Extension/2.2.0'
const meetsStorageKey = "meets"

const meetsURL = config.meetsURL
const queryURL = config.queryURL
const addSceneURL = config.addSceneURL
const forgetSceneURL = config.forgetSceneURL
const knowURL = config.knowURL

const homeURL = "https://app.metword.co/"

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
	}
})

export interface Meets {
	[key: string]: number
}

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
	if (!result.errMessage) {
		await purgeMeetsCache()
	}
	return result
}

async function toggleKnown(id: number) {
	const url = knowURL + id
	const result = await fetchData(url, {
		method: "POST",
	})
	if (!result.errMessage) {
		await purgeMeetsCache()
	}
	return result
}

async function forgetScene(id: number) {
	const url = forgetSceneURL + id
	const result = await fetchData(url, {
		method: "DELETE",
	})
	if (!result.errMessage) {
		await purgeMeetsCache()
	}
	return result
}

async function queryWord(word: string) {
	const url = queryURL + word
	const result = await fetchData(url, {})
	return result
}

async function getMeets() {
	const store = await browser.storage.local.get()
	let meets = store[meetsStorageKey]
	if (meets) return meets

	const result = await fetchData(meetsURL, {})
	meets = result.data || {}
	await browser.storage.local.set({ [meetsStorageKey]: meets })
	return meets
}

async function purgeMeetsCache() {
	await browser.storage.local.remove(meetsStorageKey)
}

interface FetchResult {
	data: any,
	errMessage: string | false
}

async function fetchData(url: string, init: RequestInit): Promise<FetchResult> {
	const jsonHeaders = new Headers({
		// Our Go backend implementation needs 'Accept' header to distinguish between requests, like via JSON or Turbo.
		'Accept': 'application/json',
		'Content-Type': "application/json",
		'X-UA': ua
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

chrome.action.onClicked.addListener(async () => {
	try {
		await browser.tabs.create({
			url: homeURL
		})
	} catch (e) {
		console.log("Unsupported Tab")
	}
})