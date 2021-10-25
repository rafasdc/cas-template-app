import React, { useEffect } from "react";
import throttle from "lodash.throttle";

interface Props {
  refreshUrl: string;
  throttledTime?: number;
  refreshEvents?: string[];
}

const SessionRefresher: React.FunctionComponent<Props> = ({
  refreshUrl,
  throttledTime = 1000 * 60 * 5, // 5 min default
  refreshEvents = ["keydown", "mousedown", "scroll"],
}) => {
  const extendSession = async () => {
    try {
      await fetch(refreshUrl);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    const throttledSession = throttle(extendSession, throttledTime, {
      leading: false,
      trailing: true,
    });

    refreshEvents.forEach((event) => {
      window.addEventListener(event, throttledSession);
    });

    return () => {
      refreshEvents.forEach((event) => {
        window.removeEventListener(event, throttledSession);
      });
      throttledSession.cancel();
    };
  }, []);

  return null;
};

export default SessionRefresher;
