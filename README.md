### How to trigger a release build:
`git tag v1.0.8 && git push --tags`

### How to setup Mac Apple Store signing:

- Need to set the following GitHub actions secret values:
```
APPLE_API_ISSUER 
APPLE_API_KEY
APPLE_API_KEY_ID
MAC_CERTS
MAC_CERTS_PASSWORD
PROVISIONING_PROFILE_BASE64
```
- Usefull links:
    - https://github.com/marketplace/actions/electron-builder-action
    - https://samuelmeuli.com/blog/2019-12-28-notarizing-your-electron-app/
    - https://mifi.no/blog/automated-electron-build-with-release-to-mac-app-store-microsoft-store-snapcraft/
