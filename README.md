<p align="center">
  <img alt="CloudFlare" src="https://user-images.githubusercontent.com/621906/78959170-7e548800-7ac0-11ea-8baa-5c425cdc35e2.png">
</p>



![serverless](http://public.serverless.com/badges/v3.svg)
[![npm
version](https://badge.fury.io/js/serverless-cloudflare-dns.svg)](https://badge.fury.io/js/serverless-cloudflare-dns)
[![npm downloads](https://img.shields.io/npm/dt/serverless-cloudflare-dns.svg?style=flat)](https://www.npmjs.com/package/serverless-cloudflare-dns)




## Installation
```bash
npm i -E serverless-cloudflare-dns
```
## Features
```yaml
- Auth with api token.
- Auth with email and key.

- Record Content Resolver. (useful for CloudFront)

- Create record on 'serverless deploy'.
- Remove record on 'serverless remove'.
- Command Line Support for c.r.u.d. operations.
```
## Usage
```yaml
plugins:
  - serverless-cloudflare-dns

custom:
  cloudflare:
    disabled: false                   # Optional, disabled this plugin
    domain: ""                        # Required, your.corp.domain

    auth:
      # Option 1
      # email: ""                     # Required, use aws ssm or something like that
      # key: ""                       # Required, use aws ssm or something like that

      # Option 2
      # apiToken: ""                  # Required, use aws ssm or something like that

    record:
      name: ""                        # Required, subdomain.your.corp.domain

      content: "miapp.com"            # Required, domain.to.redirect
      content: "#{cf:SomeOutput}"     # CloudFormation Output Key.

      type: ""                        # Optional, default = CNAME
      proxied: ""                     # Optional, default = true
      proxiable: ""                   # Optional, default = true
```


## Command Line support
```bash
$ sls cloudflare --help
$ sls cloudflare record deploy
$ sls cloudflare record update
$ sls cloudflare record remove
$ sls cloudflare record list
$ sls cloudflare record list -A
```


## Flow
```yaml
DEPLOY: 
- if record does not exists => Create Record()
- if old cname content not equals to current  => Update Record()
- if record exists => show message(): CF_RECORD_EXISTENT

UPDATE:
- if record exists => Update Record()
- else => show message(): CF_RECORD_NOT_FOUND

REMOVE:
- if record exists => Remove Record()
- else => show message(): CF_RECORD_NOT_FOUND
```
