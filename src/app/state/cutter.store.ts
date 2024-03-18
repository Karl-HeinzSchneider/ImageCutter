import { Injectable } from '@angular/core';
import { createStore, distinctUntilArrayItemChanged, filterNil, select, setProp, withProps } from '@ngneat/elf';
import { addEntities, deleteEntities, getActiveEntity, getAllEntities, getAllEntitiesApply, getEntity, getEntityByPredicate, selectActiveEntity, selectEntity, selectManyByPredicate, setActiveId, updateEntities, withActiveId, withEntities } from '@ngneat/elf-entities';
import { localStorageStrategy, persistState } from '@ngneat/elf-persist-state';
import { Vector2d } from 'konva/lib/types';
import { debounceTime, distinctUntilChanged, map, switchMap } from 'rxjs';
import { v4 as uuid } from 'uuid';
import { readFileList } from './cutter.store.helper';
import localforage from 'localforage';
import { syncState } from 'elf-sync-state';
import { convertAbsoluteToRelative, convertRelativeToAbsolute } from './global.helper';

// https://www.geodev.me/blog/deeppartial-in-typescript/
export type DeepPartial<T> = {
    [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export interface AppProps {
    bestNumber: number,
    showDropzone: boolean,
    tool: tool
}

export interface ImageProps {
    id: string,
    meta: ImageMeta
    file: ImageFile
    cuts: ImageCut[]
}

export interface ImageMeta {
    name: string,
    active: boolean,
    date: Date,
    zoom: number,
    scrollX: number,
    scrollY: number
}

export interface ImageFile {
    lastModified: number,
    lastModifiedDate: Date,
    name: string,
    size: number,
    type: string,
    width: number,
    height: number
    dataURL: string
}

export interface ImageCut {
    id: string,
    name: string,
    visible: boolean,
    locked: boolean,
    selected: boolean,
    type: 'absolute' | 'relative',
    absolute: absoluteCut,
    relative: relativeCut
}

export interface absoluteCut {
    x: number,
    y: number,
    width: number,
    height: number
}

export interface relativeCut {
    top: number,
    bottom: number,
    left: number,
    right: number
}

export type tool = 'select' | 'marquee' | 'move' | 'cut';

export interface CanvasProps {
    id: string,
    canvas: OffscreenCanvas
}

// localforage config
localforage.config({
    driver: localforage.INDEXEDDB,
    name: 'ImageCutter',
    version: 1.0,
    storeName: 'AppStore'
})


@Injectable({ providedIn: 'root' })
export class AppRepository {
    public store = createStore(
        { name: 'AppStore' },
        withEntities<ImageProps>(),
        withActiveId(),
        withProps<AppProps>({ bestNumber: 42, showDropzone: false, tool: 'select' }),
    );

    private restoredImageProps: ImageProps[] = []

    private preAppStoreInit = (value: AppProps & { activeId: any; } & { entities: Record<string, ImageProps>; ids: string[]; }) => {
        console.log('preAppStoreInit', value)

        const ents: ImageProps[] = []

        value.ids.forEach(id => {
            const img = value.entities[id]
            ents.push(img)
            //this.restoredImageProps.push(img)
        })

        this.addCanvasEntities(ents)

        const newState = { ...value }
        newState.showDropzone = false

        return newState
    }

    private persist = persistState(this.store, { key: 'AppStore', storage: localforage, source: () => this.store.pipe(debounceTime(1000)), preStoreInit: this.preAppStoreInit })
    //private persist = persistState(this.store, { key: 'AppStore', storage: localStorageStrategy, source: () => this.store.pipe(debounceTime(200)), preStoreInit: this.preAppStoreInit })

    public canvasStore = createStore(
        { name: 'CanvasStore' },
        withEntities<CanvasProps>()
    )

    app$ = this.store.pipe((state) => state)

    showDropzone$ = this.store.pipe(select((state) => state.showDropzone));

    tool$ = this.store.pipe(select((state) => state.tool));

    active$ = this.store.pipe(selectActiveEntity())

    activeCanvas$ = this.active$.pipe(
        filterNil(),
        map(active => active.id),
        distinctUntilChanged(),
        switchMap(id => {
            const canvas$ = this.canvasStore.pipe(selectEntity(id))
            return canvas$
        }),
        filterNil()
    )

    activeFile$ = this.active$.pipe(
        map(active => {
            if (!active) {
                return undefined
            }

            return active.file
        }),
        distinctUntilChanged()
    );

    zoom$ = this.active$.pipe(
        map(active => {
            return active?.meta.zoom
        }),
        distinctUntilChanged()
    )

    scroll$ = this.active$.pipe(
        map(active => {
            let vect: Vector2d = { x: 0.5, y: 0.5 }
            if (!active) {
                return vect
            }

            else {
                vect.x = active.meta.scrollX
                vect.y = active.meta.scrollY

                return vect;
            }
        }),
        distinctUntilChanged((previous: Vector2d, current: Vector2d) => {
            if (previous.x === current.x && previous.y === current.y) {
                return true;
            }
            else {
                return false;
            }
        })
    )

    selectedCut$ = this.active$.pipe(
        map(active => {
            const cut = active?.cuts?.find(x => x.selected)
            return cut;
        }),
        distinctUntilChanged()
    )

    nonSelectedCuts$ = this.active$.pipe(
        map(active => {
            const cuts = active?.cuts.filter(x => !x.selected)
            return cuts || []
        }),
        distinctUntilArrayItemChanged()
    )


    imagesOpen$ = this.store.pipe(selectManyByPredicate((entity) => entity.meta.active))
    imagesClosed$ = this.store.pipe(selectManyByPredicate((entity) => !entity.meta.active))


    constructor() {
        console.log('AppRepo constructor')
        //syncState(this.store, { channel: 'AppStore' })

        //this.addCanvasEntities(this.restoredImageProps)
        //this.store.update(addEntities([testImage, testImageTwo]))       
    }

    public updateShowDropzone(val: boolean) {
        this.store.update(
            setProp('showDropzone', val)
        )
    }

    public updateTool(val: tool) {
        this.store.update(setProp('tool', val));
    }

    public updateZoom(id: string, val: number) {
        this.store.update(updateEntities(id, (entity) => ({ ...entity, meta: { ...entity.meta, zoom: val, date: new Date() } })))
    }

    public updateName(id: string, val: string) {
        this.store.update(updateEntities(id, (entity) => ({ ...entity, meta: { ...entity.meta, name: val, date: new Date() } })))
    }

    public updateScroll(id: string, scrollX: number, scrollY: number) {
        this.store.update(updateEntities(id, (entity) => ({ ...entity, meta: { ...entity.meta, scrollX: scrollX, scrollY: scrollY, date: new Date() } })))
    }

    public setActiveImage(id: string) {
        this.store.update(setActiveId(id))

        const img = this.store.query(getEntity(id));

        if (!img) {
            return;
        }

        this.store.update(updateEntities(id, (entity) => ({ ...entity, meta: { ...entity.meta, active: true, date: new Date() } })))
    }

    public getActiveEntity() {
        const img = this.store.query(getActiveEntity());
        return img;
    }

    public addNewCut(id: string) {
        const img = this.store.query(getEntity(id));

        if (!img) {
            return;
        }

        let newImg: ImageProps = { ...img }
        const size: Vector2d = { x: img.file.width, y: img.file.height };

        if (!img.cuts || img.cuts.length < 1) {
            newImg.cuts = []
            let newCut: ImageCut = {
                id: uuid(),
                name: 'Cut 1',
                visible: true,
                selected: true,
                locked: false,
                type: 'absolute',
                absolute: {
                    x: 0,
                    y: 0,
                    width: 32,
                    height: 32
                },
                relative: {
                    top: 0,
                    bottom: 1,
                    left: 0,
                    right: 1
                }
            }
            newCut.relative = convertAbsoluteToRelative(newCut.absolute, size)
            newImg.cuts.push(newCut)
        }
        else {
            let newCut: ImageCut = {
                id: uuid(),
                name: `Cut ${img.cuts.length + 1}`,
                visible: true,
                selected: false,
                locked: false,
                type: 'absolute',
                absolute: {
                    x: 0,
                    y: 0,
                    width: 32,
                    height: 32
                },
                relative: {
                    top: 0,
                    bottom: 1,
                    left: 0,
                    right: 1
                }
            }
            newCut.relative = convertAbsoluteToRelative(newCut.absolute, size)
            newImg.cuts.push(newCut)
        }

        this.store.update(updateEntities(id, (entity) => ({ ...newImg, meta: { ...newImg.meta, date: new Date() } })))
    }

    public duplicateCut(id: string, cutID: string) {
        const img = this.store.query(getEntity(id));

        if (!img || !img.cuts) {
            return;
        }

        const index = img.cuts.findIndex(x => x.id === cutID);

        if (index < 0) {
            return;
        }
        const oldCut = img.cuts[index];

        let newImg: ImageProps = JSON.parse(JSON.stringify(img));

        let newCut: ImageCut = JSON.parse(JSON.stringify(oldCut));

        newCut.id = uuid();
        newCut.name = newCut.name + '(2)';
        newCut.selected = false;

        newImg.cuts.push(newCut)

        this.store.update(updateEntities(id, (entity) => ({ ...newImg, meta: { ...newImg.meta, date: new Date() } })))
    }

    public removeCut(id: string, cutID: string) {
        const img = this.store.query(getEntity(id));

        if (!img || !img.cuts) {
            return;
        }

        const index = img.cuts.findIndex(x => x.id === cutID)

        if (index < 0) {
            return;
        }

        const oldCut = img.cuts[index]

        let newImg: ImageProps = { ...img }
        newImg.cuts = img.cuts.filter(x => x.id != cutID)

        if (newImg.cuts.length < 1) {

        }
        else if (oldCut.selected) {
            const nextIndex = Math.max(0, index - 1)
            newImg.cuts[nextIndex].selected = true
        }

        this.store.update(updateEntities(id, (entity) => ({ ...newImg, meta: { ...newImg.meta, date: new Date() } })))
    }

    public updateCut(id: string, cut: ImageCut) {
        const img = this.store.query(getEntity(id));

        if (!img || !img.cuts) {
            return;
        }

        const index = img.cuts.findIndex(x => x.id === cut.id)

        if (index < 0) {
            return;
        }

        const oldCut = img.cuts[index]

        let newImg: ImageProps = { ...img }

        let newCut: ImageCut = { ...cut }

        if (newCut.absolute) {
            //console.log('abs')
            const abs = newCut.absolute
            newCut.absolute.x = Number(abs.x)
            newCut.absolute.y = Number(abs.y)

            newCut.absolute.height = Number(abs.height)
            newCut.absolute.width = Number(abs.width)
        }

        newImg.cuts![index] = newCut

        if (oldCut.selected && !cut.selected) {
            const nextIndex = Math.max(0, index - 1)
            newImg.cuts![nextIndex].selected = true
        }

        this.store.update(updateEntities(id, (entity) => ({ ...newImg, meta: { ...newImg.meta, date: new Date() } })))
    }

    public updateSelectedCut(id: string, updates: DeepPartial<ImageCut>) {

    }
    // public updateSelectedCut(id: string, updates: DeepPartial<ImageCut>) {
    //     const img = this.store.query(getEntity(id));

    //     if (!img || !img.cuts) {
    //         return;
    //     }

    //     const index = img.cuts.findIndex(x => x.selected)

    //     if (index < 0) {
    //         return;
    //     }

    //     const oldCut = img.cuts[index]

    //     let newImg: ImageProps = { ...img }

    //     let newCut: ImageCut = { ...oldCut, ...updates }

    //     console.log('partialUpdate', oldCut, newCut)

    //     newImg.cuts![index] = newCut


    //     if (oldCut.selected && !newCut.selected) {
    //         const nextIndex = Math.max(0, index - 1)
    //         newImg.cuts![nextIndex].selected = true
    //     }

    //     this.store.update(updateEntities(id, (entity) => ({ ...newImg })))
    // }

    public selectCut(id: string, cut: ImageCut | undefined) {
        const img = this.store.query(getEntity(id));

        if (!img || !img.cuts) {
            return;
        }

        let newImg: ImageProps = { ...img }
        newImg.cuts = img.cuts.map(x => {
            let newCut: ImageCut = { ...x }
            newCut.selected = false
            return newCut
        })

        if (cut) {
            const index = img.cuts.findIndex(x => x.id === cut.id)

            if (index < 0) {
                return;
            }

            const oldCut = img.cuts[index]

            newImg.cuts[index].selected = true
        }
        else {
            // -> deselect all
        }

        this.store.update(updateEntities(id, (entity) => ({ ...newImg, meta: { ...newImg.meta, date: new Date() } })))
    }

    public zoomCut(id: string, cut: ImageCut | undefined) {
        const img = this.store.query(getEntity(id));

        if (!img || !img.cuts || !cut) {
            return;
        }

        const index = img.cuts.findIndex(x => x.id === cut.id)

        if (index < 0) {
            return;
        }

        const realCut = img.cuts[index]

        const cutHeight = realCut.absolute.height;
        const cutWidth = realCut.absolute.width;

        //console.log('cut:', cutHeight, cutWidth);

        let newImg: ImageProps = JSON.parse(JSON.stringify(img))

        const imgWidth = img.file.width;
        const imgHeight = img.file.height;

        // TODO: global get func
        const wHeight = window.innerHeight
        const wWidth = window.innerWidth

        const padding = 24
        // real canvas size
        const rHeight = wHeight - 32 - 48 - 32 - 32 - 2 * padding
        const rWidth = wWidth - 48 - 240 - 2 * padding

        //console.log('canvas:', rHeight, rWidth);


        // zoom
        const zoomPadding = 0.2;

        const zoomHeight = (1 - 2 * zoomPadding) * rHeight / cutHeight;
        const zoomWidth = (1 - 2 * zoomPadding) * rWidth / cutWidth;

        let zoomMin = Math.min(zoomHeight, zoomWidth)

        //console.log('zoomcalc:', zoomHeight, zoomWidth, zoomMin)


        // scroll
        //const scrollDelta = 31 // 2*padding - 17 (scrollWidth)
        const scrollWheel = 17;

        const scrollWidth = Math.floor(zoomMin * imgWidth + 2 * padding);
        const clientWidth = rWidth + 2 * padding - scrollWheel;

        const scrollLeft = realCut.absolute.x * zoomMin - (rWidth - zoomMin * (cutWidth)) / 2;
        let scrollX = scrollLeft / (scrollWidth - clientWidth);

        scrollX = Math.min(Math.max(scrollX, 0), 1)

        //console.log('scrollWidth/clientWidth', scrollWidth, clientWidth);

        const scrollHeight = Math.floor(zoomMin * imgHeight + 2 * padding);
        const clientHeight = rHeight + 2 * padding - scrollWheel;

        const scrollTop = realCut.absolute.y * zoomMin - (rHeight - zoomMin * (cutHeight)) / 2;
        let scrollY = scrollTop / (scrollHeight - clientHeight);

        scrollY = Math.min(Math.max(scrollY, 0), 1)

        //console.log('scrollcalc', scrollY, scrollX);


        newImg.meta.zoom = zoomMin;
        newImg.meta.scrollX = scrollX;
        newImg.meta.scrollY = scrollY;

        this.store.update(updateEntities(id, (entity) => ({ ...newImg, meta: { ...newImg.meta, date: new Date() } })))
    }

    // -----------------
    // File stuff
    public async openFileList(list: FileList) {
        //console.log(list)

        const files = await readFileList(list)

        if (files.length < 1) {
            return;
        }

        console.log(files)

        const updates: ImageProps[] = files.map(f => {
            let newProp: ImageProps = {
                id: uuid(),
                meta: {
                    name: f.name,
                    date: new Date(),
                    active: true,
                    zoom: 1,
                    scrollX: 0.5,
                    scrollY: 0.5
                },
                file: f,
                cuts: []
            }

            return newProp
        })

        this.store.update(addEntities(updates))

        // TODO: somehow entity add event
        await this.addCanvasEntities(updates)

        //const active = this.store.query(getActiveEntity());

        this.store.update(setActiveId(updates[0].id))
    }

    // Canvas Store
    private async addCanvasEntities(imgData: ImageProps[]) {
        //console.log('addCanvasEntites', imgData)
        const updates: CanvasProps[] = []

        for (let i = 0; i < imgData.length; i++) {
            const img = imgData[i]

            const canv = new OffscreenCanvas(img.file.width, img.file.height)
            const prop: CanvasProps = {
                id: img.id,
                canvas: canv
            }


            const blob = await fetch(img.file.dataURL).then((response) => response.blob())
            const imageBitmap = await createImageBitmap(blob)

            const ctx = canv.getContext('2d')
            //ctx?.transferFromImageBitmap(imageBitmap)
            ctx?.drawImage(imageBitmap, 0, 0)

            updates.push(prop)
        }

        this.canvasStore.update(addEntities(updates))
    }

    // 
    public closeImage(id: string) {
        const img = this.store.query(getEntity(id));

        if (!img || !img.meta.active) {
            //console.log('no img or already inactive')
            return;
        }

        const newImg: ImageProps = JSON.parse(JSON.stringify(img))
        newImg.meta.active = false;

        const images = this.store.query(getAllEntities()).filter(x => x.meta.active)
        const l = images.length
        const index = images.findIndex(x => x.id === id)

        const active = this.getActiveEntity()

        if (active && active.id === img.id) {
            // image to close is active 

            if (l > 1) {
                // other images exist
                const newActiveIndex = Math.max(0, index - 1)
                const newActive = images[newActiveIndex]
                this.setActiveImage(newActive.id)
            }
            else {
                this.setActiveImage('-1')
            }
        }

        this.store.update(updateEntities(id, (ent) => ({ ...newImg, meta: { ...newImg.meta, date: new Date() } })))
    }

    public openImage(id: string) {
        const img = this.store.query(getEntity(id));

        if (!img || img.meta.active) {
            //console.log('no img or already inactive')
            return;
        }

        const newImg: ImageProps = JSON.parse(JSON.stringify(img))
        newImg.meta.active = true;

        this.store.update(updateEntities(id, (ent) => ({ ...newImg, meta: { ...newImg.meta, date: new Date() } })))
    }

    public deleteImage(id: string) {
        const img = this.store.query(getEntity(id));

        if (!img) {
            return;
        }

        const active = this.getActiveEntity()

        if (active && active.id === id) {
            this.closeImage(id);
        }

        this.store.update(deleteEntities(id));
    }

    public duplicateImage(id: string) {
        const img = this.store.query(getEntity(id));

        if (!img) {
            return;
        }

        const newImg: ImageProps = JSON.parse(JSON.stringify(img))
        newImg.id = uuid();
        //newImg.meta.active = true;  
        newImg.meta.date = new Date();

        this.store.update(addEntities([newImg]));
        this.addCanvasEntities([newImg]);
    }
}