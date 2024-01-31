/// <reference lib="webworker" />
import { ImageCutResult } from "../components/exporter/exporter.component";
import { ImageCut, ImageProps } from "../state/cutter.store";

/* 
addEventListener('message', async (event) => {

})

 */


addEventListener('message', async (event) => {
  //console.log(event, event.data);

  const canvas = new OffscreenCanvas(100, 100);
  const offCanvas = new OffscreenCanvas(100, 100);

  const reader = new FileReaderSync()

  const img: ImageProps = event.data.active;
  const cuts: ImageCut[] = event.data.cuts;

  console.log('process...', cuts.length, 'cut(s),', img)

  // setup offCanvas with complete image
  const blob = await fetch(img.file!.dataURL).then((response) => response.blob())
  const imageBitmap = await createImageBitmap(blob)
  offCanvas.width = imageBitmap.width;
  offCanvas.height = imageBitmap.height;
  offCanvas.getContext('2d')!.drawImage(imageBitmap, 0, 0)


  let results: ImageCutResult[] = []

  for (let i = 0; i < cuts.length; i++) {
    const cut = cuts[i]

    if (cut.type === 'absolute') {
      const abs = cut.absolute

      const w = abs.width;
      const h = abs.height;
      const dx = abs.x;
      const dy = abs.y;

      canvas.width = w;
      canvas.height = h;

      const ctx = canvas.getContext('2d');
      ctx?.clearRect(0, 0, w, h);
      ctx?.drawImage(offCanvas, dx, dy, w, h, 0, 0, w, h);

      const blob = await canvas.convertToBlob({ type: 'image/png' })
      const dataURL = reader.readAsDataURL(blob);

      results.push({
        dataURL: dataURL,
        fileType: 'image/png',
        cut: cut
      })
    }
    else if (cut.type === 'relative') {

    }
  }

  if (results.length > 0) {
    postMessage({
      img: img,
      result: results
    })
  }

  //canvas.getContext('2d')?.drawImage(active.file!.dataURL,0,0)

})

