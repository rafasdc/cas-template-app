import React from "react";

interface Props {
  test: string;
}

const TestModule: React.FunctionComponent<Props> = ({ test }) => (
  <div>{test}</div>
);

export default TestModule;
