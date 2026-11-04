# Third-party: ffmpeg.wasm (used only by the video converter)

Videos the browser can't play natively (AVI, WMV, FLV, HEVC/H.265, ...) are converted to WebM
locally with ffmpeg.wasm. Nothing is uploaded.

| File | Package | License |
|---|---|---|
| `esm/*.js` | [@ffmpeg/ffmpeg](https://github.com/ffmpegwasm/ffmpeg.wasm) 0.12.15 | MIT |
| `ffmpeg-core.js`, `ffmpeg-core.wasm` | [@ffmpeg/core](https://github.com/ffmpegwasm/ffmpeg.wasm) 0.12.10 | **GPL-2.0-or-later** (FFmpeg built with GPL components such as x264/x265) |

Source code for @ffmpeg/core and FFmpeg: https://github.com/ffmpegwasm/ffmpeg.wasm and https://ffmpeg.org/download.html

**Note for commercial/closed-source distribution:** the core is GPL. It runs as a separate program
in a Web Worker and is only invoked for conversion, but you should get legal advice before
distributing it in a paid product. To remove it: delete this folder; the extension still plays
every natively supported format and simply reports unsupported ones.
