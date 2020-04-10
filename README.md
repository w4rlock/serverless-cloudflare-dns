<p align="center">
  <img alt="CloudFlare" src="https://user-images.githubusercontent.com/621906/78959170-7e548800-7ac0-11ea-8baa-5c425cdc35e2.png">
</p>



![serverless](http://public.serverless.com/badges/v3.svg)
[![npm
version](https://badge.fury.io/js/serverless-cloudflare-dns.svg)](https://badge.fury.io/js/serverless-cloudflare-dns)




## Installation
```bash
npm i -E serverless-cloudflare-dns
```

## Usage

```yaml
plugins:
  - serverless-cloudflare-dns

custom:
  cloudflare:
    disabled: false               # Optional: disabled this plugin
    domain: ""                    # Required: your.corp.domain

    auth:
      email: ""                   # Required: use aws ssm or something like that
      token: ""                   # Required: use aws ssm or something like that

    record:
      name: ""                    # Required: subdomain.your.corp.domain
      content: ""                 # Required: domain.to.redirect
      type: ""                    # Optional: default = CNAME
      proxied: ""                 # Optional: default = true
      proxiable: ""               # Optional: default = true
```


## Command Line support
```bash
$ sls cloudflare record deploy
$ sls cloudflare record update
$ sls cloudflare record remove
$ sls cloudflare record list
$ sls cloudflare record list --all
```
