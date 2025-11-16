import { HashWidget } from "./widgets/hash-widget/hash-widget";

/**
 * SHA256 Hash Computation Page
 *
 * This page uses the HashWidget component, which is a fully self-contained,
 * reusable component with its own isolated state and Web Worker.
 *
 * Multiple HashWidgets can be rendered independently:
 *
 * @example
 * ```tsx
 * export default function HashComputationPage() {
 *   return (
 *     <>
 *       <HashWidget /> // Instance 1
 *       <HashWidget /> // Instance 2 (completely independent)
 *     </>
 *   );
 * }
 * ```
 */
export default function HashComputationPage() {
  return <HashWidget />;
}
