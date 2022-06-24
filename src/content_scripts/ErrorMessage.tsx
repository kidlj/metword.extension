export default function ErrorMessage({ errMessage }: { errMessage: string | boolean }) {
	return (
		<div className="metwords-message">
			{errMessage}
		</div>
	)
}