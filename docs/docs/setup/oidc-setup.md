# Open ID Connect Setup
<span style="color:red;">:octicons-heart-fill-24: Pro only</span>

## Preparation in Azure AD
1. Open [Microsoft Entra Admin Center](https://entra.microsoft.com)
2. Select Applications -> App registrations -> New registration
3. In following menu: 

    - enter a Name for your reference (1)
    - select the types of accounts who are allowed to login (2) - this is the first option "Sigle tenant" in most cases
    - enter the redirect url of your application in the following format: https://your.url/login/oidc/azure/callback (3)
    - select type "Web" for redirect url (4)

    ![Register application menu](/images/oidc_1_register.png)

4. In the newly created "App registration", go to the Token configuration submenu and add the following *optional* claim:
    - TokenType: ID
    - Claims: auth_time, login_hint
    ![Register application menu](/images/oidc_2_claims.png)


5. Next go to the "Certificates & Secrets" submenu and add a new client secret with 24 months validity (this is the maximum) and any description.
6. Copy the value of the newly created secret and store it for later use.
7. Finally go to the "Overview" submenu and copy the values *Application (client) ID* and *Directory (tenant) ID*.

You should now have the following values:

* client id
* client secret
* azure tendant id


## Cloud Setup
:octicons-cloud-24: Cloud

You are lucky. Just send the values from the previous steps to us and we'll take care :smiling_face_with_3_hearts:


## Self-Hosted Setup
:octicons-server-24: Self-Hosted

The values from the previous steps need to be passed as environment variables to the SysReptor docker container.
You can add them to `<sysreptor-repository>/deploy/app.env`:
```env
OIDC_AZURE_TENANT_ID=<azure tenant id>
OIDC_AZURE_CLIENT_ID=<azure client id>
OIDC_AZURE_CLIENT_SECRET=<azure client secret>
```

The OIDC client needs to be able to establish a network connection to Azure AD.
Make sure to not block outgoing traffic.

Then restart the docker container for the changes to take effect.
