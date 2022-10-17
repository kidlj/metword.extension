export interface Config {
	[key: string]: {
		[key: string]: string
	}
}

const env = process.env.NODE_ENV

const development = {
	meetsURL: "http://localhost:8090/api/meet/times",
	knowURL: "http://localhost:8090/api/meet/toggle?id=",
	queryURL: "http://localhost:8090/api/word?word=",
	addSceneURL: "http://localhost:8090/api/scene",
	forgetSceneURL: "http://localhost:8090/api/scene?id=",

	articleStateURL: "http://localhost:8090/api/collection/state",
	collectionURL: "http://localhost:8090/api/collection",

	feedStateURL: "http://localhost:8090/api/feed/state",
	subscribeURL: "http://localhost:8090/api/feed",

	wordsURL: "http://localhost:8090/",
	collectionsURL: "http://localhost:8090/collection/",
	feedURL: "http://localhost:8090/feed?id=",

	homeURL: "http://localhost:8090/",

	audioURL: "https://media.metword.co/audio"
}

const production = {
	meetsURL: "https://app.metword.co/api/meet/times",
	knowURL: "https://app.metword.co/api/meet/toggle?id=",
	queryURL: "https://app.metword.co/api/word?word=",
	addSceneURL: "https://app.metword.co/api/scene",
	forgetSceneURL: "https://app.metword.co/api/scene?id=",

	articleStateURL: "https://app.metword.co/api/collection/state",
	collectionURL: "https://app.metword.co/api/collection",

	feedStateURL: "https://app.metword.co/api/feed/state",
	subscribeURL: "https://app.metword.co/api/feed",

	wordsURL: "https://app.metword.co/",
	collectionsURL: "https://app.metword.co/collection/",
	feedURL: "https://app.metword.co/feed?id=",

	homeURL: "https://app.metword.co/",

	audioURL: "https://media.metword.co/audio"
}

const config: Config = {
	development,
	production
}

export default config[env ?? "development"]