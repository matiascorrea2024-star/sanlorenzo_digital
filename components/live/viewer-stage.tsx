"use client";
import "@livekit/components-styles";
import { LiveKitRoom, RoomAudioRenderer, VideoTrack, useTracks } from "@livekit/components-react";
import { Track } from "livekit-client";
import { Radio } from "lucide-react";

function Escenario() {
  const tracks = useTracks([Track.Source.Camera]);
  const principal = tracks[0];
  if (!principal) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-white/40">
        <Radio className="h-8 w-8 animate-pulse" />
        <p className="text-sm">Esperando que arranque la transmisión...</p>
      </div>
    );
  }
  return <VideoTrack trackRef={principal} className="h-full w-full object-contain" />;
}

export default function ViewerStage({ token, url }: { token: string; url: string }) {
  return (
    <div className="aspect-video w-full overflow-hidden rounded-2xl border border-[var(--line)] bg-black">
      <LiveKitRoom
        token={token}
        serverUrl={url}
        video={false}
        audio={false}
        connect
        style={{ height: "100%" }}
        options={{ adaptiveStream: true, dynacast: true }}
      >
        <Escenario />
        <RoomAudioRenderer />
      </LiveKitRoom>
    </div>
  );
}
