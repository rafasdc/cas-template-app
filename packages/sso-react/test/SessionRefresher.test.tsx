import SessionRefresher from "../src/SessionRefresher";
import { mount } from "enzyme";
import React from "react";

const existingFetch = global.fetch;

beforeEach(() => {
  const fetchMock = jest.fn();
  global.fetch = fetchMock;
  jest.useFakeTimers();
});

afterEach(() => {
  global.fetch = existingFetch;
  jest.clearAllTimers();
  jest.useRealTimers();
});

describe("The Session Refresher", () => {
  it("Throttles calls to fetch on user events", async () => {
    const map = {} as any;
    window.addEventListener = jest.fn((event, callback) => {
      map[event] = callback;
    });

    const THROTTLED_TIME = 1000;

    mount(
      <SessionRefresher
        refreshUrl="/session-idle-remaining-time"
        throttledTime={THROTTLED_TIME}
        refreshEvents={["keydown"]}
      />
    );

    expect(global.fetch).not.toHaveBeenCalled();

    // Trigger keydown event
    map.keydown({ key: "Enter" });
    jest.advanceTimersByTime(THROTTLED_TIME * 0.5);

    expect(global.fetch).not.toHaveBeenCalled();

    map.keydown({ key: "Enter" });
    jest.advanceTimersByTime(THROTTLED_TIME);

    expect(global.fetch).toHaveBeenCalledWith("/session-idle-remaining-time");
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it("Only throttles on registered user events", async () => {
    const map = {} as any;
    window.addEventListener = jest.fn((event, callback) => {
      map[event] = callback;
    });

    const THROTTLED_TIME = 1000;

    mount(
      <SessionRefresher
        refreshUrl="/session-idle-remaining-time"
        throttledTime={THROTTLED_TIME}
        refreshEvents={["keydown"]}
      />
    );

    expect(window.addEventListener).not.toHaveBeenCalledWith(
      "mousedown",
      expect.any(Function)
    );

    expect(window.addEventListener).toHaveBeenCalledWith(
      "keydown",
      expect.any(Function)
    );
  });
});
