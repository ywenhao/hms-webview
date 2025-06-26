import { webview } from '@kit.ArkWeb';

interface MessageResult {
  method: string;
  params?: string | number | object;
  cbId?: string;
}

@Entry
@Component
struct Index {
  url = 'http://192.168.60.163:9527';
  controller: webview.WebviewController = new webview.WebviewController();
  ports: webview.WebMessagePort[] = [];
  nativePort: webview.WebMessagePort | null = null;
  // 接收
  onMessageEvent = (result: webview.WebMessage) => {
    const res = JSON.parse(result as string) as MessageResult
    const method = res.method
    const params = res.params
    const cbId = res.cbId

    // 有返回值
    if (cbId) {
      this.nativePort!.postMessageEvent(JSON.stringify({
        cbId,
        method,
        resultType: 'resolve',
        data: '参数是：' + JSON.stringify(params),
      }))
    }
  }

  build() {
    RelativeContainer() {
      Web({ src: this.url, controller: this.controller })
        .domStorageAccess(true)
        .fileAccess(true)
        .imageAccess(true)
        .onlineImageAccess(true)
        .javaScriptAccess(true)
        .databaseAccess(true)
        .zoomAccess(false)
        .mixedMode(MixedMode.All)
        .onPageEnd(() => {
          this.ports = this.controller.createWebMessagePorts();

          this.nativePort = this.ports[0];

          this.controller.postMessage("__init_port__", [this.ports[1]], "*");
          this.nativePort.onMessageEvent(this.onMessageEvent)
        })
        .onHttpAuthRequest((event) => {
          console.log('onHttpAuthRequest:' + String(event))
          return true
        })
        .onSslErrorEventReceive((event) => {
          console.log('onSslErrorEventReceive:' + String(event))
          event.handler.handleConfirm();
        })
    }
    .height('100%')
    .width('100%')
  }
}