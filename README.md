# do-adal-angular
Wrapper for Azure Active Directory Authentication Library to support Angular (> v5)

# Installation
`npm i do-adal-angular`

## Setup

* Provide in module:  
``` typescript
import { AppComponent } from './app.component';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { DoAdalHttpService, DoAdalService} from 'do-adal-angular';

@NgModule({
  ...,
  imports: [
    BrowserModule,
    HttpClientModule
  ],
  providers: [
    DoAdalService,
    { provide: DoAdalHttpService, useFactory: DoAdalHttpService.factory, deps: [HttpClient, DoAdalService] }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
```

* Inject and initialize *DoAdalService* in App Component:
``` typescript
const config = {
  tenant: 'xyz.onmicrosoft.com',
  clientId: '[App ID from Azure AD Registration]'
}

constructor(private adalService: DoAdalService) {
  this.adalService.init(config);
}
```

* To handle authentication and to acquire token for graph api (if needed):
``` typescript
ngOnInit(){
  try {
    this.adalService.handleWindowCallback();
  }
  catch {}

  if (!this.adalService.userInfo.authenticated) {
    this.adalService.login();
  }
  else {
    this.adalService.acquireToken("https://graph.microsoft.com").subscribe(token => {
      // you can use graph token now
      // it is also stored in adalService.getCachedToken("https://graph.microsoft.com")
    });
  }
}
```

The username is stored in `adalService.userInfo.username`. You can log the user out with `adalService.logOut()`.

## Usage
To make authenticated web requests, use the *DoAdalHttpService*. It provides methods for GET, POST, PUT, DELETE, PATCH and HEAD. Example:  
``` typescript
constructor(private httpService: DoAdalHttpService) { }

public getAll() {
  return this.httpService
    .get(API_URL + '/all', this.prepareOptions())
    .map(response => { });
}

private prepareOptions():any {
  let headers = new HttpHeaders();
  headers = headers.set('Content-Type', 'application/json');
  return { headers };
}
```

# Azure AD configuration
## App registration
Read here [how to register an app](https://docs.microsoft.com/en-us/azure/active-directory/develop/active-directory-devquickstarts-webapi-dotnet#step-1-register-an-application-with-azure-ad).  
Additionally you have to set **oauth2AllowImplicitFlow** in the manifest of the app registration to **true**.  

## Graph API and other services
If you want to use graph api or other api services you have to add them as required permissions. To permit them as admin, navigate to the same authorization url which is needed for login of the application, but with *&prompt=admin_consent* appended.  
*E.g.: https:// login.microsoftonline.com/xyz.onmicrosoft.com/OAuth2/authorize?client_id=42...&prompt=admin_consent*

# Web API
To secure your own ASP.NET Web API with Adal, you can use [Owin](https://docs.microsoft.com/en-us/azure/active-directory/develop/active-directory-devquickstarts-webapi-dotnet#step-2-set-up-the-app-to-use-the-owin-authentication-pipeline). Notice that you can not use OpenID Connect.
