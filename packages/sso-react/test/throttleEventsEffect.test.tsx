import throttleEvents from "../src/throttleEventsEffect";

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
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

    const testCallback = jest.fn();
    const effectUnderTest = throttleEvents(testCallback, THROTTLED_TIME, [
      "keydown",
    ]);
    effectUnderTest();

    expect(testCallback).not.toHaveBeenCalled();

    // Trigger keydown event
    map.keydown({ key: "Enter" });
    jest.advanceTimersByTime(THROTTLED_TIME * 0.5);

    expect(testCallback).not.toHaveBeenCalled();

    map.keydown({ key: "Enter" });
    jest.advanceTimersByTime(THROTTLED_TIME);

    expect(testCallback).toHaveBeenCalledTimes(1);
  });

  it("Only throttles on registered user events", async () => {
    const map = {} as any;
    window.addEventListener = jest.fn((event, callback) => {
      map[event] = callback;
    });

    const THROTTLED_TIME = 1000;

    const testCallback = jest.fn();
    const effectUnderTest = throttleEvents(testCallback, THROTTLED_TIME, [
      "keydown",
    ]);
    effectUnderTest();

    expect(window.addEventListener).not.toHaveBeenCalledWith(
      "mousedown",
      expect.any(Function)
    );

    expect(window.addEventListener).toHaveBeenCalledWith(
      "keydown",
      expect.any(Function)
    );
  });

  it("Cleans up with the return function", async () => {
    const map = {} as any;
    window.addEventListener = jest.fn();
    window.removeEventListener = jest.fn((event, callback) => {
      map[event] = callback;
    });

    const THROTTLED_TIME = 1000;

    const testCallback = jest.fn();
    const effectUnderTest = throttleEvents(testCallback, THROTTLED_TIME, [
      "keydown",
    ]);
    const cleanupFunction = effectUnderTest();

    expect(window.removeEventListener).not.toHaveBeenCalledWith(
      "keydown",
      expect.any(Function)
    );

    cleanupFunction();

    expect(window.removeEventListener).toHaveBeenCalledWith(
      "keydown",
      expect.any(Function)
    );
  });
});
