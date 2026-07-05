import { bootstrapApplication } from '@angular/platform-browser';

import { provideHttpClient, withXsrfConfiguration } from '@angular/common/http';

import { AppComponent } from './app/app.component';



bootstrapApplication(AppComponent, {

    providers: [

        provideHttpClient(

            // Configure CSRF token if needed

            withXsrfConfiguration({

                cookieName: 'XSRF-TOKEN',

                headerName: 'X-XSRF-TOKEN'

            })

        )

    ]

}).catch(err => console.error(err));