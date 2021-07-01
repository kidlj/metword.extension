import { browser } from "webextension-polyfill-ts"

const meetsURL = "http://words.metaphor.com:8080/meet/times"
const queryURL = "http://words.metaphor.com:8080/word?word="
const meetURL = "http://words.metaphor.com:8080/meet"

browser.runtime.onMessage.addListener(async (msg) => {
	switch (msg.action) {
		case "query":
			return await queryWord(msg.word)
		case 'getMeets':
			return await getMeets()
		case 'plusOne':
			return await plusOne(msg.scene)
	}
})

var valid = false
var meets: any = {}

function invalidate() {
	valid = false
}

async function plusOne(scene: any) {
	try {
		const body = {
			id: scene.id,
			url: scene.url,
			text: scene.text
		}
		let payload = JSON.stringify(body)
		let jsonHeaders = new Headers({
			'Content-Type': 'application/json'
		})

		const resp = await fetch(meetURL, {
			method: "POST",
			body: payload,
			headers: jsonHeaders
		})
		if (resp.status != 200) {
			return false
		}
		// invalidate cache
		invalidate()
		return true
	} catch (err) {
		console.log("meet word failed", err)
		return false
	}
}

async function queryWord(word: string) {
	try {
		const query = queryURL + word
		const resp = await fetch(query)
		if (resp.status != 200) {
			return []
		}
		const result = await resp.json()
		return result.words
	} catch (err) {
		console.log("query word error", err)
		return []
	}
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
		meets = result.meets
		valid = true
		return meets
	} catch (err) {
		console.log("Metwords extension: get words error", err)
		return meets
	}
}

const hideMark = `xmetword.x-metword-mark::before { display: none !important; }`

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
		} else if (store.disabled = true) {
			await browser.storage.local.remove("disabled")
			await browser.tabs.removeCSS({ code: hideMark })
			await browser.tabs.reload()
		}
	} catch (err) {
		console.log(err)
	}
}

browser.browserAction.onClicked.addListener(toggleDisabled)