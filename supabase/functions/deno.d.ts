// Type definitions for Deno
// Used to provide TypeScript support for Deno global APIs in edge functions

declare namespace Deno {
  export interface ServeOptions {
    port?: number;
    hostname?: string;
  }

  export type ServeHandler = (request: Request) => Response | Promise<Response>;

  export function serve(
    handler: ServeHandler,
    options?: ServeOptions
  ): Promise<void>;

  export namespace env {
    export function get(key: string): string | undefined;
    export function set(key: string, value: string): void;
    export function toObject(): Record<string, string>;
  }
}
