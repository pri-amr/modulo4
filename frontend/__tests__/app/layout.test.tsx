import type { ReactElement } from "react";
import { LoadingProvider } from "@/providers/LoadingProvider";
import { ThemeToggle } from "@/components/shared/ThemeToggle";

jest.mock("@/app/globals.css", () => ({}), { virtual: true });

describe("RootLayout", () => {
  it("applies the dark class by default and mounts LoadingProvider around children (plan.md, FR-045)", async () => {
    const RootLayout = (await import("@/app/layout")).default;
    const children = <div>child</div>;

    const element = (await RootLayout({ children })) as ReactElement<{
      className: string;
      children: ReactElement;
    }>;

    expect(element.type).toBe("html");
    expect(element.props.className).toBe("dark");

    const body = element.props.children as ReactElement<{ children: ReactElement[] }>;
    expect(body.type).toBe("body");

    const bodyChildren = ([] as ReactElement[]).concat(body.props.children);
    const provider = bodyChildren.find((child) => child.type === LoadingProvider) as ReactElement<{
      children: ReactElement;
    }>;
    expect(provider).toBeDefined();
    expect(provider.props.children).toBe(children);

    const themeToggle = bodyChildren.find((child) => child.type === ThemeToggle);
    expect(themeToggle).toBeDefined();
  });
});
