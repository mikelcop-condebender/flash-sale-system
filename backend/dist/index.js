"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// backend\src\index.ts
const server_1 = __importDefault(require("./server"));
const logger_1 = require("./utils/logger");
const PORT = process.env.PORT || 4000;
server_1.default.listen(PORT, () => {
    logger_1.logger.info(`Server is running on port ${PORT}`);
});
