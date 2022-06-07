# CAS App Template

A skeleton app that uses the Climate Action Secretariat tech stack

![Lifecycle:Experimental](https://img.shields.io/badge/Lifecycle-Experimental-339999)


```bash
cd generator-cas-app && yarn && cd ..
yarn global add yo
yo generator-cas-app
```

## Utilities

This repository contains various utilities that can be reused:

### Automatic certificate generation and reverse-proxy to handle the SSL termination

- An openshift-compatible nginx image, for handling SSL termination in front of various web servers
- A helm chart that contains PVCs and cron-jobs for the acme challenge, as well as a config map for nginx.
