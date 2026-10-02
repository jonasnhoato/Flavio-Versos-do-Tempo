import { Router, type IRouter } from "express";
import healthRouter from "./health";
import poemsRouter from "./poems";

const router: IRouter = Router();

router.use(healthRouter);
router.use(poemsRouter);

export default router;
