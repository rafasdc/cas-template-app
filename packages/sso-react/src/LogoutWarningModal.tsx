import React, { useEffect, useState } from "react";
import Modal from "@button-inc/bcgov-theme/Modal";
import Grid from "@button-inc/bcgov-theme/Grid";
import Button from "@button-inc/bcgov-theme/Button";

interface Props {
  inactivityDelaySeconds: number;
  expiresOn: number;
  onExtendSession: () => void;
  logoutPath: string;
}

const LogoutWarningModal: React.FunctionComponent<Props> = ({
  inactivityDelaySeconds,
  expiresOn,
  onExtendSession,
  logoutPath,
}) => {
  const [remainingSeconds, setRemainingSeconds] = useState(
    Math.floor((expiresOn - Date.now()) / 1000)
  );

  useEffect(() => {
    const intervalId = setInterval(() => {
      setRemainingSeconds(Math.floor((expiresOn - Date.now()) / 1000));
    }, 1000);

    return () => {
      clearInterval(intervalId);
    };
  }, []);

  return (
    <Modal show size="lg" id="logout-warning-modal">
      <Modal.Header className="h4">Inactivity Logout Warning</Modal.Header>
      <Modal.Content style={{ padding: "2em" }}>
        <Grid cols={12}>
          <Grid.Row>
            Your session is about to expire due to inactivity over{" "}
            {Math.floor(inactivityDelaySeconds / 60)} minutes.
          </Grid.Row>
          <Grid.Row>
            You will be logged out in {remainingSeconds} seconds.
          </Grid.Row>
        </Grid>
      </Modal.Content>
      <Modal.Footer>
        <form action={logoutPath} method="post">
          <button type="submit" className="btn btn-secondary">
            Logout
          </button>
        </form>
        <Button
          id="logout-warning-modal-remain-active"
          onClick={onExtendSession}
        >
          Remain active
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default LogoutWarningModal;
