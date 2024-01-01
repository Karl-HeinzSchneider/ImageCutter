import { Injectable } from '@angular/core';
import { createStore, withProps } from '@ngneat/elf';
import { addEntities, selectActiveEntity, selectManyByPredicate, withActiveId, withEntities } from '@ngneat/elf-entities';
import { v4 as uuid } from 'uuid';


export interface AppProps {
    bestNumber: number
}

export interface ImageProps {
    id: string,
    meta: ImageMeta
}

export interface ImageMeta {
    name: string,
    active: boolean,
    date: Date
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
        withProps<AppProps>({ bestNumber: 42 }),
    );

    app$ = this.store.pipe((state) => state)

    active$ = this.store.pipe(selectActiveEntity())

    imagesOpen$ = this.store.pipe(selectManyByPredicate((entity) => entity.meta.active))
    imagesClosed$ = this.store.pipe(selectManyByPredicate((entity) => !entity.meta.active))


    constructor() {
        console.log('AppRepo constructor')

        this.store.update(addEntities([testImage, testImageTwo]))
    }
}