import config from '../config'

export default function ErrorMessage({ errorCode }: { errorCode: number }) {
	let message = <p>服务异常。</p>
	switch (errorCode) {
		case 400:
			message = <p>不支持的输入。</p>
			break
		case 401:
			message = <p>请<a href={config.loginURL}>登录</a>后使用。</p>
			break
		case 404:
			message = <p>未找到定义。</p>
			break
		case 499:
			message = <p>请检查网络连接。</p>
			break
		case 503:
			message = <p>服务受限，休息一会儿吧。</p>
			break
		case 504:
			message = <p>响应超时。</p>
			break
	}

	return (
		<div className="metwords-message">
			{message}
		</div>
	)
}