export default function ErrorMessage({ errMessage }: { errMessage: string }) {
	return (
		<div className="metword-message">
			<span dangerouslySetInnerHTML={{ __html: errMessage }}></span>
		</div>
	)
}