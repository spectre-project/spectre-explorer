import { Button, Modal } from "react-bootstrap";

const BalanceModal = (props) => {
  return (
    <>
      <Modal size="lg" show={props.show} onHide={props.handleClose}>
        <Modal.Header closeButton>
          <Modal.Title>SPR Balance from REST-API</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          The $SPR balance for <br />
          {props.address} is:
          <br />
          <b>{props.balance} SPR</b>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={props.handleClose}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default BalanceModal;
