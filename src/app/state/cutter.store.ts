import { Injectable } from '@angular/core';
import { createStore, distinctUntilArrayItemChanged, filterNil, select, setProp, withProps } from '@ngneat/elf';
import { addEntities, getActiveEntity, getAllEntities, getAllEntitiesApply, getEntity, getEntityByPredicate, selectActiveEntity, selectEntity, selectManyByPredicate, setActiveId, updateEntities, withActiveId, withEntities } from '@ngneat/elf-entities';
import { localStorageStrategy, persistState } from '@ngneat/elf-persist-state';
import { Vector2d } from 'konva/lib/types';
import { debounceTime, distinctUntilChanged, map, switchMap } from 'rxjs';
import { v4 as uuid } from 'uuid';
import { readFileList } from './cutter.store.helper';

// https://www.geodev.me/blog/deeppartial-in-typescript/
export type DeepPartial<T> = {
    [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export interface AppProps {
    bestNumber: number,
    showDropzone: boolean
}

export interface ImageProps {
    id: string,
    meta: ImageMeta
    file?: ImageFile
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

const testImage: ImageProps = {
    id: uuid(),
    meta: {
        name: 'testImage',
        active: true,
        date: new Date(),
        zoom: 1,
        scrollX: 0.5,
        scrollY: 0.5
    },
    cuts: []
}

const testImageTwo: ImageProps = {
    id: uuid(),
    meta: {
        name: 'testImageTwo',
        active: false,
        date: new Date(),
        zoom: 1,
        scrollX: 0.5,
        scrollY: 0.5
    },
    cuts: []
}

export interface CanvasProps {
    id: string,
    canvas: OffscreenCanvas
}


@Injectable({ providedIn: 'root' })
export class AppRepository {
    public store = createStore(
        { name: 'AppStore' },
        withEntities<ImageProps>(),
        withActiveId(),
        withProps<AppProps>({ bestNumber: 42, showDropzone: false }),
    );

    private restoredImageProps: ImageProps[] = []

    private preAppStoreInit = (value: AppProps & { activeId: any; } & { entities: Record<string, ImageProps>; ids: string[]; }) => {
        //console.log('preAppStoreInit', value)

        const ents: ImageProps[] = []

        value.ids.forEach(id => {
            const img = value.entities[id]
            //ents.push(img)        
            this.restoredImageProps.push(img)
        })

        const newState = { ...value }
        newState.showDropzone = false

        return newState
    }

    private persist = persistState(this.store, { key: 'Cutter', storage: localStorageStrategy, source: () => this.store.pipe(debounceTime(200)), preStoreInit: this.preAppStoreInit })

    public canvasStore = createStore(
        { name: 'CanvasStore' },
        withEntities<CanvasProps>()
    )

    app$ = this.store.pipe((state) => state)

    showDropzone$ = this.store.pipe(select((state) => state.showDropzone))

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

        this.addCanvasEntities(this.restoredImageProps)
        //this.store.update(addEntities([testImage, testImageTwo]))
    }

    public updateShowDropzone(val: boolean) {
        this.store.update(
            setProp('showDropzone', val)
        )
    }

    public updateZoom(id: string, val: number) {
        const img = this.store.query(getEntity(id));

        if (img) {
            let newImg: ImageProps = { ...img }
            newImg.meta.zoom = val

            this.store.update(updateEntities(id, (entity) => ({ ...newImg })))
        }
    }

    public updateScroll(id: string, scrollX: number, scrollY: number) {
        const img = this.store.query(getEntity(id));

        if (img) {
            let newImg: ImageProps = { ...img }
            newImg.meta.scrollX = scrollX
            newImg.meta.scrollY = scrollY

            this.store.update(updateEntities(id, (entity) => ({ ...newImg })))
        }
    }

    public setActiveImage(id: string) {
        this.store.update(setActiveId(id))
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
        if (!img.cuts || img.cuts.length < 1) {
            newImg.cuts = []
            const newCut: ImageCut = {
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
                    right: 0
                }
            }
            newImg.cuts?.push(newCut)
        }
        else {
            const newCut: ImageCut = {
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
                    right: 0
                }
            }
            newImg.cuts?.push(newCut)
        }

        this.store.update(updateEntities(id, (entity) => ({ ...newImg })))
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

        this.store.update(updateEntities(id, (entity) => ({ ...newImg })))
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

        this.store.update(updateEntities(id, (entity) => ({ ...newImg })))
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

    public selectCut(id: string, cut: ImageCut) {
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
        newImg.cuts = img.cuts.map(x => {
            let newCut: ImageCut = { ...x }
            newCut.selected = false
            return newCut
        })

        newImg.cuts[index].selected = true

        this.store.update(updateEntities(id, (entity) => ({ ...newImg })))
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
        const updates: CanvasProps[] = []

        for (let i = 0; i < imgData.length; i++) {
            const img = imgData[i]

            if (img.file) {
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

        this.store.update(updateEntities(id, (ent) => ({ ...newImg })))
    }

}