import { browser } from "webextension-polyfill-ts"

const meetsURL = "http://words.metaphor.com:8080/meet/times"
const queryURL = "http://words.metaphor.com:8080/word?word="
const addSceneURL = "http://words.metaphor.com:8080/scene"
const forgetSceneURL = "http://words.metaphor.com:8080/scene?id="
const knowURL = "http://words.metaphor.com:8080/meet/toggle?id="

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

var valid = false
var meets: any = {}

function invalidate() {
	valid = false
}

interface FetchResult {
	data: any,
	errorCode: number | false
}

async function fetchResult(input: RequestInfo, init?: RequestInit): Promise<FetchResult> {
	try {
		const res = await fetch(input, init)
		const errorCode = res.ok ? false : res.status
		const result = await res.json()
		return {
			data: result.data || null,
			errorCode: errorCode
		}
	} catch (err) {
		return {
			data: null,
			errorCode: 499
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
	let jsonHeaders = new Headers({
		'Content-Type': 'application/json'
	})

	const result = await fetchResult(addSceneURL, {
		method: "POST",
		body: payload,
		headers: jsonHeaders
	})
	if (!result.errorCode) {
		// invalidate cache
		invalidate()
	}
	return result
}

async function toggleKnown(id: number) {
	const url = knowURL + id
	const result = await fetchResult(url, {
		method: "POST",
	})
	if (!result.errorCode) {
		// invalidate cache
		invalidate()
	}
	return result
}

async function forgetScene(id: number) {
	const url = forgetSceneURL + id
	const result = await fetchResult(url, {
		method: "DELETE",
	})
	if (!result.errorCode) {
		// invalidate cache
		invalidate()
	}
	return result
}

async function queryWord(word: string) {
	const url = queryURL + word
	const result = await fetchResult(url)
	return result
}

async function getMeets() {
	if (valid) {
		return meets
	}
	try {
		const resp = await fetch(meetsURL)
		if (resp.status != 200) {
			return meets
		}
		const result = JSON.parse(await resp.text())
		meets = result.data
		valid = true
		return meets
	} catch (err) {
		console.log("Metwords extension: get words error", err)
		return meets
	}
}

const hideMark = `xmetword::before { display: none !important; }`

async function toggleDisabled() {
	try {
		const store = await browser.storage.local.get("disabled")
		if (store.disabled == undefined) {
			await browser.storage.local.set({
				"disabled": true
			})
			await browser.tabs.insertCSS({ code: hideMark })
			// invalidate cache
			invalidate()
			await browser.browserAction.setIcon({ path: "icons/logo.disabled@256px.png" })
		} else if (store.disabled = true) {
			await browser.storage.local.remove("disabled")
			await browser.tabs.removeCSS({ code: hideMark })
			await browser.tabs.reload()
			await browser.browserAction.setIcon({ path: "icons/logo@256px.png" })
		}
	} catch (err) {
		console.log(err)
	}
}

browser.browserAction.onClicked.addListener(toggleDisabled)