import * as React from 'react'
import { mergeStyleSets, FontWeights, Spinner, SpinnerSize } from '@fluentui/react'
import { Word, IWord } from './Word'
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

	return (
		<div className={styles.words}>
			{
				words.map((w) => (<Word key={w.id} word={w} selectText={props.selectText} parent={props.parent} />))
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
	const [words, setWords] = React.useState<IWord[] | null>(null)
	const [errorCode, setErrorCode] = React.useState<number | false>(false)

	React.useEffect(() => {
		async function sendMessage(msg: { action: string, word: string }) {
			const { data, errorCode } = await browser.runtime.sendMessage(msg)
			setErrorCode(errorCode)
			setWords(data)
		}

		sendMessage(props.msg)
	}, [props.key])

	return { words, errorCode }
}