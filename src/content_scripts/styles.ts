import { mergeStyleSets } from '@fluentui/react/lib/Styling';

export const styles = mergeStyleSets({
	head: {
		marginBottom: 10,
		display: "flex",
		alignItems: "flex-end"
	},
	button: {
		lineHeight: "1.0em",
		width: 24,
		height: 16,
		marginLeft: 16,
	},
	title: {
		fontWeight: 200,
		fontSize: 42,
		lineHeight: "1.0em",
	},
	message: {
		padding: 6,
		fontSize: 14,
		color: "red",
	},
	phonetics: {},
	phonetic: {
		marginRight: 8,
	},
	phoneticLabel: {
		marginRight: 4,
	},
	defs: {
		'ul': {
			all: "unset",
			listStyleType: "none",
			paddingLeft: 0,
			maxWidth: "max-content",
		},
		'ul li': {
			all: "unset",
			display: "block",
			lineHeight: "1.2em",
		}
	},
	times: {
		display: "inline-block",
		lineHeight: "1.2em",
		backgroundColor: "black",
		color: "white",
	},
	scenes: {
		paddingLeft: 1,
		'ul': {
			all: "unset",
			paddingLeft: 0,
		},
		'ul li': {
			all: "unset",
			display: "list-item",
			listStylePosition: "inside",
			listStyleType: "disc",
			lineHeight: "1.4em",
		},
		'a': {
			all: "unset",
			cursor: "pointer",
			fontWeight: 400,
			color: "black",
			textDecoration: "none",
			':hover': {
				textDecoration: "none",
			},
		},
	},
	sceneButton: {
		fontSize: 14,
		opacity: 0,
		marginLeft: 2,
		':hover': {
			opacity: 100,
			cursor: "pointer",
		}
	},
})

