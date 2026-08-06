/// <reference types="vite/client" />
/// <reference types="vite-plugin-svgr/client" />
/// <reference types="vite-plugin-pwa/react" />

declare module "*.svg?react" {
  import React = require("react");
  export const ReactComponent: React.FunctionComponent<
    React.SVGProps<SVGSVGElement>
  >;
  const src: React.FunctionComponent<React.SVGProps<SVGSVGElement>>;
  export default src;
}
