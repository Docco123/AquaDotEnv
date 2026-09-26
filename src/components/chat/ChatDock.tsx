import { useState } from 'react';
import { Modal } from 'react-native';
import { useChat } from '@/hooks/useChat';
import type { UpstreamFacility, UpstreamTrace } from '@/types';
import { ChatLauncher } from './ChatLauncher';
import { ChatPanel } from './ChatPanel';

interface Props {
  trace: UpstreamTrace;
  facility: UpstreamFacility | null;
  /** Narrow viewport: the panel opens full-screen instead of floating over the map. */
  fullScreen: boolean;
}

/** Launcher + panel floating over the map. Mount inside the map container, only when a trace exists. */
export function ChatDock({ trace, facility, fullScreen }: Props) {
  const chat = useChat(trace, facility);
  // Keyed by trace so a new trace starts closed.
  const [openFor, setOpenFor] = useState<string | null>(null);
  const open = openFor === trace.generatedAt;

  const close = () => {
    chat.stop();
    setOpenFor(null);
  };
  const toggle = () => (open ? close() : setOpenFor(trace.generatedAt));

  const panel = <ChatPanel trace={trace} facility={facility} chat={chat} onClose={close} fullScreen={fullScreen} />;
  return (
    <>
      <ChatLauncher open={open} onPress={toggle} />
      {open &&
        (fullScreen ? (
          <Modal visible transparent animationType="none" onRequestClose={close}>
            {panel}
          </Modal>
        ) : (
          panel
        ))}
    </>
  );
}
