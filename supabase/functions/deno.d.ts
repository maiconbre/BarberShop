// Deno type declarations for Edge Functions

// Global Deno namespace
declare global {
  namespace Deno {
    interface Env {
      get(key: string): string | undefined;
      toObject(): Record<string, string>;
    }
    
    const env: Env;
    
    function readTextFile(path: string): Promise<string>;
    function writeTextFile(path: string, data: string): Promise<void>;
    
    const args: string[];
    
    function exit(code?: number): never;
    
    interface Addr {
      transport: "tcp" | "udp";
      hostname: string;
      port: number;
    }
    
    interface ListenOptions {
      port?: number;
      hostname?: string;
      transport?: "tcp";
    }
    
    interface ServeOptions {
      port?: number;
      hostname?: string;
      signal?: AbortSignal;
      reusePort?: boolean;
      onError?: (error: Error) => Response | Promise<Response>;
      onListen?: (params: { hostname: string; port: number }) => void;
    }
    
    interface ServeTlsOptions extends ServeOptions {
      cert?: string;
      key?: string;
      certFile?: string;
      keyFile?: string;
    }
    
    interface HttpServer {
      finished: Promise<void>;
      ref(): void;
      unref(): void;
      shutdown(): Promise<void>;
    }
    
    interface Listener {
      addr: Addr;
      rid: number;
      accept(): Promise<Conn>;
      close(): void;
    }
    
    interface Conn {
      rid: number;
      localAddr: Addr;
      remoteAddr: Addr;
      read(p: Uint8Array): Promise<number | null>;
      write(p: Uint8Array): Promise<number>;
      close(): void;
    }
    
    interface HttpConn {
      rid: number;
      nextRequest(): Promise<RequestEvent | null>;
      close(): void;
    }
    
    interface RequestEvent {
      readonly request: Request;
      respondWith(r: Response | Promise<Response>): Promise<void>;
    }
  }
  
  const Deno: typeof Deno;
}

// Declare modules for Deno std library
declare module 'https://deno.land/std@0.168.0/http/server.ts' {
  export interface ConnInfo {
    readonly localAddr: Deno.Addr;
    readonly remoteAddr: Deno.Addr;
  }
  
  export type Handler = (
    request: Request,
    connInfo: ConnInfo,
  ) => Response | Promise<Response>;
  
  export interface ServerInit extends Partial<Deno.ListenOptions> {
    handler: Handler;
    onError?: (error: unknown) => Response | Promise<Response>;
  }
  
  export class Server {
    constructor(serverInit: ServerInit);
    serve(listener: Deno.Listener): Promise<void>;
    listenAndServe(): Promise<void>;
    close(): void;
  }
  
  export function serve(
    handler: Handler | ServerInit,
    options?: Deno.ServeOptions | Deno.ServeTlsOptions
  ): Deno.HttpServer;
}

declare module 'https://deno.land/std@0.177.0/http/server.ts' {
  export interface ConnInfo {
    readonly localAddr: Deno.Addr;
    readonly remoteAddr: Deno.Addr;
  }
  
  export type Handler = (
    request: Request,
    connInfo: ConnInfo,
  ) => Response | Promise<Response>;
  
  export function serve(
    handler: Handler,
    options?: Deno.ServeOptions | Deno.ServeTlsOptions
  ): Deno.HttpServer;
}

declare module 'https://deno.land/std@0.168.0/encoding/base64.ts' {
  export function encode(data: string | Uint8Array): string;
  export function decode(data: string): Uint8Array;
}

// Additional Deno std modules that might be used
declare module 'https://deno.land/std@*/http/server.ts' {
  export function serve(
    handler: (req: Request) => Response | Promise<Response>, 
    options?: { port?: number; hostname?: string }
  ): void;
}

export {};