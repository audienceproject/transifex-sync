transifex-sync
==============

Sync resources with transifex

### Setup

Environment variables

 * `$TRANSIFEX_TOKEN` [Transifex API token]
 * `$TRANSIFEX_SYNC_BB_PASSWORD` use bitbucket [app password]
 * `$TRANSIFEX_SYNC_BB_USER` username who created app password
 * `$TRANSIFEX_SYNC_BB_BRANCH` translation branch,
   defaults to `translation`
 * `$TRANSIFEX_SYNC_CONFIG` configuration file,
   defaults to `.transifex-sync.yaml`.

[Transifex API token]: https://docs.transifex.com/api/introduction#authentication
[Bitbucket app password]: https://confluence.atlassian.com/bitbucket/app-passwords-828781300.html

Configuration example:

```yaml
targets:
  - # 'source' strings file location
    source: packages/login-form/messages.yaml
    # translation file template
    translation: packages/login-form/messages.{code}.yaml
    # location of transifex resource
    location:
      project: myproject
      resource: mywebsite
      # transifex JSONKEYVALUE resource key
      key: login-form
```

### Usage

Bitbucket pipelines configuration example:

```yaml
pipelines:
  custom:
    transifex-sync:
      - step:
          image: audienceproject/transifex-sync
          script:
            - transifex-sync
  branches:
    translation:
      - step:
          image: audienceproject/transifex-sync
          script:
            - transifex-sync
```
