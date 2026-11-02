import { Router, type IRouter } from "express";

const router: IRouter = Router();

router.post("/contact/messages", (_req, res): void => {
  res.status(410).json({ error: "The contact form is closed. Please email hello@careerreality.in." });
});

export default router;
