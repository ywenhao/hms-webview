let cbId = 0
const cbMap = new Map()

let hmsPort: MessagePort

function hmsOnMessage(e: MessageEvent) {
  const data = (e as MessageEvent).data
  if (typeof data === 'string') {
    try {
      const dataObj = JSON.parse(data)
      const type = dataObj.type
      if (type !== 'hms-webview') return

      const cbId = dataObj.cbId
      const result = dataObj.data
      const cb = cbMap.get(cbId)
      cbMap.delete(cbId)
      if (dataObj.resultType === 'resolve') {
        cb.resolve(result)
      } else {
        try {
          if (result) {
            cb.reject(result)
          } else {
            cb.reject({})
          }
        } catch (error) {
          cb.reject(result || error)
        }
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      /* empty */
    }
  }
}

const registerCallback = <T>(resolve: (value: T) => void, reject: (reason?: any) => void) => {
  const id = `jsCallBack${cbId++}`
  cbMap.set(id, { resolve, reject })
  return id
}

const invoke = (method: string, params: any) => {
  hmsPort.postMessage(JSON.stringify({ method, params }))
}

function invokeWithResult<T>(method: string, params?: any) {
  return new Promise<T>((resolve, reject) => {
    // if (isReady()) {
    const cbId = registerCallback(resolve, reject)
    hmsPort.postMessage(JSON.stringify({ method, params, cbId }))
    // } else {
    // reject('jsBridge is not ready')
    // }
  })
}

export const setupHmsPort = () => {
  if (hmsPort) return
  const { signal, abort } = new AbortController()
  window.addEventListener(
    'message',
    (e) => {
      if (e.data === '__init_port__') {
        hmsPort = e.ports[0]
        // 接收来自hms的消息
        hmsPort.onmessage = hmsOnMessage
        abort()
      }
    },
    { signal }
  )
}

export const hmsBridge = {
  test: (text: string) => invoke('test', text),
  testResult: () => invokeWithResult<string>('testResult', '哈哈哈'),
}
