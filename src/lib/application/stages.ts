import { z } from "zod";
import { APPLICATION_STAGES, type ApplicationStage, APPLICATION_STAGE_LABELS } from "./stageConstants";

export { APPLICATION_STAGES, type ApplicationStage, APPLICATION_STAGE_LABELS };

export const ApplicationStageSchema = z.enum(APPLICATION_STAGES);
