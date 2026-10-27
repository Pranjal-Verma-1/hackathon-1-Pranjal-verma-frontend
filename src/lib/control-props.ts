import { Children, cloneElement, isValidElement, type ReactElement, type ReactNode } from "react";

export type ControlProps = {
  id?: string;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean | undefined;
};

const NATIVE_CONTROLS = new Set(["input", "select", "textarea"]);

function isNativeControl(node: ReactElement): boolean {
  return typeof node.type === "string" && NATIVE_CONTROLS.has(node.type);
}

/** Put id and description on the input, including when a prefix wraps it. */
export function stampControl(node: ReactElement, props: ControlProps): ReactElement {
  if (isNativeControl(node)) return cloneElement(node, props as Partial<unknown>);

  const element = node as ReactElement<{ children?: ReactNode }>;
  let stamped = false;
  const children = Children.map(element.props.children, (child) => {
    if (stamped || !isValidElement(child) || !isNativeControl(child)) return child;
    stamped = true;
    return cloneElement(child, props as Partial<unknown>);
  });

  return cloneElement(element, undefined, children);
}
