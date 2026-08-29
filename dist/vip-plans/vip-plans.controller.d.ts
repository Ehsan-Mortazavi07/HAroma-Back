import { VipPlansService } from './vip-plans.service';
import { CreateVipPlanDto, UpdateVipPlanDto } from './dtos';
export declare class VipPlansController {
    private readonly vipPlansService;
    constructor(vipPlansService: VipPlansService);
    getPublicVipPlans(): Promise<(import("mongoose").Document<unknown, {}, import("./schemas/vip-plan.schema").VipPlanDocument, {}, {}> & import("./schemas/vip-plan.schema").VipPlan & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    })[]>;
    adminListVipPlans(): Promise<(import("mongoose").Document<unknown, {}, import("./schemas/vip-plan.schema").VipPlanDocument, {}, {}> & import("./schemas/vip-plan.schema").VipPlan & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    })[]>;
    adminGetVipPlan(id: string): Promise<import("./schemas/vip-plan.schema").VipPlanDocument>;
    adminCreateVipPlan(dto: CreateVipPlanDto): Promise<import("./schemas/vip-plan.schema").VipPlanDocument>;
    adminUpdateVipPlan(id: string, dto: UpdateVipPlanDto): Promise<import("./schemas/vip-plan.schema").VipPlanDocument>;
    adminDeleteVipPlan(id: string): Promise<{
        success: boolean;
        message: string;
    }>;
}
