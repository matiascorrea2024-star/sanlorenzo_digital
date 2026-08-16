"use client";
import "@livekit/components-styles";
import { LiveKitRoom, VideoConference } from "@livekit/components-react";

export default function BroadcasterRoom({ token, url }: { token: string; url: string }) {
  return (
    <div className="h-[70vh] overflow-hidden rounded-2xl border border-white/10">
      <LiveKitRoom token={token} serverUrl={url} video audio connect data-lk-theme="default" style={{ height: "100%" }}>
        <VideoConference />
      </LiveKitRoom>
    </div>
  );
}
