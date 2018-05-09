import * as adalLib from 'adal-angular';
// import { adal } from 'adal-angular';
import { DoAdalUser } from './doAdal-user';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Rx';

import User = adal.User;

/**
 *
 *
 * @export
 * @class DoAdalService
 */
@Injectable()
export class DoAdalService {

  /**
   *
   *
   * @private
   * @type {adal.AuthenticationContext}
   * @memberOf DoAdalService
   */
  private adalContext: adal.AuthenticationContext;

  /**
   *
   *
   * @private
   * @type {DoAdalUser}
   * @memberOf DoAdalService
   */
  private adalUser: DoAdalUser = {
    authenticated: false,
    username: '',
    error: '',
    token: '',
    profile: {}
  };

  /**
   * Creates an instance of DoAdalService.
   *
   * @memberOf DoAdalService
   */
  constructor() { }

  /**
   *
   *
   * @param {any} configOptions // any instead of adal.Config
   *
   * @memberOf DoAdalService
   */
  public init(configOptions: any) { // any instead of adal.Config
    if (!configOptions) {
      throw new Error('You must set config, when calling init.');
    }

    // redirect and logout_redirect are set to current location by default
    const existingHash = window.location.hash;

    let pathDefault = window.location.href;
    if (existingHash) {
      pathDefault = pathDefault.replace(existingHash, '');
    }

    configOptions.redirectUri = configOptions.redirectUri || pathDefault;
    configOptions.postLogoutRedirectUri = configOptions.postLogoutRedirectUri || pathDefault;

    // create instance with given config
    this.adalContext = adalLib.inject(configOptions);

    window.AuthenticationContext = this.adalContext.constructor;

    // loginresource is used to set authenticated status
    this.updateDataFromCache(this.adalContext.config.loginResource);
  }

  /**
   *
   *
   * @readonly
   * @type {any} // any instead of adal.Config
   * @memberOf DoAdalService
   */
  public get config(): any { // any instead of adal.Config
    return this.adalContext.config;
  }

  /**
   *
   *
   * @readonly
   * @type {DoAdalUser}
   * @memberOf DoAdalService
   */
  public get userInfo(): DoAdalUser {
    return this.adalUser;
  }

  /**
   *
   *
   *
   * @memberOf DoAdalService
   */
  public login(): void {
    this.adalContext.login();
  }

  /**
   *
   *
   * @returns {boolean}
   *
   * @memberOf DoAdalService
   */
  public loginInProgress(): boolean {
    return this.adalContext.loginInProgress();
  }

  /**
   *
   *
   *
   * @memberOf DoAdalService
   */
  public logOut(): void {
    this.adalContext.logOut();
  }

  /**
   *
   *
   *
   * @memberOf DoAdalService
   */
  public handleWindowCallback(): void {
    const hash = window.location.hash;
    if (this.adalContext.isCallback(hash)) {
      const requestInfo = this.adalContext.getRequestInfo(hash);
      this.adalContext.saveTokenFromHash(requestInfo);
      if (requestInfo.requestType === this.adalContext.REQUEST_TYPE.LOGIN) {
        this.updateDataFromCache(this.adalContext.config.loginResource);

      } else if (requestInfo.requestType === this.adalContext.REQUEST_TYPE.RENEW_TOKEN) {
        this.adalContext.callback = window.parent.callBackMappedToRenewStates[requestInfo.stateResponse];
      }

      if (requestInfo.stateMatch) {
        if (typeof this.adalContext.callback === 'function') {
          if (requestInfo.requestType === this.adalContext.REQUEST_TYPE.RENEW_TOKEN) {
            // Idtoken or Accestoken can be renewed
            if (requestInfo.parameters['access_token']) {
              this.adalContext.callback(this.adalContext._getItem(this.adalContext.CONSTANTS.STORAGE.ERROR_DESCRIPTION)
                , requestInfo.parameters['access_token']);
            } else if (requestInfo.parameters['error']) {
              this.adalContext.callback(this.adalContext._getItem(this.adalContext.CONSTANTS.STORAGE.ERROR_DESCRIPTION), null);
              this.adalContext._renewFailed = true;
            }
          }
        }
      }
    }

    // Remove hash from url
    if (window.location.hash) {
      window.location.href = window.location.href.replace(window.location.hash, '');
    }
  }

  /**
   *
   *
   * @param {string} resource
   * @returns {string}
   *
   * @memberOf DoAdalService
   */
  public getCachedToken(resource: string): string {
    return this.adalContext.getCachedToken(resource);
  }

  /**
   *
   *
   * @param {string} resource
   * @returns
   *
   * @memberOf DoAdalService
   */
  public acquireToken(resource: string) {
    const _this = this;   // save outer this for inner function

    let errorMessage: string;
    return Observable.bindCallback(acquireTokenInternal, function (token: string) {
      if (!token && errorMessage) {
        throw (errorMessage);
      }
      return token;
    })();

    function acquireTokenInternal(cb: any) {
      let s: string = null;

      _this.adalContext.acquireToken(resource, (error: string, tokenOut: string) => {
        if (error) {
          _this.adalContext.error('Error when acquiring token for resource: ' + resource, error);
          errorMessage = error;
          cb(<string>null);
        } else {
          cb(tokenOut);
          s = tokenOut;
        }
      });
      return s;
    }
  }

  /**
   *
   *
   * @returns {Observable<adal.User>}
   *
   * @memberOf DoAdalService
   */
  public getUser(): Observable<any> {
    return Observable.bindCallback((cb: (u: adal.User) => User) => {
      this.adalContext.getUser(function (error: string, user: adal.User) {
        if (error) {
          this.adalContext.error('Error when getting user', error);
          cb(null);
        } else {
          cb(user);
        }
      });
    })();
  }

  /**
   *
   *
   *
   * @memberOf DoAdalService
   */
  public clearCache(): void {
    this.adalContext.clearCache();
  }

  /**
   *
   *
   * @param {string} resource
   *
   * @memberOf DoAdalService
   */
  public clearCacheForResource(resource: string): void {
    this.adalContext.clearCacheForResource(resource);
  }

  /**
   *
   *
   * @param {string} message
   *
   * @memberOf DoAdalService
   */
  public info(message: string): void {
    this.adalContext.info(message);
  }

  /**
   *
   *
   * @param {string} message
   *
   * @memberOf DoAdalService
   */
  public verbose(message: string): void {
    this.adalContext.verbose(message);
  }

  /**
   *
   *
   * @param {string} url
   * @returns {string}
   *
   * @memberOf DoAdalService
   */
  public GetResourceForEndpoint(url: string): string {
    return this.adalContext.getResourceForEndpoint(url);
  }

  /**
   *
   *
   *
   * @memberOf DoAdalService
   */
  public refreshDataFromCache() {
    this.updateDataFromCache(this.adalContext.config.loginResource);
  }

  /**
   *
   *
   * @private
   * @param {string} resource
   *
   * @memberOf DoAdalService
   */
  private updateDataFromCache(resource: string): void {
    const token = this.adalContext.getCachedToken(resource);
    this.adalUser.authenticated = token !== null && token.length > 0;
    const user = this.adalContext.getCachedUser() || { userName: '', profile: undefined };
    if (user) {
      this.adalUser.username = user.userName;
      this.adalUser.profile = user.profile;
      this.adalUser.token = token;
      this.adalUser.error = this.adalContext.getLoginError();
    } else {
      this.adalUser.username = '';
      this.adalUser.profile = {};
      this.adalUser.token = '';
      this.adalUser.error = '';
    }
  };
}
