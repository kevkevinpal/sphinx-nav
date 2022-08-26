import { useState, useEffect } from "react";
import styled from "styled-components";
import { boostContent } from "./helpers";
// import Modal from '../sphinxUI/modal'
import ClipLoader from "react-spinners/ClipLoader";

interface BoostProps {
  refId?: string;
  content?: any;
  style?: any;
  readOnly?: boolean;
  boostCount?: number;
}

export default function Booster(props: BoostProps) {
  const [submitting, setSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { refId, content } = props;

  useEffect(() => {
    setIsSuccess(false);
    setSubmitting(false);
  }, [refId]);

  let { image_url } = content || {};

  if (image_url) {
    image_url = image_url.replace(".jpg", "_l.jpg");
  }

  const defaultBoostAmount = 5;

  async function doBoost() {
    if (submitting || !refId) return;
    setSubmitting(true);
    try {
      const [res, err] = await boostContent(refId, defaultBoostAmount);

      if (err) {
        throw new Error(err + "");
      }

      console.log("res", res);
      setIsSuccess(true);
    } catch (e) {
      console.log("e", e);
    }
    setSubmitting(false);
  }

  if (props.readOnly) {
    if (!props.boostCount) return null;

    return (
      <Pill style={{ width: "fit-content", padding: "1px 8px 1px 3px" }}>
        <Row>
          <span className="material-icons" style={{ fontSize: 12 }}>
            bolt
          </span>
          <div style={{ fontSize: 10 }}>{props.boostCount || 0}</div>
        </Row>
      </Pill>
    );
  }

  return (
    <div style={{ ...props.style }}>
      {isSuccess ? (
        <Row>
          <span
            className="material-icons"
            style={{ fontSize: 20, color: "#49c998" }}
          >
            bolt
          </span>
        </Row>
      ) : (
        <Pill
          style={{ width: 50 }}
          onClick={() => {
            if (isSuccess || submitting) return;
            doBoost();
          }}
          disabled={isSuccess || submitting}
        >
          {submitting ? (
            <ClipLoader color={"#fff"} loading={true} size={10} />
          ) : (
            <Row>
              <span className="material-icons" style={{ fontSize: 14 }}>
                bolt
              </span>
              <div style={{ marginRight: 8 }}>Boost</div>
            </Row>
          )}
        </Pill>
      )}
    </div>
  );
}

const Row = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
`;

interface PillProps {
  selected?: boolean;
  disabled?: boolean;
}
const Pill = styled.div<PillProps>`
  padding: 10px 20px;
  width: calc(100% - 40px);
  border-radius: 20px;
  flex-grow: 0;
  flex-shrink: 0;
  cursor: pointer;
  background: #49c998;
  color: #fff;
  display: flex;
  justify-content: center;
  align-items: center;
  font-weight: 500;
  font-size: 12px;
  line-height: 14px;
  opacity: ${(p) => (p.disabled ? "0.7" : "1")};
  pointer-events: ${(p) => (p.disabled ? "none" : "auto")};
`;

const Input = styled.input`
  pointer-events: auto;
  width: calc(100% - 40px);
  height: 40px;
  padding: 0 20px;
  border: 1px solid #d0d5d8;
  // box-shadow: 0px 1px 6px rgba(0, 0, 0, 0.1);
  border-radius: 4px;
  :&focus  {
    border: none;
  }
`;

const ContentEnv = styled.div`
  display: flex;
  align-items: flex-start;
`;

const Title = styled.div`
  font-weight: 400;
  font-size: 11px;
  margin-bottom: 4px;
  /* or 164% */

  /* Main bottom icons */

  color: #5f6368;
`;

const MainTitle = styled.div`
  font-weight: 500;
  font-size: 14px;
  line-height: 18px;
  /* or 164% */

  /* Main bottom icons */

  color: #222;
  margin-bottom: 4px;
`;

interface ImgProps {
  src: string;
}
const Avatar = styled.div<ImgProps>`
  background-image: url(${(p) => p.src});
  background-size: contain;
  background-repeat: no-repeat;
  flex-grow: 0;
  flex-shrink: 0;
  margin-right: 12px;
  width: 45px;
  height: 45px;
  border-radius: 4px;
`;
