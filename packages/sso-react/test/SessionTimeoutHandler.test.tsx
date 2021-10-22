import SessionTimeoutHandler from "../src/SessionTimeoutHandler";
import { mount } from "enzyme";
import React from "react";
import { act } from "react-dom/test-utils";

const existingFetch = global.fetch;

afterEach(() => {
  global.fetch = existingFetch;
  jest.useRealTimers();
  jest.clearAllMocks();
});

const setupFetchMock = (timeoutValue, response_override = {}) => {
  const fetchMock = jest.fn();
  fetchMock.mockImplementation(() => ({
    ok: true,
    json: async () => timeoutValue,
    ...response_override,
  }));

  global.fetch = fetchMock;
  return fetchMock;
};

describe("The Session Timeout Handler", () => {
  it("Shows the modal if there is less time left in the session than the delay", async () => {
    const secondsLeftInSession = 15;
    const displayDelayBeforeLogout = 30;

    jest.useFakeTimers();
    setupFetchMock(secondsLeftInSession);

    let componentUnderTest;
    await act(async () => {
      componentUnderTest = mount(
        <div>
          <SessionTimeoutHandler
            modalDisplaySecondsBeforeLogout={displayDelayBeforeLogout}
            extendSessionPath="extend"
            logoutPath="logout"
            sessionRemainingTimePath="remaining"
            onSessionExpired={() => {}}
            resetOnChange={[{}]}
          />
        </div>
      );
    });

    await componentUnderTest.update();

    expect(componentUnderTest).toMatchSnapshot();
    expect(componentUnderTest.find("div.pg-modal-container")).toHaveLength(1);
  });

  it("renders the modal with the render function provided", async () => {
    const secondsLeftInSession = 15;
    const displayDelayBeforeLogout = 30;

    jest.useFakeTimers();
    setupFetchMock(secondsLeftInSession);

    let componentUnderTest;
    await act(async () => {
      componentUnderTest = mount(
        <div>
          <SessionTimeoutHandler
            modalDisplaySecondsBeforeLogout={displayDelayBeforeLogout}
            extendSessionPath="extend"
            logoutPath="logout"
            sessionRemainingTimePath="remaining"
            onSessionExpired={() => {}}
            resetOnChange={[{}]}
            renderModal={({ remainingSeconds }) => (
              <div>Session will expire in {remainingSeconds} seconds</div>
            )}
          />
        </div>
      );
    });

    await componentUnderTest.update();

    expect(componentUnderTest).toMatchSnapshot();
  });

  it("Hides the modal if there is more time left in the session than the delay", async () => {
    const secondsLeftInSession = 45;
    const displayDelayBeforeLogout = 30;

    jest.useFakeTimers();
    setupFetchMock(secondsLeftInSession);

    let componentUnderTest;
    await act(async () => {
      componentUnderTest = mount(
        <div>
          <SessionTimeoutHandler
            modalDisplaySecondsBeforeLogout={displayDelayBeforeLogout}
            extendSessionPath="extend"
            logoutPath="logout"
            sessionRemainingTimePath="remaining"
            onSessionExpired={() => {}}
            resetOnChange={[{}]}
          />
        </div>
      );
    });

    await componentUnderTest.update();

    expect(componentUnderTest.find("div.pg-modal-container").length).toBe(0);
  });

  it("Calls the onSessionExpired function if the session is expired", async () => {
    const mockExpiredCallback = jest.fn();

    const secondsLeftInSession = 0;
    const displayDelayBeforeLogout = 30;

    jest.useFakeTimers();
    setupFetchMock(secondsLeftInSession);

    let componentUnderTest;
    await act(async () => {
      componentUnderTest = mount(
        <div>
          <SessionTimeoutHandler
            modalDisplaySecondsBeforeLogout={displayDelayBeforeLogout}
            extendSessionPath="extend"
            logoutPath="logout"
            sessionRemainingTimePath="remaining"
            onSessionExpired={mockExpiredCallback}
            resetOnChange={[{}]}
          />
        </div>
      );
    });

    await componentUnderTest.update();

    expect(mockExpiredCallback).toHaveBeenCalledOnce();
  });

  it("Calls the onSessionExpired function if the server replies with not ok", async () => {
    const mockExpiredCallback = jest.fn();

    const secondsLeftInSession = 0;
    const displayDelayBeforeLogout = 30;

    const fetchMock = setupFetchMock(secondsLeftInSession, { ok: false });

    let componentUnderTest;
    await act(async () => {
      componentUnderTest = mount(
        <div>
          <SessionTimeoutHandler
            modalDisplaySecondsBeforeLogout={displayDelayBeforeLogout}
            extendSessionPath="extend"
            logoutPath="logout"
            sessionRemainingTimePath="remaining"
            onSessionExpired={mockExpiredCallback}
            resetOnChange={[{}]}
          />
        </div>
      );
    });

    await componentUnderTest.update();

    expect(fetchMock).toHaveBeenCalledWith("remaining");
    expect(mockExpiredCallback).toHaveBeenCalledOnce();
  });

  it("Calls the extendSessionPath endpoint when the user clicks the extend button", async () => {
    const secondsLeftInSession = 15;
    const displayDelayBeforeLogout = 30;

    jest.useFakeTimers();
    setupFetchMock(secondsLeftInSession);

    let componentUnderTest;
    await act(async () => {
      componentUnderTest = mount(
        <div>
          <SessionTimeoutHandler
            modalDisplaySecondsBeforeLogout={displayDelayBeforeLogout}
            extendSessionPath="my-test-extend-session-URL"
            logoutPath="logout"
            sessionRemainingTimePath="remaining"
            onSessionExpired={() => {}}
            resetOnChange={[{}]}
          />
        </div>
      );
    });

    await componentUnderTest.update();

    expect(componentUnderTest.find("div.pg-modal-container").length).toBe(1);

    const fetchMock = setupFetchMock(999);

    const clickRefeshHandler = componentUnderTest
      .find("button#logout-warning-modal-remain-active-button")
      .prop("onClick");

    await act(async () => {
      await clickRefeshHandler();
    });

    await componentUnderTest.update();

    expect(componentUnderTest.find("div.pg-modal-container").length).toBe(0);
    expect(fetchMock).toHaveBeenCalledWith("my-test-extend-session-URL");
  });
});
