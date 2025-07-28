import {ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection} from '@angular/core';
import {provideRouter} from '@angular/router';
import {initializeApp, provideFirebaseApp} from '@angular/fire/app';
import {getFirestore, provideFirestore} from '@angular/fire/firestore';
import {getAuth, provideAuth} from '@angular/fire/auth';
import {routes} from './app.routes';
import {environment} from '../environments/environment';
import {provideHttpClient} from '@angular/common/http';
import {DATE_PIPE_DEFAULT_OPTIONS} from '@angular/common';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({eventCoalescing: true}),
    provideRouter(routes),
    provideHttpClient(),
    provideFirebaseApp(() => initializeApp(environment.firebaseConfig)),
    provideAuth(() => getAuth()),
    provideFirestore(() => getFirestore()),
    provideBrowserGlobalErrorListeners(),
    {
      provide: DATE_PIPE_DEFAULT_OPTIONS,
      useValue: {dateFormat: 'dd MMM yyyy'}
    }
  ]
};
