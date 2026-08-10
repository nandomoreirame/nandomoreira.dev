interface Closable {
  close: () => Promise<void>;
}

/**
 * Defers closing the MCP server until the response body has actually been
 * delivered.
 *
 * Closing in a `finally` around `handleRequest` is the obvious shape and it is
 * wrong: `handleRequest` resolves as soon as the Response exists, before the
 * caller reads it, so the close tears the stream down and the client receives
 * an empty body. Never closing is the other failure: at concurrency 80 each
 * request would leave a server, its registered tools and the transport behind.
 *
 * So the body is re-wrapped and the close hangs off the end of the stream:
 * completion, consumer cancellation and upstream error all reach it, exactly
 * once.
 */
export const closeWhenDrained = (response: Response, server: Closable): Response => {
  let closed = false;
  const closeOnce = () => {
    if (closed) return;
    closed = true;
    void server.close().catch(() => undefined);
  };

  if (!response.body) {
    closeOnce();

    return response;
  }

  const reader = response.body.getReader();

  const stream = new ReadableStream<Uint8Array>({
    async pull(controller) {
      try {
        const { done, value } = await reader.read();

        if (done) {
          controller.close();
          closeOnce();

          return;
        }

        controller.enqueue(value);
      } catch (error) {
        controller.error(error);
        closeOnce();
      }
    },
    async cancel(reason) {
      await reader.cancel(reason).catch(() => undefined);
      closeOnce();
    },
  });

  return new Response(stream, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  });
};
