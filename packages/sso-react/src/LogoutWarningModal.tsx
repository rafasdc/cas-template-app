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

export interface WarningModalProps extends Props {
  remainingSeconds: number;
}

const LogoutWarningModal: React.FunctionComponent<
  Props & {
    renderModal?: (props: WarningModalProps) => JSX.Element;
  }
> = (props) => {
  const {
    inactivityDelaySeconds,
    expiresOn,
    onExtendSession,
    logoutPath,
    renderModal,
  } = props;

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

  if (renderModal) {
    return renderModal({ remainingSeconds, ...props });
  }

  // Default render
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
          <Button
            type="submit"
            variant="secondary"
            id="logout-warning-modal-logout-button"
          >
            Logout
          </Button>
        </form>
        <Button
          id="logout-warning-modal-remain-active-button"
          onClick={onExtendSession}
          variant="primary"
        >
          Remain active
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default LogoutWarningModal;
