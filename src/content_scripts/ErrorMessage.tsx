import { styles } from "./styles"

export default function ErrorMessage({ errMessage }: { errMessage: string }) {
	return (
		<div className={styles.message}>
			<span dangerouslySetInnerHTML={{ __html: errMessage }}></span>
		</div>
	)
}