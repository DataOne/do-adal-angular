import { Observable } from 'rxjs/Rx';
import { DoAdalService } from './doAdal.service';
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';

/**
 *
 *
 * @export
 * @class DoAdalHttpService
 */
@Injectable()
export class DoAdalHttpService {

  /**
   *
   *
   * @static
   * @param {HttpClient} http
   * @param {DoAdalService} service
   *
   * @memberOf DoAdalHttpService
   */
  static factory(http: HttpClient, service: DoAdalService) {
    return new DoAdalHttpService(http, service);
  }

  /**
   * Creates an instance of DoAdalHttpService.
   * @param {HttpClient} http
   * @param {DoAdalService} service
   *
   * @memberOf DoAdalHttpService
   */
  constructor(
    private http: HttpClient,
    private service: DoAdalService
  ) { }

  /**
   *
   *
   * @param {string} url
   * @param {*} [options]
   * @returns {Observable<any>}
   *
   * @memberOf DoAdalHttpService
   */
  get(url: string, options: {
    body?: any;
    headers?: HttpHeaders;
    reportProgress?: boolean;
    observe: 'response';
    params?: HttpParams | { [param: string]: string | string[]; };
    responseType?: 'json';
    withCredentials?: boolean;
  }): Observable<any> {
    return this.sendRequest('get', url, options);
  }

  /**
   *
   *
   * @param {string} url
   * @param {*} body
   * @param {*} [options]
   * @returns {Observable<any>}
   *
   * @memberOf DoAdalHttpService
   */
  post(url: string, body: any, options: {
    body?: any;
    headers?: HttpHeaders;
    reportProgress?: boolean;
    observe: 'response';
    params?: HttpParams | { [param: string]: string | string[]; };
    responseType?: 'json';
    withCredentials?: boolean;
  }): Observable<any> {
    options.body = body;
    return this.sendRequest('post', url, options);
  }

  /**
   *
   *
   * @param {string} url
   * @param {*} [options]
   * @returns {Observable<any>}
   *
   * @memberOf DoAdalHttpService
   */
  delete(url: string, options: {
    body?: any;
    headers?: HttpHeaders;
    reportProgress?: boolean;
    observe: 'response';
    params?: HttpParams | { [param: string]: string | string[]; };
    responseType?: 'json';
    withCredentials?: boolean;
  }): Observable<any> {
    return this.sendRequest('delete', url, options);
  }

  /**
   *
   *
   * @param {string} url
   * @param {*} body
   * @param {*} [options]
   * @returns {Observable<any>}
   *
   * @memberOf DoAdalHttpService
   */
  patch(url: string, body: any, options: {
    body?: any;
    headers?: HttpHeaders;
    reportProgress?: boolean;
    observe: 'response';
    params?: HttpParams | { [param: string]: string | string[]; };
    responseType?: 'json';
    withCredentials?: boolean;
  }): Observable<any> {
    options.body = body;
    return this.sendRequest('patch', url, options);
  }

  /**
   *
   *
   * @param {string} url
   * @param {*} body
   * @param {*} [options]
   * @returns {Observable<any>}
   *
   * @memberOf DoAdalHttpService
   */
  put(url: string, body: any, options: {
    body?: any;
    headers?: HttpHeaders;
    reportProgress?: boolean;
    observe: 'response';
    params?: HttpParams | { [param: string]: string | string[]; };
    responseType?: 'json';
    withCredentials?: boolean;
  }): Observable<any> {
    options.body = body;
    return this.sendRequest('put', url, options);
  }

  /**
   *
   *
   * @param {string} url
   * @param {*} [options]
   * @returns {Observable<any>}
   *
   * @memberOf DoAdalHttpService
   */
  head(url: string, options: {
    body?: any;
    headers?: HttpHeaders;
    reportProgress?: boolean;
    observe: 'response';
    params?: HttpParams | { [param: string]: string | string[]; };
    responseType?: 'json';
    withCredentials?: boolean;
  }): Observable<any> {
    return this.sendRequest('head', url, options);
  }

  /**
   *
   *
   * @private
   * @param {string} method
   * @param {string} url
   * @param {RequestOptionsArgs} options
   * @returns {Observable<string>}
   *
   * @memberOf DoAdalHttpService
   */
  private sendRequest(method: string, url: string, options: {
    body?: any;
    headers?: HttpHeaders;
    reportProgress?: boolean;
    observe: 'response';
    params?: HttpParams | { [param: string]: string | string[]; };
    responseType?: 'json';
    withCredentials?: boolean;
  }): Observable<string> {

    let resource = this.service.GetResourceForEndpoint(url);
    if (url.indexOf('localhost') > -1) {
      resource = this.service.config.loginResource;
    }
    let authenticatedCall: Observable<string>;
    if (resource) {
      if (this.service.userInfo.authenticated) {
        authenticatedCall = this.service.acquireToken(resource)
          .flatMap((token: string) => {
            if (options.headers == null) {
              options.headers = new HttpHeaders();
            }
            options.headers = options.headers.set('Authorization', 'Bearer ' + token);
            return this.http.request(method, url, options)
              .catch(this.handleError);
          });
      } else {
        authenticatedCall = Observable.throw(new Error('User Not Authenticated.'));
      }
    } else {
      authenticatedCall = this.http.request(method, url, options).catch(this.handleError);
    }

    return authenticatedCall;
  }

  /**
   *
   *
   * @private
   * @param {*} error
   * @returns
   *
   * @memberOf DoAdalHttpService
   */
  private handleError(error: any) {
    // In a real world app, we might send the error to remote logging infrastructure
    const errMsg = error.message || 'Server error';
    console.error(JSON.stringify(error)); // log to console instead

    return Observable.throw(error);
  }
}
