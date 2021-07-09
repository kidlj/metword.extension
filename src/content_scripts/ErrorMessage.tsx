interface ErrorMessageProps {
	message: string
}

export default function ErrorMessage({ message }: ErrorMessageProps) {
	return (
		<p className="met-message" dangerouslySetInnerHTML={{ __html: message }}>
		</p>
	)
}