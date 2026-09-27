// Node's global Headers type can omit this DOM standard iterator even though
// the runtime implementation supports it and the generated client uses it.
interface Headers {
  entries(): IterableIterator<[string, string]>;
}