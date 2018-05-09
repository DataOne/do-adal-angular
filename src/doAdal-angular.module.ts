import { DoAdalInterceptor } from './doAdal-interceptor';
import { DoAdalUser } from './doAdal-user';
import { DoAdalService } from './doAdal.service';
import { DoAdalHttpService } from './doAdal-http.service';
import { NgModule } from '@angular/core';
import { HTTP_INTERCEPTORS } from '@angular/common/http';

@NgModule({
    imports: [
    ],
    exports: [
        DoAdalUser, DoAdalService, DoAdalHttpService, DoAdalInterceptor
    ],
    providers: [,
        {
            provide: HTTP_INTERCEPTORS,
            useClass: DoAdalInterceptor,
            multi: true
        },
    ],
})
export class DoAdalAngularModule { }