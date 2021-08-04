import * as React from 'react'
import { Callout, Link, mergeStyleSets, Text, FontWeights } from '@fluentui/react'
import { useId } from '@fluentui/react-hooks'

interface Selection {
}

export const Tip: React.FunctionComponent<any> = (props: Selection) => {
	const labelId = useId('callout-label')
	const descriptionId = useId('callout-description')

	return (
		<>
			<Callout
				className={styles.callout}
				ariaLabelledBy={labelId}
				ariaDescribedBy={descriptionId}
				role="alertdialog"
				gapSpace={0}
				target={`#metword-selected`}
				setInitialFocus
			>
				<Text block variant="xLarge" className={styles.title} id={labelId}>
					Callout title here
				</Text>
				<Text block variant="small" id={descriptionId}>
					Message body is optional. If help documentation is available, consider adding a link to learn more at the
					bottom.
				</Text>
				<Link href="http://microsoft.com" target="_blank" className={styles.link}>
					Sample link
				</Link>
			</Callout>
		</>
	)
}

const styles = mergeStyleSets({
	button: {
		width: 130,
	},
	callout: {
		width: 420,
		padding: '20px 24px',
	},
	title: {
		marginBottom: 12,
		fontWeight: FontWeights.semilight,
	},
	link: {
		display: 'block',
		marginTop: 20,
	},
})

export default Tip