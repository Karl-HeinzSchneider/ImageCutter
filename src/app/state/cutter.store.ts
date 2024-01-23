import { Injectable } from '@angular/core';
import { createStore, select, setProp, withProps } from '@ngneat/elf';
import { addEntities, getActiveEntity, getEntity, selectActiveEntity, selectManyByPredicate, setActiveId, updateEntities, withActiveId, withEntities } from '@ngneat/elf-entities';
import { v4 as uuid } from 'uuid';
import { readFileList } from './cutter.store.helper';
import { localStorageStrategy, persistState } from '@ngneat/elf-persist-state';


export interface AppProps {
    bestNumber: number,
    showDropzone: boolean
}

export interface ImageProps {
    id: string,
    meta: ImageMeta
    file?: ImageFile
    cuts?: ImageCut[]
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
    absolute?: absoluteCut,
    relative?: relativeCut
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
    }
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
    }
}


@Injectable({ providedIn: 'root' })
export class AppRepository {
    public store = createStore(
        { name: 'AppStore' },
        withEntities<ImageProps>(),
        withActiveId(),
        withProps<AppProps>({ bestNumber: 42, showDropzone: false }),
    );

    private persist = persistState(this.store, { key: 'Cutter', storage: localStorageStrategy })

    app$ = this.store.pipe((state) => state)

    showDropzone$ = this.store.pipe(select((state) => state.showDropzone))

    active$ = this.store.pipe(selectActiveEntity())

    imagesOpen$ = this.store.pipe(selectManyByPredicate((entity) => entity.meta.active))
    imagesClosed$ = this.store.pipe(selectManyByPredicate((entity) => !entity.meta.active))


    constructor() {
        console.log('AppRepo constructor')

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

        if (oldCut.selected) {
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

        newImg.cuts![index] = cut

        if (oldCut.selected && !cut.selected) {
            const nextIndex = Math.max(0, index - 1)
            newImg.cuts![nextIndex].selected = true
        }

        this.store.update(updateEntities(id, (entity) => ({ ...newImg })))
    }

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
                file: f
            }

            return newProp
        })

        this.store.update(addEntities(updates))

        //const active = this.store.query(getActiveEntity());

        this.store.update(setActiveId(updates[0].id))
    }

}