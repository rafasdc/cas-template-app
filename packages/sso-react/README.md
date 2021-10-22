# @bcgov-cas/sso-react

A node module to handle session expiry on the client-side.
This package is intended (but not limited to) to be used in conjunction with [@bcgov-cas/sso-express](https://www.npmjs.com/package/@bcgov-cas/sso-express)

### Components

#### SessionTimeoutHandler

A react component that displays a session expiry modal before the session expires.

Properties:
| Name | Type | default | Description |
| :-----| :-----| :--------| :------------|
|`modalDisplaySecondsBeforeLogout` | `number` | 120 | a |

extendSessionPath: string;
sessionRemainingTimePath: string;
logoutPath: string;

// Callback for when the session has expired
onSessionExpired: () => void;

// Session-expired effect will recheck the session
// if any of these values change.
// e.g. with Next.js, use [router] where router = useRouter()
resetOnChange: any[];

### Additional Examples
