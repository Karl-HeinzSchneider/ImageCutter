import { ImageFile } from "./cutter.store";

export async function readFileList(files: FileList) {
    //console.log('readFileList')
    //console.log(files)

    const imageFiles: ImageFile[] = []

    for (let i = 0; i < files.length; i++) {
        const file = files[i]

        if (!validFileType(file)) {
            continue;
        }

        let im: ImageFile = {
            lastModified: file.lastModified,
            lastModifiedDate: new Date(file.lastModified),
            name: file.name,
            size: file.size,
            type: file.type,
            width: 0,
            height: 0,
            dataURL: ''
        }

        const dataURL = await readFileAsDataUrl(file);
        im.dataURL = dataURL

        const blob = await fetch(dataURL).then((response) => response.blob())
        const imageBitmap = await createImageBitmap(blob)

        im.width = imageBitmap.width
        im.height = imageBitmap.height

        //console.log(file)
        //console.log(im)
        imageFiles.push(im)
    }

    return imageFiles
}

async function readFileAsDataUrl(file: File): Promise<string> {
    // console.log(file)
    let result = new Promise<string>((resolve) => {
        let reader = new FileReader()

        reader.onloadend = (e) => {
            const res: string = reader.result as string;
            resolve(res)
        }

        reader.readAsDataURL(file)
    })

    return result
}


// https://developer.mozilla.org/en-US/docs/Web/Media/Formats/Image_types
const fileTypes = [
    "image/apng",
    "image/bmp",
    "image/gif",
    "image/jpeg",
    "image/pjpeg",
    "image/png",
    "image/svg+xml",
    "image/tiff",
    "image/webp",
    "image/x-icon",
];

function validFileType(file: File) {
    return fileTypes.includes(file.type);
}