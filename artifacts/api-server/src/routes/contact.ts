import { Router, type IRouter } from "express";
import { SubmitContactMessageBody } from "@workspace/api-zod";
import { contactMessagesTable, db } from "@workspace/db";

const router: IRouter = Router();

router.post("/contact/messages", async (req, res): Promise<void> => {
  const parsed = SubmitContactMessageBody.safeParse(req.body);
  if (!parsed.success) {
    req.log.warn(
      {
        issues: parsed.error.issues.map(({ code, path, message }) => ({
          code,
          path,
          message,
        })),
      },
      "Rejected invalid contact form submission",
    );
    res.status(400).json({ error: "Check the contact form fields and try again." });
    return;
  }

  const name = parsed.data.name.trim();
  const email = parsed.data.email.trim();
  const message = parsed.data.message.trim();
  if (!name || !email || message.length < 20) {
    res.status(400).json({ error: "Enter your name, email, and a message of at least 20 characters." });
    return;
  }

  try {
    const [saved] = await db
      .insert(contactMessagesTable)
      .values({
        name,
        email,
        topic: parsed.data.topic,
        message,
      })
      .returning({ receivedAt: contactMessagesTable.receivedAt });

    if (!saved) {
      req.log.error("Contact message insert returned no receipt");
      res.status(503).json({ error: "The message could not be stored. Please try again later." });
      return;
    }

    res.status(201).json({
      message: "Your message was recorded. No reply time is promised.",
      receivedAt: saved.receivedAt.toISOString(),
    });
  } catch {
    req.log.error("Unable to store contact message");
    res.status(503).json({ error: "The message could not be stored. Please try again later." });
  }
});

export default router;
