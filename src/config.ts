export interface Config {
	[key: string]: {
		[key: string]: string
	}
}

const env = process.env.NODE_ENV

const development = {
	loginURL: "http://app.metword.co:8080/account/login",
	meetsURL: "http://app.metword.co:8080/meet/times",
	queryURL: "http://app.metword.co:8080/word?word=",
	addSceneURL: "http://app.metword.co:8080/scene",
	forgetSceneURL: "http://app.metword.co:8080/scene?id=",
	knowURL: "http://app.metword.co:8080/meet/toggle?id="
}

const production = {
	loginURL: "https://app.metword.co/account/login",
	meetsURL: "https://app.metword.co/api/meet/times",
	queryURL: "https://app.metword.co/api/word?word=",
	addSceneURL: "https://app.metword.co/api/scene",
	forgetSceneURL: "https://app.metword.co/api/scene?id=",
	knowURL: "https://app.metword.co/api/meet/toggle?id="
}

const config: Config = {
	development,
	production
}

export default config[env ?? "development"]