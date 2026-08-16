"use client";
import "@livekit/components-styles";
import { LiveKitRoom, VideoConference } from "@livekit/components-react";
import { VideoPresets } from "livekit-client";

// Calidad alta a propósito -- esto es para mostrar productos con
// detalle real (no una videollamada), así que priorizamos nitidez
// sobre ahorro de datos. Simulcast + adaptiveStream hacen que cada
// espectador reciba la mejor calidad que su conexión banque, sin
// que el negocio tenga que preocuparse por eso.
export default function BroadcasterRoom({ token, url }: { token: string; url: string }) {
  return (
    <div className="h-[70vh] overflow-hidden rounded-2xl border border-white/10">
      <LiveKitRoom
        token={token}
        serverUrl={url}
        video={{ resolution: VideoPresets.h1080.resolution }}
        audio={{ echoCancellation: true, noiseSuppression: true, autoGainControl: true }}
        connect
        data-lk-theme="default"
        style={{ height: "100%" }}
        options={{
          adaptiveStream: true,
          dynacast: true,
          publishDefaults: {
            videoEncoding: VideoPresets.h1080.encoding,
            simulcast: true,
            videoSimulcastLayers: [VideoPresets.h540, VideoPresets.h216],
          },
        }}
      >
        <VideoConference />
      </LiveKitRoom>
    </div>
  );
}
