import moment from "moment";
import { useCallback, useContext, useEffect, useRef, useState } from "react";
import { Col, Container, Row, Spinner } from "react-bootstrap";
import { useParams } from "react-router";
import { Link } from "react-router-dom";
import { numberWithCommas } from "../helper.js";
import { getTransaction, getTransactions } from "../spectre-api-client.js";
import BlueScoreContext from "./BlueScoreContext.js";
import CopyButton from "./CopyButton.js";
import NotAcceptedTooltip from "./NotAccepted.js";

const getOutputFromIndex = (outputs, index) => {
  return outputs[index];
};

const TransactionInfo = () => {
  const { id } = useParams();
  const [txInfo, setTxInfo] = useState();
  const [additionalTxInfo, setAdditionalTxInfo] = useState();
  const [showTxFee, setShowTxFee] = useState(false);
  const [, setError] = useState(false); // fix unused state setter
  const retryCnt = useRef(0);
  const retryNotAccepted = useRef(6);
  const { blueScore } = useContext(BlueScoreContext);

  const getTx = useCallback(() => {
    return getTransaction(id)
      .then((res) => {
        setTxInfo(res);
      })
      .catch((err) => {
        setError(true);
        setTxInfo(undefined);
        throw err;
      });
  }, [id]); // added useCallback and dependency array

  useEffect(() => {
    setError(false);
    getTx();
  }, [getTx]);

  useEffect(() => {
    if (!!txInfo && txInfo?.detail !== "Transaction not found") {
      const txToQuery = txInfo.inputs
        ?.flatMap((txInput) => txInput.previous_outpoint_hash)
        .filter((x) => x);
      if (!!txToQuery) {
        getTransactions(txToQuery, true, true)
          .then((resp) => {
            setShowTxFee(txToQuery.length === resp.length);
            const respAsObj = resp.reduce((obj, cur) => {
              obj[cur["transaction_id"]] = cur;
              return obj;
            }, {});
            setAdditionalTxInfo(respAsObj);
          })
          .catch((err) => console.log("Error ", err));
      }
    }
    if (txInfo?.detail === "Transaction not found") {
      retryCnt.current += 1;
      if (retryCnt.current < 20) {
        setTimeout(getTx, 1000);
      }
    }

    const timeDiff = (Date.now() - (txInfo?.block_time || Date.now())) / 1000;

    if (
      txInfo?.is_accepted === false &&
      timeDiff < 60 &&
      retryNotAccepted.current > 0
    ) {
      retryNotAccepted.current -= 1;
      setTimeout(getTx, 2000);
    }
  }, [txInfo, getTx]);

  return (
    <div className="blockinfo-page">
      <Container className="webpage" fluid>
        <Row>
          <Col className="mx-0">
            {!!txInfo && txInfo?.detail !== "Transaction not found" ? (
              <div className="blockinfo-content">
                <div className="blockinfo-header">
                  <h4 className="d-flex flex-row align-items-center">
                    transaction info
                  </h4>
                </div>
                <Container className="blockinfo-table mx-0" fluid>
                  <Row className="blockinfo-row">
                    <Col className="blockinfo-key" lg={2}>
                      Transaction Id
                    </Col>
                    <Col className="blockinfo-value-mono" lg={10}>
                      {txInfo.transaction_id}
                      <CopyButton text={txInfo.transaction_id} />
                    </Col>
                  </Row>
                  <Row className="blockinfo-row">
                    <Col className="blockinfo-key" lg={2}>
                      Subnetwork Id
                    </Col>
                    <Col className="blockinfo-value-mono" lg={10}>
                      {txInfo.subnetwork_id}
                    </Col>
                  </Row>
                  <Row className="blockinfo-row">
                    <Col className="blockinfo-key" lg={2}>
                      Hash
                    </Col>
                    <Col className="blockinfo-value-mono" lg={10}>
                      {txInfo.hash}
                    </Col>
                  </Row>
                  <Row className="blockinfo-row">
                    <Col className="blockinfo-key" lg={2}>
                      Mass
                    </Col>
                    <Col className="blockinfo-value" lg={10}>
                      {txInfo.mass ? txInfo.mass : "-"}
                    </Col>
                  </Row>
                  <Row className="blockinfo-row">
                    <Col className="blockinfo-key" lg={2}>
                      Block Hashes
                    </Col>
                    <Col className="blockinfo-value-mono" lg={10}>
                      <ul>
                        {txInfo.block_hash?.map((x) => (
                          <li key={x}>
                            <Link
                              to={`/blocks/${x}`}
                              className="blockinfo-link"
                            >
                              {x}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </Col>
                  </Row>
                  <Row className="blockinfo-row">
                    <Col className="blockinfo-key" lg={2}>
                      Block Time
                    </Col>
                    <Col className="blockinfo-value" lg={10}>
                      {moment(parseInt(txInfo.block_time)).format(
                        "YYYY-MM-DD HH:mm:ss",
                      )}{" "}
                      ({txInfo.block_time})
                    </Col>
                  </Row>
                  <Row className="blockinfo-row">
                    <Col className="blockinfo-key" lg={2}>
                      Accepting Block Hash
                    </Col>
                    <Col className="blockinfo-value-mono" lg={10}>
                      <Link
                        to={`/blocks/${txInfo.accepting_block_hash}`}
                        className="blockinfo-link"
                      >
                        {txInfo.accepting_block_hash || "-"}
                      </Link>
                    </Col>
                  </Row>
                  {showTxFee && (
                    <Row className="blockinfo-row">
                      <Col className="blockinfo-key" lg={2}>
                        Transaction fee
                      </Col>
                      <Col className="blockinfo-value-mono" lg={10}>
                        {txInfo && additionalTxInfo && (
                          <>
                            {(txInfo.inputs
                              .map(
                                (tx_input) =>
                                  getOutputFromIndex(
                                    additionalTxInfo[
                                      tx_input.previous_outpoint_hash
                                    ]?.outputs || [],
                                    tx_input?.previous_outpoint_index,
                                  )?.amount || 0,
                              )
                              .reduce((a, b) => a + b) -
                              (
                                txInfo.outputs?.map((v) => v?.amount) || [0]
                              ).reduce((a, b) => a + b)) /
                              100000000}{" "}
                            SPR
                          </>
                        )}
                      </Col>
                    </Row>
                  )}
                  <Row className="blockinfo-row border-bottom-0">
                    <Col className="blockinfo-key" md={2}>
                      Details
                    </Col>
                    <Col
                      className="blockinfo-value mt-2 d-flex flex-row flex-wrap"
                      md={10}
                      lg={10}
                      style={{ marginBottom: "-1rem" }}
                    >
                      {txInfo.is_accepted ? (
                        <div className="accepted-true me-3 mb-3">accepted</div>
                      ) : (
                        <>
                          <span className="accepted-false">not accepted</span>
                          <NotAcceptedTooltip />
                        </>
                      )}
                      {txInfo.is_accepted &&
                        blueScore !== 0 &&
                        blueScore - txInfo.accepting_block_blue_score <
                          86400 && (
                          <div className="confirmations mb-3">
                            {Math.max(
                              blueScore - txInfo.accepting_block_blue_score,
                              0,
                            )}
                            &nbsp;confirmations
                          </div>
                        )}
                      {txInfo.is_accepted &&
                        blueScore !== 0 &&
                        blueScore - txInfo.accepting_block_blue_score >=
                          86400 && (
                          <div className="confirmations mb-3">confirmed</div>
                        )}
                    </Col>
                  </Row>
                </Container>
              </div>
            ) : (
              <>
                <Spinner animation="border" variant="primary" />
                <h2 className="text-light">Retry {retryCnt.current}/20</h2>
                <p className="blockinfo-row text-light">
                  Sometimes TXs need a few seconds to be added into the
                  database.
                </p>
              </>
            )}
          </Col>
        </Row>

        <Row>
          <Col>
            {!!txInfo && txInfo?.detail !== "Transaction not found" ? (
              <div className="blockinfo-content mt-4 mb-5">
                <div className="blockinfo-header">
                  <h4>Inputs</h4>
                </div>
                <Container className="webpage utxo-box" fluid>
                  {(txInfo.inputs || []).map((tx_input) => (
                    <Row
                      key={
                        tx_input.previous_outpoint_hash +
                        tx_input.previous_outpoint_index
                      }
                      className="utxo-border py-3"
                    >
                      <Col sm={6} md={6} lg={2}>
                        <div className="blockinfo-key mt-0 mt-md-2">
                          Signature Op Count
                        </div>
                        <div className="utxo-value-mono">
                          {tx_input.sig_op_count}
                        </div>
                      </Col>
                      <Col sm={12} md={12} lg={7}>
                        <div className="blockinfo-key mt-2">
                          Signature Script
                        </div>
                        <div className="utxo-value-mono">
                          {tx_input.signature_script}
                        </div>
                      </Col>
                      {!!additionalTxInfo &&
                        additionalTxInfo[tx_input.previous_outpoint_hash] && (
                          <Col sm={12} md={12} lg={3}>
                            <div className="blockinfo-key mt-2">Amount</div>
                            <div className="utxo-value">
                              <span className="utxo-amount-minus">
                                -
                                {getOutputFromIndex(
                                  additionalTxInfo[
                                    tx_input.previous_outpoint_hash
                                  ].outputs,
                                  tx_input?.previous_outpoint_index,
                                )?.amount / 100000000}
                                &nbsp;SPR
                              </span>
                            </div>
                          </Col>
                        )}
                      <Col sm={12} md={12} lg={12}>
                        <div className="blockinfo-key mt-2">
                          Previous Outpoint Index + Hash
                        </div>
                        <div className="utxo-value-mono">
                          #{tx_input?.previous_outpoint_index}{" "}
                          {tx_input.previous_outpoint_hash}
                        </div>
                      </Col>
                      {additionalTxInfo &&
                        additionalTxInfo[tx_input.previous_outpoint_hash] && (
                          <>
                            <Col sm={12} md={12} lg={12}>
                              <div className="blockinfo-key mt-2">Address</div>
                              <div className="utxo-value-mono">
                                <Link
                                  to={`/addresses/${
                                    getOutputFromIndex(
                                      additionalTxInfo[
                                        tx_input.previous_outpoint_hash
                                      ].outputs,
                                      tx_input?.previous_outpoint_index,
                                    )?.script_public_key_address
                                  }`}
                                  className="blockinfo-link"
                                >
                                  {
                                    getOutputFromIndex(
                                      additionalTxInfo[
                                        tx_input.previous_outpoint_hash
                                      ].outputs,
                                      tx_input?.previous_outpoint_index,
                                    )?.script_public_key_address
                                  }
                                </Link>
                              </div>
                            </Col>
                          </>
                        )}
                    </Row>
                  ))}
                  {(txInfo.inputs || []).length === 0 ? (
                    <Row className="utxo-border py-3">
                      <Col sm={12}>
                        <div className="blockinfo-key mt-0 mt-md-2 me-auto">
                          FROM
                        </div>
                        <div className="utxo-value mt-0 mt-md-2 me-auto">
                          COINBASE ( New coins )
                        </div>
                      </Col>
                    </Row>
                  ) : (
                    <></>
                  )}
                </Container>
                <div className="blockinfo-header mt-5">
                  <h4>Outputs</h4>
                </div>
                <Container className="webpage utxo-box" fluid>
                  {(txInfo.outputs || []).map((tx_output) => (
                    <Row key={tx_output.index} className="utxo-border py-3">
                      <Col sm={6} md={6} lg={2}>
                        <div className="blockinfo-key mt-2 mt-lg-0">Index</div>
                        <div className="utxo-value-mono">
                          #{tx_output.index}
                        </div>
                      </Col>
                      <Col sm={12} md={12} lg={7}>
                        <div className="blockinfo-key mt-2 mt-lg-0">
                          Script Public Key Type
                        </div>
                        <div className="utxo-value-mono">
                          {tx_output.script_public_key_type}
                        </div>
                      </Col>
                      <Col sm={6} md={6} lg={3}>
                        <div className="blockinfo-key mt-2 mt-lg-0">Amount</div>
                        <div className="utxo-value">
                          <span className="utxo-amount">
                            +{numberWithCommas(tx_output?.amount / 100000000)}
                            &nbsp;SPR
                          </span>
                        </div>
                      </Col>
                      <Col sm={12} md={12} lg={12}>
                        <div className="blockinfo-key mt-2">
                          Script Public Key
                        </div>
                        <div className="utxo-value-mono">
                          {tx_output.script_public_key}
                        </div>
                      </Col>
                      <Col sm={12} md={12} lg={12}>
                        <div className="blockinfo-key mt-2">
                          Script Public Key Address
                        </div>
                        <div className="utxo-value-mono">
                          <Link
                            to={`/addresses/${tx_output?.script_public_key_address}`}
                            className="blockinfo-link"
                          >
                            {tx_output?.script_public_key_address}
                          </Link>
                        </div>
                      </Col>
                    </Row>
                  ))}
                </Container>
              </div>
            ) : (
              <></>
            )}
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default TransactionInfo;
