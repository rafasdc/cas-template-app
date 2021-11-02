# @bcgov-cas/sso-react

A node module to handle session expiry on the client-side.
This package is intended (but not limited to) to be used in conjunction with [@bcgov-cas/sso-express](https://www.npmjs.com/package/@bcgov-cas/sso-express)

### Components

#### SessionRefresher

A react component that automatically refreshes the session when certain events are fired. Includes throttling logic to avoid

- Properties:

| Name          | Type       | default                              | Description                           |
| :------------ | :--------- | :----------------------------------- | :------------------------------------ |
| refreshUrl    | `string`   | `"/extend-session"`                  | Session refresh endpoint              |
| throttledTime | `number`   | 300000 (5 min)                       | Session refresh minimum interval      |
| refreshEvents | `string[]` | `["keydown", "mousedown", "scroll"]` | Events that trigger a session refresh |

- Example: Refresh session on keydown, at most once every 10 minutes

```tsx
function App() {
  return (
    <div>
      <SessionRefresher
        refreshUrl="/extend-session"
        throttledTime={600000}
        refreshEvents={["keydown"]}
      />
      <p>... My page content ...</p>
    </div>
  );
}
```

<br><br>

#### SessionTimeoutHandler

A react component that displays a session expiry modal before the session expires, and automatically re-syncs with the server when needed.

- Properties:

| Name                              | Type                      | default                                   | Description                                                                         |
| :-------------------------------- | :------------------------ | :---------------------------------------- | :---------------------------------------------------------------------------------- |
| `modalDisplaySecondsBeforeLogout` | `number`                  | 120                                       | How many seconds before session expires should the modal be displayed.              |
| `extendSessionPath`               | `string`                  | `/extend-session`                         | The server endpoint to extend the session.                                          |
| `sessionRemainingTimePath`        | `string`                  | `/session-idle-remaining-time`            | The server endpoint to query for session remaining time.                            |
| `logoutPath`                      | `string`                  | `/logout`                                 | The server endpoint to logout.                                                      |
| `onSessionExpired`                | `function: () => void`    | `() => {}`                                | The function to call once the session has expired (e.g. a redirect to a login page) |
| `resetOnChange`                   | `any[]`                   | `[]` (on component mount)                 | Optional array of items to watch, to trigger refetch of the session remaining time. |
| `renderModal`                     | `function (props) => JSX` | [LogoutWarningModal](#logoutwarningmodal) | An override function for the default modal dialog box.                              |

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

| Name                     | Type         | Description                                                                                   |
| :----------------------- | :----------- | :-------------------------------------------------------------------------------------------- |
| `inactivityDelaySeconds` | `number`     | The (fixed) number of seconds left in the session, under which the modal should be displayed. |
| `expiresOn`              | `number`     | The UNIX epoch at which the session expires                                                   |
| `onExtendSession`        | `() => void` | The function called when the "extend sesison" button is clicked                               |
| `logoutPath`             | `string`     | The server endpoint to logout                                                                 |
| `remainingSeconds`       | `number`     | The (counting down) number of seconds remaining in the session                                |

<br><br>

### Example

A example of usage, using a NextJS router to redirect the user to the login page when the session has expired, and a session refresher to refresh the session when the user interacts with the page.

```tsx
import { useRouter } from "next/router";
import { SessionTimeoutHandler } from "@bcgov/sso-react";

function App() {
  const router = useRouter();

  return (
    <div>
      <SessionTimeoutHandler
        modalDisplaySecondsBeforeLogout={120}
        extendSessionPath="/extend-session"
        sessionRemainingTimePath="/session-idle-remaining-time"
        logoutPath="/logout"
        onSessionExpired={() => {
          router.push({
            pathname: "/login",
            sessionIdled: true,
          });
        }}
        resetOnChange={[router]}
      />
      <SessionRefresher refreshUrl="/session-idle-remaining-time" />
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
