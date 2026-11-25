// Cut: scrubbing previews for heavy video (4K, high bitrate, 10-bit 4:2:2 camera files).
// Seeking such a file takes 300-500 ms per frame in the player (there is no hardware decoder for
// 4:2:2 H.264 on Apple Silicon M1), so dragging on the timeline showed only a few frames. While the
// file is open, FFmpeg decodes just its keyframes, small (360p), in the background, 20 s at a time;
// while the user drags, the nearest keyframe before the cursor is shown at once over the video,
// and the exact frame appears when the drag ends.
import { useEffect, useRef, useState } from 'react';

import type { FFprobeStream } from '../../../common/ffprobe';
import { decodeText, safeCreateBlob } from '../util';

const { ffmpeg } = window.require('@electron/remote').require('./index.js');

const chunkSec = 20;

// Only where native seeking is slow enough to need it
export function needsScrubPreview(videoStream: FFprobeStream | undefined, formatBitRate: string | undefined) {
  if (videoStream?.width == null || videoStream.height == null) return false;
  const pixels = videoStream.width * videoStream.height;
  const bitRate = Number(videoStream.bit_rate ?? formatBitRate ?? 0);
  return pixels >= 2560 * 1440 || bitRate >= 50e6;
}

// Splits concatenated JPEGs (mjpeg image2pipe) at their start/end markers
function splitJpegs(buf: Uint8Array) {
  const out: Uint8Array[] = [];
  let start = -1;
  for (let i = 0; i < buf.length - 1; i += 1) {
    if (start < 0 && buf[i] === 0xFF && buf[i + 1] === 0xD8) start = i;
    else if (start >= 0 && buf[i] === 0xFF && buf[i + 1] === 0xD9) {
      out.push(buf.subarray(start, i + 2));
      start = -1;
      i += 1;
    }
  }
  return out;
}

export interface ScrubFrame { time: number, url: string }

export default function useScrubPreview({ filePath, videoStreamIndex, duration, enabled }: {
  filePath: string | undefined,
  videoStreamIndex: number | undefined,
  duration: number | undefined,
  enabled: boolean,
}) {
  // sorted by time
  const framesRef = useRef<ScrubFrame[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    framesRef.current = [];
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setReady(false);
    if (!enabled || filePath == null || videoStreamIndex == null || duration == null || !(duration > 0)) return undefined;

    const abortController = new AbortController();
    const urls: string[] = [];
    (async () => {
      for (let from = 0; from < duration && !abortController.signal.aborted; from += chunkSec) {
        const args = [
          '-hide_banner', '-nostats',
          // slice threads: with -skip_frame, FFmpeg's frame threads make keyframe-only decoding 4x slower
          '-thread_type', 'slice',
          '-skip_frame', 'nokey',
          '-ss', String(from), '-to', String(Math.min(duration, from + chunkSec)),
          '-copyts',
          '-i', filePath,
          '-map', `0:${videoStreamIndex}`,
          '-an', '-sn', '-dn',
          '-fps_mode', 'passthrough',
          '-vf', 'scale=-2:360,showinfo',
          '-f', 'image2pipe', '-c:v', 'mjpeg', '-q:v', '5',
          '-',
        ];
        try {
          // eslint-disable-next-line no-await-in-loop
          const { stdout, stderr } = await ffmpeg.runFfmpeg(args, { cancelSignal: abortController.signal }, { logCli: false });
          if (abortController.signal.aborted) break;
          const times = decodeText(stderr).matchAll(/pts_time:\s*([\d.]+)/g).map((m) => Number(m[1])).toArray();
          const jpegs = splitJpegs(stdout);
          if (times.length !== jpegs.length) {
            console.warn('Scrub preview: frame count mismatch', times.length, jpegs.length);
          }
          const n = Math.min(times.length, jpegs.length);
          const newFrames: ScrubFrame[] = [];
          for (let i = 0; i < n; i += 1) {
            const time = times[i]!;
            // -ss snaps back to the previous keyframe, which the previous chunk already has
            if (time < from - 0.001 && from !== 0) continue;
            const url = URL.createObjectURL(safeCreateBlob(jpegs[i]!, { type: 'image/jpeg' }));
            urls.push(url);
            newFrames.push({ time, url });
          }
          framesRef.current = [...framesRef.current, ...newFrames].toSorted((a, b) => a.time - b.time);
          setReady(framesRef.current.length > 0);
        } catch (err) {
          if (abortController.signal.aborted) break;
          console.warn('Scrub preview failed', err);
          break;
        }
      }
    })();

    return () => {
      abortController.abort();
      framesRef.current = [];
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [duration, enabled, filePath, videoStreamIndex]);

  // the last keyframe at or before `time` (binary search)
  const getFrameAt = (time: number) => {
    const frames = framesRef.current;
    if (frames.length === 0) return undefined;
    let lo = 0;
    let hi = frames.length - 1;
    while (lo < hi) {
      const mid = Math.ceil((lo + hi) / 2);
      if (frames[mid]!.time <= time) lo = mid;
      else hi = mid - 1;
    }
    return frames[lo];
  };

  return { ready, getFrameAt };
}
