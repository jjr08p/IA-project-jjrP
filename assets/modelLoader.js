export async function loadTMImageModel(basePath) {
  if (!window.tmImage) throw new Error('tmImage no disponible')
  const modelURL = `${basePath}/model.json`
  const metadataURL = `${basePath}/metadata.json`
  const model = await window.tmImage.load(modelURL, metadataURL)
  const labels = model.getClassLabels ? await model.getClassLabels() : (model?.metadata?.labels ?? [])
  return { model, labels }
}

export async function loadTMAudioModel(basePath) {
  if (!window.tmAudio) throw new Error('tmAudio no disponible')
  const modelURL = `${basePath}/model.json`
  const metadataURL = `${basePath}/metadata.json`
  const model = await window.tmAudio.load(modelURL, metadataURL)
  const labels = model.getClassLabels ? await model.getClassLabels() : (model?.metadata?.labels ?? [])
  return { model, labels }
}

export async function loadTMPoseModel(basePath) {
  if (!window.tmPose) throw new Error('tmPose no disponible')
  const modelURL = `${basePath}/model.json`
  const metadataURL = `${basePath}/metadata.json`
  const model = await window.tmPose.load(modelURL, metadataURL)
  const labels = model.getClassLabels ? await model.getClassLabels() : (model?.metadata?.labels ?? [])
  return { model, labels }
}
