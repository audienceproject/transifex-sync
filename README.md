transifex-sync
==============

Sync resources with transifex

### Setup

Environment variables

 * `$TRANSIFEX_TOKEN` [Transifex API token]
 * `$TRANSIFEX_SYNC_BB_USER` and `$TRANSIFEX_SYNC_BB_PASSWORD`
   [Bitbucket app password]

[Transifex API token]: https://docs.transifex.com/api/introduction#authentication
[Bitbucket app password]: https://confluence.atlassian.com/bitbucket/app-passwords-828781300.html

`$TRANSIFEX_SYNC_CONFIG` environment variable sets configuration file path. By default`.transifex-sync.yaml` value is used.

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
    upload-source:
      - step:
          image: audienceproject/transifex-sync
          script:
            - transifex-sync upload-sources
    download-translations:
      - step:
          image: audienceproject/transifex-sync
          script:
            - transifex-sync download-translations commit-bitbucket
  branches:
    translation:
      - step:
          image: audienceproject/transifex-sync
          script:
            - transifex-sync upload-sources
```
