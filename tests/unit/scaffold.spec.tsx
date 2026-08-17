import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

function ScaffoldFixture() {
  return <h1>Scaffold ready</h1>;
}

describe("scaffold", () => {
  it("exposes the test fixture heading semantically", () => {
    render(<ScaffoldFixture />);

    expect(
      screen.getByRole("heading", { name: "Scaffold ready" }),
    ).toBeInTheDocument();
  });
});
