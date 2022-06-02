# @bcgov-cas/sso-react

A node module to handle session expiry on the client-side.
This package is intended (but not limited to) to be used in conjunction with [@bcgov-cas/sso-express](https://www.npmjs.com/package/@bcgov-cas/sso-express)

### Components

#### SessionRefresher

A react effect that automatically executes a callback when certain events are fired. Includes throttling logic to avoid
excessive callback invocations.

`throttledTime` and `refreshEvents` parameters are optional, and use a default value if not provided.

- Properties:

| Name          | Type       | default                              | Description                                 |
| :------------ | :--------- | :----------------------------------- | :------------------------------------------ |
| callback      | callable   |                                      | Callback to execute on the specified events |
| throttledTime | `number`   | 300000 (5 min)                       | Default throttling interval, in ms          |
| refreshEvents | `string[]` | `["keydown", "mousedown", "scroll"]` | Events that trigger a call                  |

- Example: Refresh session on keydown, at most once every 10 minutes

```tsx
function App() {
  const myCallback = async () => {
    await fetch("/refresh-session");
  };

  React.useEffect(
    throttleEventsEffect(myCallback, 10 * 60 * 1000, ["keydown"]),
    []
  );

  return (
    <div>
      <p>... My page content ...</p>
    </div>
  );
}
```

<br><br>

#### SessionTimeoutHandler

A react component that displays a session expiry modal before the session expires, and automatically re-syncs with the server when needed.

_This component should only be rendered if the user is currently logged in, otherwise the modal will be displayed immediately_

- Properties:

| Name                              | Type                                                        | default                                                                              | Description                                                                         |
| :-------------------------------- | :---------------------------------------------------------- | :----------------------------------------------------------------------------------- | :---------------------------------------------------------------------------------- |
| `modalDisplaySecondsBeforeLogout` | `number`                                                    | 120                                                                                  | How many seconds before session expires should the modal be displayed.              |
| `sessionRemainingTimePath`        | `string`                                                    | `/session-idle-remaining-time`                                                       | The server endpoint to query for session remaining time.                            |
| `logoutPath`                      | `string`                                                    | `/logout`                                                                            | The server endpoint to logout.                                                      |
| `onSessionExpired`                | `function: () => void`                                      | `() => {}`                                                                           | The function to call once the session has expired (e.g. a redirect to a login page) |
| `resetOnChange`                   | `any[]`                                                     | `[]` (on component mount)                                                            | Optional array of items to watch, to trigger refetch of the session remaining time. |
| `renderModal`                     | `function (props) => JSX`                                   | [LogoutWarningModal](#logoutwarningmodal)                                            | An override function for the default modal dialog box.                              |
| `extendSessionOnEvents`           | `{enabled: boolean, throttleTime:number, events: string[]}` | `{enabled: false, throttleTime: 300000, events: ["keydown", "mousedown", "scroll"]}` | Whether to extend the session on certain events, and what events to extend on.      |

- Props object passed to the override dialog box (see [LogoutWarningModal](#logoutwarningmodal) for more details).
  The `remainingSeconds` property will be updated every second.

```typescript
interface WarningModalProps {
  inactivityDelaySeconds: number;
  expiresOn: number;
  onExtendSession: () => void;
  logoutPath: string;
  remainingSeconds: number;
}
```

<br><br>

#### LogoutWarningModal

A session expired warning modal that displays a countdown until the session expires.
Rendering can be overridden by setting the `renderModal` property.

The `renderModal` function will be passed the following props - from the `LogoutWarningModal` component itself.:

| Name               | Type         | Description                                                     |
| :----------------- | :----------- | :-------------------------------------------------------------- |
| `expiresOn`        | `number`     | The UNIX epoch at which the session expires                     |
| `onExtendSession`  | `() => void` | The function called when the "extend session" button is clicked |
| `logoutPath`       | `string`     | The server endpoint to logout                                   |
| `remainingSeconds` | `number`     | The (counting down) number of seconds remaining in the session  |

<br><br>

### Example

A example of usage, using a NextJS router to redirect the user to the login page when the session has expired, and a session refresher to refresh the session when the user interacts with the page.

```tsx
import { useRouter } from "next/router";
import { SessionTimeoutHandler, throttleEventsEffect } from "@bcgov/sso-react";

function App() {
  const router = useRouter();

  return (
    <div>
      <SessionTimeoutHandler
        modalDisplaySecondsBeforeLogout={120}
        sessionRemainingTimePath="/session-idle-remaining-time"
        logoutPath="/logout"
        onSessionExpired={() => {
          router.push({
            pathname: "/login",
            sessionIdled: true,
          });
        }}
        resetOnChange={[router]}
        extendSessionOnEvents={{
          enabled: true,
          throttleTime: 60000,
          events: ["keydown", "scroll"],
        }}
      />
      <p>... My page content ...</p>
    </div>
  );
}
```

<br><br>

### Additional Examples (doesn't require React)

To integrate with the [@bcgov-cas/sso-express](https://www.npmjs.com/package/@bcgov-cas/sso-express) package, the following implementations of login, logout and register buttons can be used:

- Login (assuming the default '/login' endpoint is used):

```html
<form action="/login" method="post">
  <button type="submit">Log in</button>
</form>
```

- Logout:

```html
<form action="/logout" method="post">
  <button type="submit" className="btn btn-secondary">Logout</button>
</form>
```

- Register:

```html
<a href="/register">Register</a>
```
