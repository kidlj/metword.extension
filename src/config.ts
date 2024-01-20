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

	audioURL: "https://media.metword.co/audio"
}

const production = {
	meetsURL: "https://app.metword.co/api/meet/times",
	knowURL: "https://app.metword.co/api/meet/toggle?id=",
	queryURL: "https://app.metword.co/api/word?word=",
	addSceneURL: "https://app.metword.co/api/scene",
	forgetSceneURL: "https://app.metword.co/api/scene?id=",

	audioURL: "https://media.metword.co/audio"
}

const config: Config = {
	development,
	production
}

export default config[env ?? "development"]