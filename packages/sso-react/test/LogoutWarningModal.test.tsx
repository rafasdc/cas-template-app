import React from "react";
import LogoutWarningModal from "../src/LogoutWarningModal";
import { mount, shallow } from "enzyme";
import { act } from "react-dom/test-utils";

afterEach(() => {
  jest.useRealTimers();
});

describe("The Logout Warning Modal", () => {
  it("Should match the snapshot", () => {
    jest.useFakeTimers();
    const dateMock = jest.spyOn(Date, "now").mockImplementation(() => 1000); // One second after January 1st, 1970

    const componentUnderTest = shallow(
      <LogoutWarningModal
        onExtendSession={() => {}}
        expiresOn={12000}
        logoutPath="/logout"
      />
    );
    expect(componentUnderTest).toMatchSnapshot();

    dateMock.mockRestore();
  });

  it("Should use the optional render method if provided", () => {
    jest.useFakeTimers();
    const dateMock = jest.spyOn(Date, "now").mockImplementation(() => 1000); // One second after January 1st, 1970

    const componentUnderTest = mount(
      <LogoutWarningModal
        onExtendSession={() => {}}
        expiresOn={12000}
        logoutPath="/logout"
        renderModal={({ remainingSeconds }) => (
          <div>There are {remainingSeconds} seconds left.</div>
        )}
      />
    );
    expect(componentUnderTest).toMatchSnapshot();

    dateMock.mockRestore();
  });

  it("should call the extendSession function", () => {
    const expireSpy = jest.fn();
    const componentUnderTest = shallow(
      <LogoutWarningModal
        onExtendSession={expireSpy}
        expiresOn={12345}
        logoutPath="/logout"
      />
    );
    componentUnderTest
      .find("Button#logout-warning-modal-remain-active-button")
      .simulate("click");
    expect(expireSpy).toHaveBeenCalled();
  });

  it("should countdown seconds", async () => {
    jest.useFakeTimers();
    let dateMock = jest.spyOn(Date, "now").mockImplementation(() => 1000); // 1 second after Jan. 1st, 1970

    let componentUnderTest: any = {};

    await act(async () => {
      componentUnderTest = mount(
        <LogoutWarningModal
          onExtendSession={() => {}}
          expiresOn={17000} // 17 seconds after Jan. 1st, 1970
          logoutPath="/logout"
        />
      );
    });
    await componentUnderTest.update();

    expect(componentUnderTest).toMatchSnapshot();
    expect(
      componentUnderTest
        .text()
        .trim()
        .includes("You will be logged out in 16 seconds")
    ).toBeTrue();

    dateMock.mockRestore();
    dateMock = jest.spyOn(Date, "now").mockImplementation(() => 5000); // 5 second after Jan. 1st, 1970

    await act(async () => {
      jest.runOnlyPendingTimers();
    });

    // When the timer expires the component re-syncs from the system time
    expect(
      componentUnderTest
        .text()
        .trim()
        .includes("You will be logged out in 12 seconds")
    ).toBeTrue();

    dateMock.mockRestore();
  });
});
