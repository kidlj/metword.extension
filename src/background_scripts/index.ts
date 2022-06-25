import { browser } from "webextension-polyfill-ts"
import config from '../config'

const meetsURL = config.meetsURL
const queryURL = config.queryURL
const addSceneURL = config.addSceneURL
const forgetSceneURL = config.forgetSceneURL
const knowURL = config.knowURL
const collectionsURL = config.collectionsURL
const collectionURL = config.collectionURL

const addCollectionAction = 1
const removeCollectionAction = 2

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
		case 'getArticleState':
			return await getArticleState()
		case 'addCollection':
			return await collection(addCollectionAction)
		case 'removeCollection':
			return await collection(removeCollectionAction)
	}
})

export interface Meets {
	[key: string]: number
}

let meetsCacheValid = false
let meets: Meets = {}

export interface Collections {
	[key: string]: number
}
let collectionCacheValid = false
let collections: Collections = {}


interface FetchResult {
	data: any,
	errMessage: string | false
}

async function fetchData(url: string, init: RequestInit): Promise<FetchResult> {
	const jsonHeaders = new Headers({
		// Our Go backend implementation needs 'Accept' header to distinguish requests, like via JSON or Turbo.
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
			// We can rely on .message field to distinguish successful for failed requests, but not on .data field.
			data: result.data || null,
			errMessage: result.message || false
		}
	} catch (err) {
		return {
			data: null,
			errMessage: "网络连接错误"
		}
	}
}

async function addScene(scene: any) {
	const body = {
		id: scene.id,
		url: scene.url,
		text: scene.text
	}
	let payload = JSON.stringify(body)
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
	// any query invalidate meets cache
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

async function getCollections() {
	console.log("cache state is:", collectionCacheValid)
	if (collectionCacheValid) {
		return collections
	}

	try {
		const resp = await fetch(collectionsURL, {})
		const result = JSON.parse(await resp.text())
		collections = result.data || {}
		collectionCacheValid = true
	} catch (err) {
		collections = {}
		collectionCacheValid = false
	}
	return collections
}

export interface IArticleState {
	inCollection: boolean
}

async function getArticleState(): Promise<IArticleState> {
	const tabs = await getActiveTab()
	let url = tabs[0].url
	if (!url) {
		return { inCollection: false }
	}
	url = clearAnchor(url)
	const collections = await getCollections()
	console.log("collection:", collections)
	if (collections[url]) {
		return { inCollection: true }
	}
	return { inCollection: false }
}

async function getActiveTab() {
	return await browser.tabs.query({ currentWindow: true, active: true })
}

async function collection(action: number) {
	const tabs = await getActiveTab()
	const url = tabs[0].url
	console.log("url is:", url)
	const title = tabs[0].title
	console.log("title is:", title)
	const body = {
		url: url,
		title: title,
		action: action,
	}
	const payload = JSON.stringify(body)
	const result = await fetchData(collectionURL, {
		method: action === addCollectionAction ? "POST" : "DELETE",
		body: payload,
	})
	if (!result.errMessage) {
		collectionCacheValid = false
	}
	return result
}

// ClearSegment cleans the last anchor part of an url; Migrated from Go version, see its tests for examples.
function clearAnchor(url: string): string {
	let index = url.length
	for (let i = url.length - 1; i > 0; i--) {
		if (url[i] === '#') {
			index = i
			break
		}
		if (url[i] === '!' || url[i] === '/') {
			break
		}
	}
	if (index < url.length) {
		return url.slice(0, index)
	}
	return url
}
