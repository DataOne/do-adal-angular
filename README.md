# Data One Adal for Angular 5+
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
  tenant: 'contoso.onmicrosoft.com', // use 'common' for multi-tenant authentication
  clientId: 'b6a68585-5287-45b2-ba82-383ba1f60932' // App ID from Azure AD Registration
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
  headers = headers.set('Content-Type', 'application/json')
    .set('Authorization', 'Bearer ' + this.adalService.userInfo.token);
  return { headers };
}
```

### Information on configuration object
The config object required to initialize the adal service has several properties:  
* **tenant**: ID or domain name of the Aure AD tenant used for authentication. You can enable multi-tenant authentication using 'common'.  
* **clientId**: The application ID assigned to your app by Azure AD during registration. **Required.**  
* **instance**: The endpoint of the Azure AD instance for authentication requests. Defaults to 'https://login.microsoftonline.com/'. If you provide an onmicrosoft.de tenant, it changes automatically to login.microsoftonline.de.  
* **cacheLocation**: Location where tokens get cached. Defaults to 'sessionStorage'. Works in Internet Explorer with 'localStorage' only.  
* **endpoints**: Collection of URI and app ID (of the corresponding Azure app registration). You need to specify all endpoints of your APIs to support **CORS.** Example:  
``` typescript
endpoints: {  
    "https://my-web-api/projects":"b6a68585-5287-45b2-ba82-383ba1f60932",  
    "https://my-other-api/users":"e9a5a8b6-8af7-4719-9821-0deef255f68e"
  }
```
* **logoutUri**: Custom URI where the logout request needs to be made. Defaults to 'https://login.microsoftonline.com/'.  
* **extraQueryParameter**: Allows you to pass additional query string parameters in the authorization requests to Azure AD. For example, you can redirect to a consent page with `extraQueryParameter: 'prompt=admin_consent'`.

[View full documentation of config](https://github.com/AzureAD/azure-activedirectory-library-for-js/wiki/Config-authentication-context).

# Azure AD configuration
## App registration
Read here [how to register an app](https://docs.microsoft.com/en-us/azure/active-directory/develop/active-directory-devquickstarts-webapi-dotnet#step-1-register-an-application-with-azure-ad).  
Additionally you have to set **oauth2AllowImplicitFlow** in the manifest of the app registration to **true**.  

## Graph API and other services
If you want to use graph api or other api services you have to add them as required permissions. To permit them as admin, navigate to the same authorization url which is needed for login of the application, but with *&prompt=admin_consent* appended.  
*E.g.: https://login.microsoftonline.com/xyz.onmicrosoft.com/OAuth2/authorize?client_id=42...&prompt=admin_consent*

# Web API
To secure your own ASP.NET Web API with Adal, you can use [Owin](https://docs.microsoft.com/en-us/azure/active-directory/develop/active-directory-devquickstarts-webapi-dotnet#step-2-set-up-the-app-to-use-the-owin-authentication-pipeline). Notice that you can not use OpenID Connect.  

## Cors
To enable Cors you have to add the package *Microsoft.AspNet.WebApi.Cors* and insert `config.EnableCors();` in your *Register* method.  
Furthermore you need to add an attribute (like `[EnableCors("*", "*", "*")]`) to your controller.  
[Read more about enabling Cors at docs.microsoft.com](https://docs.microsoft.com/en-us/aspnet/web-api/overview/security/enabling-cross-origin-requests-in-web-api).

## Graph API

If you prefer to acquire the bearer token for Graph API in your Web API, you can use the following method. It needs a reference to *Microsoft.IdentityModel.Clients.ActiveDirectory* and *System.IdentityModel*

``` c#
private async Task<string> GetGraphTokenAsync()
{
    string accessToken = null;
    AuthenticationResult result = null;

    var clientId = CloudConfigurationManager.GetSetting("ida:Audience");
    ClientCredential clientCred = new ClientCredential(clientId, CloudConfigurationManager.GetSetting("ida:AppKey"));

    var bootstrapContext = ClaimsPrincipal.Current.Identities.First().BootstrapContext as System.IdentityModel.Tokens.BootstrapContext;
    
    string userName = ClaimsPrincipal.Current.FindFirst(ClaimTypes.Upn) != null ? ClaimsPrincipal.Current.FindFirst(ClaimTypes.Upn).Value : ClaimsPrincipal.Current.FindFirst(ClaimTypes.Email).Value;
    string userAccessToken = bootstrapContext.Token;
    UserAssertion userAssertion = new UserAssertion(userAccessToken, "urn:ietf:params:oauth:grant-type:jwt-bearer", userName);

    string authority = $"{CloudConfigurationManager.GetSetting("ida:AADInstance")}/{CloudConfigurationManager.GetSetting("ida:Tenant")}";
    string userId = ClaimsPrincipal.Current.FindFirst(ClaimTypes.NameIdentifier).Value;
    AuthenticationContext authContext = new AuthenticationContext(authority, TokenCache.DefaultShared);

    bool retry = false;
    int retryCount = 0;
    do
    {
        retry = false;
        try
        {
            result = await authContext.AcquireTokenAsync(CloudConfigurationManager.GetSetting("ida:GraphResourceId"), clientCred, userAssertion);
            accessToken = result.AccessToken;
        }
        catch (AdalException ex)
        {
            if (ex.ErrorCode == "temporarily_unavailable")
            {
                retry = true;
                retryCount++;
                Thread.Sleep(1000);
            }
        }
    } while ((retry == true) && (retryCount < 2));
    return accessToken;
}
```

In your *Startup.Auth.cs* it is important to add **SaveSigninToken = true**.

``` c#
public void ConfigureAuth(IAppBuilder app)
{
    app.UseWindowsAzureActiveDirectoryBearerAuthentication(
      new WindowsAzureActiveDirectoryBearerAuthenticationOptions
      {
          Tenant = CloudConfigurationManager.GetSetting("ida:Tenant"),
          TokenValidationParameters = 
          new System.IdentityModel.Tokens.TokenValidationParameters
          {
              ValidAudience = CloudConfigurationManager.GetSetting("ida:Audience"),
              ValidateIssuer = false,
              SaveSigninToken = true
          }
      });
}
```

### Values for settings  
* **ida:Audience**: Client ID of app registration. *E.g.: b6a68585-5287-45b2-ba82-383ba1f60932*
* **ida:AppKey**: Key which you can generate in the Azure Portal in the setting of your app registration. *E.g.: dYfh0H8iRU7FIBnPcYIil/Af6SSAwkxVhB0mA8DbzdQ=*  
* **ida:AADInstance**: Where to log in. *E.g.: https://login.microsoftonline.com*  
* **ida:Tenant**: Tenant name. *E.g.: contoso.onmicrosoft.com*