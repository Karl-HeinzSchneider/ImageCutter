import { APP_INITIALIZER, ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { devTools } from '@ngneat/elf-devtools';

import { routes } from './app.routes';

function init(): void {
  console.log('Init devTools')
  devTools()
}

export const appConfig: ApplicationConfig = {
  providers: [provideRouter(routes), { provide: APP_INITIALIZER, useFactory: () => init() }]
};
