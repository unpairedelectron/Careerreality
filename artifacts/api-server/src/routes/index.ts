import { Router, type IRouter } from "express";
import healthRouter from "./health";
import workspaceRouter from "./workspace";
import publicDataRouter from "./public-data";
import careerRouter from "./career";
import resumeIntelligenceRouter from "./resume-intelligence";
import jobsRouter from "./jobs";
import catalogRouter from "./catalog";
import contactRouter from "./contact";
import publicAssetsRouter from "./public-assets";
import layoffAlertsRouter from "./layoff-alerts";
import jobLinksRouter from "./job-links";

const router: IRouter = Router();

router.use(healthRouter);
router.use(contactRouter);
router.use(publicAssetsRouter);
router.use(publicDataRouter);
router.use(layoffAlertsRouter);
router.use(jobLinksRouter);
router.use(catalogRouter);
router.use(resumeIntelligenceRouter);
router.use(careerRouter);
router.use(jobsRouter);
router.use(workspaceRouter);

export default router;
