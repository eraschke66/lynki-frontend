/// <reference types="vite/client" />
/// <reference types="vite-plugin-svgr/client" />
/// <reference types="vite-plugin-pwa/react" />

interface ImportMetaEnv {
  /** Vercel's VERCEL_ENV: "production" | "preview" | "development". */
  readonly VITE_DEPLOY_ENV: string;
}

declare module "*.svg?react" {
  import type * as React from "react";
  export const ReactComponent: React.FunctionComponent<
    React.SVGProps<SVGSVGElement>
  >;
  const src: React.FunctionComponent<React.SVGProps<SVGSVGElement>>;
  export default src;
}
