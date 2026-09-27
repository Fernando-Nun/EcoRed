import { Router, type IRouter } from "express";
import authRouter from "./auth";
import adminOrganizationsRouter from "./admin-organizations";
import donationsRouter from "./donations";
import healthRouter from "./health";
import organizationsRouter from "./organizations";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(organizationsRouter);
router.use(adminOrganizationsRouter);
router.use(donationsRouter);

export default router;
