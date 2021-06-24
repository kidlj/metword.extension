import { browser } from "webextension-polyfill-ts"

const metsURL = "http://127.0.0.1:8080/word/mets"
const queryURL = "http://127.0.0.1:8080/word?word="
const meetURL = "http://127.0.0.1:8080/word/meet"
const loginURL = "http://127.0.0.1:8080/login"

browser.runtime.onMessage.addListener(async (msg) => {
	switch (msg.action) {
		case "query":
			return await queryWord(msg.word)
		case 'getMets':
			return await getMets()
		case 'plusOne':
			return await plusOne(msg.scene)
	}
})

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
		if (resp.status == 401) {
			await browser.tabs.create({
				url: loginURL,
				active: true
			})
			return
		}
		if (resp.status != 200) {
			return false
		}
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
		if (resp.status == 401) {
			await browser.tabs.create({
				url: loginURL,
				active: true
			})
			return
		}
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

async function getMets() {
	try {
		const resp = await fetch(metsURL)
		if (resp.status == 401) {
			console.log("debug -------", resp.status)
			await browser.tabs.create({
				url: loginURL,
				active: true
			})
			return
		}
		if (resp.status != 200) {
			return
		}
		const result = JSON.parse(await resp.text())
		return result.mets
	} catch (err) {
		console.log("Metwords extension: get words error", err)
		return {}
	}
}

const hideMark = `xmetword.x-metword-mark::before { display: none; }`

async function toggleDisabled() {
	try {
		const store = await browser.storage.local.get("disabled")
		if (store.disabled == undefined) {
			await browser.storage.local.set({
				"disabled": true
			})
			await browser.tabs.insertCSS({ code: hideMark })
		} else if (store.disabled = true) {
			await browser.storage.local.remove("disabled")
			await browser.tabs.removeCSS({ code: hideMark })
			await browser.tabs.reload()
			// TODO: waiting for user feedback to decide implementation
			// await browser.notifications.create("test notification", {
			// 	type: "basic",
			// 	title: "reload needed",
			// 	message: "please reload page",
			// })
		}
	} catch (err) {
		console.log(err)
	}
}

browser.browserAction.onClicked.addListener(toggleDisabled)