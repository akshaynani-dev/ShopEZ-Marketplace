import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import stocksRouter from "./stocks";
import tradingRouter from "./trading";
import portfolioRouter from "./portfolio";
import adminRouter from "./admin";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(stocksRouter);
router.use(tradingRouter);
router.use(portfolioRouter);
router.use(adminRouter);

export default router;
