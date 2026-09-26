import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { MAP_HTML } from './mapHtml';
import type { MapCommand, MapEvent, MapHandle, MapProps } from './protocol';

/** Web: the Leaflet page lives in a sandboxed iframe; we talk over postMessage. */
const MapView = forwardRef<MapHandle, MapProps>(function MapView({ onEvent }, ref) {
  const frame = useRef<HTMLIFrameElement>(null);
  const ready = useRef(false);
  const queue = useRef<MapCommand[]>([]);
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  const post = (cmd: MapCommand) => frame.current?.contentWindow?.postMessage(JSON.stringify(cmd), '*');

  useImperativeHandle(ref, () => ({
    send(cmd) {
      if (ready.current) post(cmd);
      else queue.current.push(cmd);
    },
  }));

  useEffect(() => {
    const listener = (e: MessageEvent) => {
      if (e.source !== frame.current?.contentWindow) return;
      let msg: MapEvent;
      try {
        msg = JSON.parse(e.data);
      } catch {
        return;
      }
      if (msg.type === 'ready') {
        ready.current = true;
        queue.current.splice(0).forEach(post);
      }
      onEventRef.current(msg);
    };
    window.addEventListener('message', listener);
    return () => window.removeEventListener('message', listener);
  }, []);

  return (
    <iframe
      ref={frame}
      srcDoc={MAP_HTML}
      title="Watershed map"
      sandbox="allow-scripts"
      style={{ border: 0, width: '100%', height: '100%', display: 'block' }}
    />
  );
});

export default MapView;
