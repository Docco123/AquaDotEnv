import { forwardRef, useImperativeHandle, useRef } from 'react';
import { WebView } from 'react-native-webview';
import { MAP_HTML } from './mapHtml';
import type { MapCommand, MapEvent, MapHandle, MapProps } from './protocol';

/** iOS / Android: the Leaflet page runs in a WebView; commands are injected as JS. */
const MapView = forwardRef<MapHandle, MapProps>(function MapView({ onEvent }, ref) {
  const web = useRef<WebView>(null);
  const ready = useRef(false);
  const queue = useRef<MapCommand[]>([]);

  const post = (cmd: MapCommand) =>
    web.current?.injectJavaScript(`window.__recv(${JSON.stringify(JSON.stringify(cmd))});true;`);

  useImperativeHandle(ref, () => ({
    send(cmd) {
      if (ready.current) post(cmd);
      else queue.current.push(cmd);
    },
  }));

  return (
    <WebView
      ref={web}
      originWhitelist={['*']}
      source={{ html: MAP_HTML, baseUrl: 'https://localhost/' }}
      javaScriptEnabled
      style={{ flex: 1 }}
      onMessage={(e) => {
        let msg: MapEvent;
        try {
          msg = JSON.parse(e.nativeEvent.data);
        } catch {
          return;
        }
        if (msg.type === 'ready') {
          ready.current = true;
          queue.current.splice(0).forEach(post);
        }
        onEvent(msg);
      }}
    />
  );
});

export default MapView;
