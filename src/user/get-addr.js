/* global NasExtWallet */
import * as error from '../const/error'
import { isValidAddr } from '../util/index'
import { isWalletExtensionInstalled } from '../ua/index'

export function getAddr() {
	// 环境检测 & 快速失败
	if (!isWalletExtensionInstalled()) {
		return Promise.reject(new Error(error.EXTENSION_NOT_INSTALLED))
	}
	// 注意：每次都要向钱包扩展问一下，因为用户随时可能更换钱包

	// See: https://github.com/NasaTeam/Nasa.js/issues/17
	// new implement
	if (typeof NasExtWallet === 'object' && typeof NasExtWallet.getUserAddress === 'function') {
		return new Promise((resolve, reject) => {
			NasExtWallet.getUserAddress(function (addr) {
				resolve(addr)
			})
			// 如果钱包扩展没有导入钱包，会进入这里
			setTimeout(() => {
				reject(new Error(error.EXTENSION_NO_WALLET))
			}, 300)
		})
	}

	// ========== v0.3 删除以下代码 ==========
	// old implement
	window.postMessage({
		'target': 'contentscript',
		'data': {},
		'method': 'getAccount',
	}, '*')
	return new Promise((resolve, reject) => {
		const handler = (ev) => {
			// 各种库和扩展产生的消息有很多，只需要挑出我们关注的数据再返回
			// get `ev.data.data`
			const data = (ev.data || {}).data || {}
			let account = data.account || ''
			account = String(account)
			if (account && isValidAddr(account)) {
				window.removeEventListener('message', handler, false)
				resolve(account)
			}
		}
		window.addEventListener('message', handler, false)

		// 如果钱包扩展没有导入钱包，会进入这里
		setTimeout(() => {
			reject(new Error(error.EXTENSION_NO_WALLET))
		}, 300)
	})
}
