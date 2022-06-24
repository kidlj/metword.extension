import * as React from 'react'
import { mergeStyleSets, FontWeights, Spinner, SpinnerSize } from '@fluentui/react'
import { Word, IWord } from './Word'
import { browser } from 'webextension-polyfill-ts'
import ErrorMessage from './ErrorMessage'

interface TipProps {
	selectText: string
	word: string
}

export default function Tip(props: TipProps) {
	const { words, errMessage } = useWords({ key: props.word, msg: { action: 'query', word: props.word } })

	if (errMessage) return <ErrorMessage errMessage={errMessage}></ErrorMessage>
	if (!words) return <Spinner size={SpinnerSize.medium}></Spinner>

	return (
		<div className={styles.words}>
			{
				words.map((w) => (<Word key={w.id} word={w} selectText={props.selectText} />))
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
	const [errMessage, setErrMessage] = React.useState<string | false>(false)

	React.useEffect(() => {
		async function sendMessage(msg: { action: string, word: string }) {
			const { data, errMessage } = await browser.runtime.sendMessage(msg)
			setErrMessage(errMessage)
			setWords(data)
		}

		sendMessage(props.msg)
	}, [props.key])

	return { words, errMessage }
}