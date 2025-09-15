import Joi from "joi";
import {
  ActivateFlashSaleBody,
  CreateFlashSaleBody,
  FlashSaleParams,
  PurchaseRequestBody,
  PurchaseStatusParams,
  SaleStatusParams,
} from "../types";

export const purchaseSchema = Joi.object<PurchaseRequestBody>({
  userId: Joi.string().required().min(1).max(100),
  flashSaleId: Joi.string().uuid().required(),
});

export const purchaseStatusParamsSchema = Joi.object<PurchaseStatusParams>({
  userId: Joi.string().required().min(1).max(100),
  flashSaleId: Joi.string().uuid().required(),
});

export const flashSaleSchema = Joi.object<CreateFlashSaleBody>({
  productName: Joi.string().required().min(1).max(200),
  productDescription: Joi.string().max(500).optional(),
  originalPrice: Joi.number().precision(2).positive().required(),
  flashSalePrice: Joi.number().precision(2).positive().required(),
  currency: Joi.string().length(3).default("USD"),
  totalStock: Joi.number().integer().min(1).max(10000).required(),
  startTime: Joi.date().iso().required(),
  endTime: Joi.date().iso().greater(Joi.ref("startTime")).required(),
});

export const activateSchema = Joi.object<ActivateFlashSaleBody>({
  isActive: Joi.boolean().required(),
});

export const uuidParamSchema = Joi.object<FlashSaleParams>({
  id: Joi.string().uuid().required(),
});

export const saleStatusParamsSchema = Joi.object<SaleStatusParams>({
  flashSaleId: Joi.string().uuid().required(),
});
