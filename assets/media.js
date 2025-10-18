export async function getCamera(constraints={ video: { width: 640, height: 480 }, audio: false }) {
  try {
    const stream = await navigator.mediaDevices.getUserMedia(constraints)
    return { stream, error: null }
  } catch (e) {
    return { stream: null, error: e }
  }
}

export function stopStream(stream) {
  if (!stream) return
  for (const track of stream.getTracks()) track.stop()
}
