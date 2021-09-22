# CAS App Template

A skeleton app that uses the Climate Action Secretariat tech stack

```bash
cd generator-cas-app && yarn && cd ..
yarn global add yo
yo generator-cas-app
```

## Utilities

This repository contains various utilities that can be reused:

- An openshift-compatible nginx image, for handling SSL termination in front of various web servers
