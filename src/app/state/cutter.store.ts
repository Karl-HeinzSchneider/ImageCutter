import { Injectable } from '@angular/core';
import { createStore, select, setProp, withProps } from '@ngneat/elf';
import { addEntities, selectActiveEntity, selectManyByPredicate, withActiveId, withEntities } from '@ngneat/elf-entities';
import { v4 as uuid } from 'uuid';
import { readFileList } from './cutter.store.helper';


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

    app$ = this.store.pipe((state) => state)

    showDropzone$ = this.store.pipe(select((state) => state.showDropzone))

    active$ = this.store.pipe(selectActiveEntity())

    imagesOpen$ = this.store.pipe(selectManyByPredicate((entity) => entity.meta.active))
    imagesClosed$ = this.store.pipe(selectManyByPredicate((entity) => !entity.meta.active))


    constructor() {
        console.log('AppRepo constructor')

        this.store.update(addEntities([testImage, testImageTwo]))
    }

    public updateShowDropzone(val: boolean) {
        this.store.update(
            setProp('showDropzone', val)
        )
    }
    // -----------------
    // File stuff
    public async openFileList(list: FileList) {
        //console.log(list)

        const files = await readFileList(list)
        console.log(files)
    }

}