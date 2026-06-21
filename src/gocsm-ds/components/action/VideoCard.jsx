import React, { useState } from "react";
import { Icon } from "../util/Icon.jsx";

/**
 * GoCSM VideoCard — a 16:9 walkthrough video. An inviting poster with a large play
 * button + title + duration; clicking plays the `src` inline when a real recording is
 * supplied, otherwise it's a clearly-playable poster slot ready for the walkthrough.
 * Maps to .video-card.
 */
export function VideoCard({ src, poster, title, duration, className = "", ...rest }) {
  const [playing, setPlaying] = useState(false);
  if (src && playing) {
    return (
      <div className={["video-card", "playing", className].filter(Boolean).join(" ")}>
        <video src={src} poster={poster} controls autoPlay />
      </div>
    );
  }
  return (
    <button
      type="button"
      className={["video-card", className].filter(Boolean).join(" ")}
      style={poster ? { backgroundImage: `url(${poster})` } : undefined}
      onClick={() => src && setPlaying(true)}
      aria-label={typeof title === "string" ? `Play: ${title}` : "Play walkthrough"}
      {...rest}
    >
      <span className="vc-play" aria-hidden><Icon name="play" /></span>
      <span className="vc-meta">
        {title ? <span className="vc-title">{title}</span> : null}
        {duration ? <span className="vc-duration">{duration}</span> : null}
      </span>
    </button>
  );
}
