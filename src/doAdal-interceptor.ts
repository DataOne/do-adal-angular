import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor } from '@angular/common/http';
import { Observable } from 'rxjs/Rx';
import { DoAdalService } from './doAdal.service';

@Injectable()
export class DoAdalInterceptor implements HttpInterceptor {
    constructor(public adalService: DoAdalService) { }
    intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {

        request = request.clone({
            setHeaders: {
                Authorization: `Bearer ${this.adalService.userInfo.token}`
            }
        });
        return next.handle(request);
    }
}
