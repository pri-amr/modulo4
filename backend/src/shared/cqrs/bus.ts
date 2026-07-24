export interface Message {
  type: string;
}

export type Handler<TMessage extends Message, TResult> = (message: TMessage) => Promise<TResult>;

export interface Bus<TMessage extends Message, TResult> {
  register(type: string, handler: Handler<TMessage, TResult>): void;
  dispatch(message: TMessage): Promise<TResult>;
}

export function createBus<TMessage extends Message, TResult>(): Bus<TMessage, TResult> {
  const handlers = new Map<string, Handler<TMessage, TResult>>();

  return {
    register(type, handler) {
      handlers.set(type, handler);
    },
    async dispatch(message) {
      const handler = handlers.get(message.type);
      if (!handler) {
        throw new Error(`No handler registered for "${message.type}"`);
      }
      return handler(message);
    },
  };
}
