import * as React from 'react'
import { mergeStyleSets, FontWeights, Spinner, SpinnerSize } from '@fluentui/react'
import { Word, WordObject, SceneObject } from './Word'
import { browser } from 'webextension-polyfill-ts'
import ErrorMessage from './ErrorMessage'

interface TipProps {
	selectText: string
	word: string
	parent: Node
}

export default function Tip(props: TipProps) {
	const { words, errorCode } = useWords({ key: props.word, msg: { action: 'query', word: props.word } })

	if (errorCode) return <ErrorMessage errorCode={errorCode}></ErrorMessage>
	if (!words) return <Spinner size={SpinnerSize.medium}></Spinner>

	const wordObjects: WordObject[] = []
	words.forEach((w: any) => {
		const scenes: SceneObject[] = []
		let known = false
		if (w.edges.meets != null) {
			if (w.edges.meets[0].state == 10) {
				known = true
			}

			if (w.edges.meets[0].edges.scenes != null) {
				w.edges.meets[0].edges.scenes.forEach((sc: any) => {
					const scene: SceneObject = {
						id: sc.id,
						sentence: sc.text,
						url: sc.url,
						createTime: new Date(sc.create_time),
					}
					scenes.push(scene)
				})
			}
		}
		const wordObject: WordObject = {
			id: w.id,
			name: w.name,
			usPhonetic: w.us_phonetic,
			ukPhonetic: w.uk_phonetic,
			defs: w.def_zh,
			known: known,
			scenes: scenes
		}
		wordObjects.push(wordObject)
	})


	return (
		<div className={styles.words}>
			{
				wordObjects.map((w: WordObject) => (<Word key={w.id} word={w} selectText={props.selectText} parent={props.parent} />))
			}
		</div>
	)
}

const styles = mergeStyleSets({
	title: {
		marginBottom: 12,
		fontWeight: FontWeights.semilight,
	},
	words: {
		display: 'block',
	},
})

interface QueryWordsProps {
	key: string
	msg: {
		action: string
		word: string
	}
}

function useWords(props: QueryWordsProps) {
	const [words, setWords] = React.useState<any>(null)
	const [errorCode, setErrorCode] = React.useState<number | false>(false)

	React.useEffect(() => {
		async function sendMessage(msg: { action: string, word: string }) {
			const { data, errorCode } = await browser.runtime.sendMessage(msg)
			if (errorCode) {
				setErrorCode(errorCode)
				return
			}
			setWords(data)
		}

		sendMessage(props.msg)
	}, [props.key])

	return { words, errorCode }
}