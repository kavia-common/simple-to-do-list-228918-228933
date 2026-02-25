import { render, screen } from "@testing-library/react";
import App from "./App";

test("renders Retro To-Do header", () => {
  render(<App />);
  const title = screen.getByText(/retro to‑do/i);
  expect(title).toBeInTheDocument();
});
