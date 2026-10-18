export {};
declare global {
  var LsevinViewStore: {
    save(path: string, html: string, owner: string): Promise<void>;
    read(path: string): Promise<string | null>;
    clear(): Promise<void>;
    checkOwner(owner: string | null): Promise<void>;
    validOwner(path: string, owner: string): Promise<boolean>;
  };
}
