"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.saleStatusParamsSchema = exports.uuidParamSchema = exports.activateSchema = exports.flashSaleSchema = exports.purchaseStatusParamsSchema = exports.purchaseSchema = void 0;
const joi_1 = __importDefault(require("joi"));
exports.purchaseSchema = joi_1.default.object({
    userId: joi_1.default.string().required().min(1).max(100),
    flashSaleId: joi_1.default.string().uuid().required(),
});
exports.purchaseStatusParamsSchema = joi_1.default.object({
    userId: joi_1.default.string().required().min(1).max(100),
    flashSaleId: joi_1.default.string().uuid().required(),
});
exports.flashSaleSchema = joi_1.default.object({
    productName: joi_1.default.string().required().min(1).max(200),
    productDescription: joi_1.default.string().max(500).optional(),
    originalPrice: joi_1.default.number().precision(2).positive().required(),
    flashSalePrice: joi_1.default.number().precision(2).positive().required(),
    currency: joi_1.default.string().length(3).default("USD"),
    totalStock: joi_1.default.number().integer().min(1).max(10000).required(),
    startTime: joi_1.default.date().iso().required(),
    endTime: joi_1.default.date().iso().greater(joi_1.default.ref("startTime")).required(),
});
exports.activateSchema = joi_1.default.object({
    isActive: joi_1.default.boolean().required(),
});
exports.uuidParamSchema = joi_1.default.object({
    id: joi_1.default.string().uuid().required(),
});
exports.saleStatusParamsSchema = joi_1.default.object({
    flashSaleId: joi_1.default.string().uuid().required(),
});
