import { Injectable } from '@angular/core';
import { createStore, select, setProp, withProps } from '@ngneat/elf';
import { addEntities, getActiveEntity, selectActiveEntity, selectManyByPredicate, setActiveId, withActiveId, withEntities } from '@ngneat/elf-entities';
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
}

export interface ImageMeta {
    name: string,
    active: boolean,
    date: Date
}

export interface ImageFile {
    lastModified: number,
    lastModifiedDate: Date,
    name: string,
    size: number,
    type: string,
    dataURL: string
}

const testImage: ImageProps = {
    id: uuid(),
    meta: {
        name: 'testImage',
        active: true,
        date: new Date()
    }
}

const testImageTwo: ImageProps = {
    id: uuid(),
    meta: {
        name: 'testImageTwo',
        active: false,
        date: new Date()
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

    public setActiveImage(id: string) {
        this.store.update(setActiveId(id))
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
                    active: true
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