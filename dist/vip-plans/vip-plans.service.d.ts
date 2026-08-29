import { Model } from 'mongoose';
import { VipPlan, VipPlanDocument } from './schemas/vip-plan.schema';
import { CreateVipPlanDto, UpdateVipPlanDto } from './dtos';
export declare class VipPlansService {
    private vipPlanModel;
    constructor(vipPlanModel: Model<VipPlanDocument>);
    create(dto: CreateVipPlanDto): Promise<VipPlanDocument>;
    findAll(onlyActive?: boolean): Promise<(import("mongoose").Document<unknown, {}, VipPlanDocument, {}, {}> & VipPlan & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    })[]>;
    findById(id: string): Promise<VipPlanDocument>;
    update(id: string, dto: UpdateVipPlanDto): Promise<VipPlanDocument>;
    softDelete(id: string): Promise<{
        success: boolean;
        message: string;
    }>;
}
