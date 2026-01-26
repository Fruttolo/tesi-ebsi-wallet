/**
 * Test suite per i componenti UI/UX - Fase 9
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";

import LoadingState from "../components/LoadingState";
import { CredentialSkeleton, ListSkeleton } from "../components/SkeletonLoader";
import ErrorState from "../components/ErrorState";
import SuccessSnackbar from "../components/SuccessSnackbar";

describe("LoadingState Component", () => {
  it("renders with default message", () => {
    render(<LoadingState />);
    expect(screen.getByText("Caricamento...")).toBeInTheDocument();
  });

  it("renders with custom message", () => {
    render(<LoadingState message="Caricamento credenziali..." />);
    expect(screen.getByText("Caricamento credenziali...")).toBeInTheDocument();
  });

  it("has accessible role and aria-live", () => {
    const { container } = render(<LoadingState />);
    const statusElement = container.querySelector('[role="status"]');
    expect(statusElement).toBeInTheDocument();
    expect(statusElement).toHaveAttribute("aria-live", "polite");
  });
});

describe("SkeletonLoader Components", () => {
  it("renders CredentialSkeleton", () => {
    const { container } = render(<CredentialSkeleton />);
    const skeletons = container.querySelectorAll(".MuiSkeleton-root");
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("renders ListSkeleton with correct number of items", () => {
    const { container } = render(<ListSkeleton items={5} />);
    const cards = container.querySelectorAll(".MuiCard-root");
    expect(cards.length).toBe(5);
  });

  it("renders ListSkeleton with default 3 items", () => {
    const { container } = render(<ListSkeleton />);
    const cards = container.querySelectorAll(".MuiCard-root");
    expect(cards.length).toBe(3);
  });
});

describe("ErrorState Component", () => {
  it("renders with default title", () => {
    render(<ErrorState />);
    expect(screen.getByText("Si è verificato un errore")).toBeInTheDocument();
  });

  it("renders with custom title and message", () => {
    render(<ErrorState title="Errore di rete" message="Impossibile connettersi al server" />);
    expect(screen.getByText("Errore di rete")).toBeInTheDocument();
    expect(screen.getByText("Impossibile connettersi al server")).toBeInTheDocument();
  });

  it("shows retry button when onRetry is provided", () => {
    const onRetry = vi.fn();
    render(<ErrorState onRetry={onRetry} />);
    const retryButton = screen.getByText("Riprova");
    expect(retryButton).toBeInTheDocument();
  });

  it("does not show retry button when onRetry is not provided", () => {
    render(<ErrorState />);
    expect(screen.queryByText("Riprova")).not.toBeInTheDocument();
  });

  it("calls onRetry when retry button is clicked", () => {
    const onRetry = vi.fn();
    render(<ErrorState onRetry={onRetry} />);
    const retryButton = screen.getByText("Riprova");
    fireEvent.click(retryButton);
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("has accessible alert role", () => {
    const { container } = render(<ErrorState />);
    const alertElement = container.querySelector('[role="alert"]');
    expect(alertElement).toBeInTheDocument();
    expect(alertElement).toHaveAttribute("aria-live", "assertive");
  });
});

describe("SuccessSnackbar Component", () => {
  it("renders when open is true", () => {
    render(<SuccessSnackbar open={true} message="Operazione completata" onClose={() => {}} />);
    expect(screen.getByText("Operazione completata")).toBeInTheDocument();
  });

  it("does not render when open is false", () => {
    render(<SuccessSnackbar open={false} message="Operazione completata" onClose={() => {}} />);
    expect(screen.queryByText("Operazione completata")).not.toBeInTheDocument();
  });

  it("calls onClose when close button is clicked", () => {
    const onClose = vi.fn();
    render(<SuccessSnackbar open={true} message="Test message" onClose={onClose} />);

    // MUI Snackbar ha un pulsante close
    const closeButtons = screen.getAllByRole("button");
    if (closeButtons.length > 0) {
      fireEvent.click(closeButtons[0]);
      expect(onClose).toHaveBeenCalled();
    }
  });

  it("has accessible status role", () => {
    const { container } = render(
      <SuccessSnackbar open={true} message="Test message" onClose={() => {}} />
    );
    const statusElement = container.querySelector('[role="status"]');
    expect(statusElement).toBeInTheDocument();
  });
});

describe("Accessibility Tests", () => {
  it("LoadingState has proper ARIA attributes", () => {
    const { container } = render(<LoadingState message="Loading content" />);
    const status = container.querySelector('[role="status"]');
    expect(status).toHaveAttribute("aria-live", "polite");
    expect(status).toHaveAttribute("aria-label", "Loading content");
  });

  it("ErrorState has proper ARIA attributes", () => {
    const { container } = render(<ErrorState title="Error occurred" />);
    const alert = container.querySelector('[role="alert"]');
    expect(alert).toHaveAttribute("aria-live", "assertive");
  });

  it("All interactive elements have proper labels", () => {
    const onRetry = vi.fn();
    render(<ErrorState title="Error" message="Test error" onRetry={onRetry} />);
    const retryButton = screen.getByRole("button", {
      name: /riprova l'operazione/i,
    });
    expect(retryButton).toBeInTheDocument();
  });
});
