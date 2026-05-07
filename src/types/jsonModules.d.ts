// Lets TypeScript import JSON files cleanly.

declare module '*.json' {
  const value: unknown;
  export default value;
}