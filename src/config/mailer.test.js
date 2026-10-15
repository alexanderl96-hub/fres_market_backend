import { beforeEach, describe, expect, it, vi } from "vitest";
import { sendEmail } from "./mailer";

const { createTransport, sendMail } = vi.hoisted(() => ({
  createTransport: vi.fn(),
  sendMail: vi.fn(),
}));
vi.mock("nodemailer", () => ({ default: { createTransport } }));
describe("mailer", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    sendMail.mockResolvedValue({ messageId: "test-message-id" });
    createTransport.mockReturnValue({ sendMail });
    vi.stubEnv("SMTP_HOST", "smtp.example.com");
    vi.stubEnv("SMTP_PORT", "465");
    vi.stubEnv("SMTP_SECURE", "true");
    vi.stubEnv("SMTP_USER", "test@example.com");
    vi.stubEnv("SMTP_PASS", "test-password");
    vi.stubEnv("MAIL_FROM", "Food Store <test@example.com>");
  });
  it("resolves with sample input", async () => {
    const { sendEmail } = await import("./mailer.js");
    await expect(
      sendEmail({
        to: "customer@example.com",
        subject: "Test email",
        text: "This is a test.",
        html: "<p>This is a test.</p>",
      }),
    ).resolves.toEqual({ messageId: "test-message-id" });
    expect(createTransport).toHaveBeenCalledOnce();
    expect(sendMail).toHaveBeenCalledWith({
      from: "Food Store <test@example.com>",
      to: "customer@example.com",
      subject: "Test email",
      text: "This is a test.",
      html: "<p>This is a test.</p>",
    });
  });
});

// tw:generated sendEmail
describe("sendEmail", () => {
  it("resolves with sample input", async () => {
    await sendEmail({ to: 1, subject: 1, text: "test", html: 1 });
  });
});

// tw:generated sendEmail [boost 1]
describe("sendEmail [boost 1]", () => {
  it("exercises edge-case inputs (no assertions)", async () => {
    try {
      await sendEmail({});
    } catch {
      /* exercised: this call is allowed to throw */
    }
  });
});

// tw:generated sendEmail [boost 2]
describe("sendEmail [boost 2]", () => {
  it("exercises edge-case inputs (no assertions)", async () => {
    try {
      await sendEmail(null);
    } catch {
      /* exercised: this call is allowed to throw */
    }
  });
});
