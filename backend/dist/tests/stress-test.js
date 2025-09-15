"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StressTestRunner = void 0;
// src/tests/stress-test.ts
const axios_1 = __importDefault(require("axios"));
const perf_hooks_1 = require("perf_hooks");
class StressTestRunner {
    constructor(config) {
        this.responseTimes = [];
        this.config = config;
        this.results = {
            totalRequests: 0,
            successfulPurchases: 0,
            failedPurchases: 0,
            duplicatePurchaseAttempts: 0,
            averageResponseTime: 0,
            maxResponseTime: 0,
            minResponseTime: 0,
            requestsPerSecond: 0,
            duration: 0,
            errors: {},
        };
    }
    async runStressTest() {
        console.log("Starting Flash Sale Stress Test...");
        console.log(`Configuration:
    - Total Users: ${this.config.totalUsers}
    - Concurrent Users: ${this.config.concurrentUsers}
    - Requests per User: ${this.config.requestsPerUser}
    - Flash Sale ID: ${this.config.flashSaleId}
    `);
        const startTime = perf_hooks_1.performance.now();
        const userBatches = this.createUserBatches();
        for (let i = 0; i < userBatches.length; i++) {
            const batch = userBatches[i];
            console.log(`Running batch ${i + 1}/${userBatches.length} with ${batch.length} users...`);
            await this.sleep(Math.random() * 200);
            const batchPromises = batch.map((userId) => this.simulateUser(userId));
            await Promise.allSettled(batchPromises);
            if (i < userBatches.length - 1) {
                await this.sleep(100);
            }
        }
        const endTime = perf_hooks_1.performance.now();
        this.results.duration = (endTime - startTime) / 1000;
        this.calculateStatistics();
        this.printResults();
        return this.results;
    }
    createUserBatches() {
        const allUsers = Array.from({ length: this.config.totalUsers }, (_, i) => `user_${i + 1}`);
        const batches = [];
        for (let i = 0; i < allUsers.length; i += this.config.concurrentUsers) {
            batches.push(allUsers.slice(i, i + this.config.concurrentUsers));
        }
        return batches;
    }
    async simulateUser(userId) {
        for (let attempt = 0; attempt < this.config.requestsPerUser; attempt++) {
            try {
                await this.attemptPurchase(userId);
                await this.sleep(50 + Math.random() * 150);
            }
            catch {
                // Ignore errors here; handled in attemptPurchase
            }
        }
    }
    async attemptPurchase(userId) {
        const startTime = perf_hooks_1.performance.now();
        this.results.totalRequests++;
        try {
            const response = await axios_1.default.post(`${this.config.baseUrl}/api/purchase`, { userId, flashSaleId: this.config.flashSaleId }, {
                timeout: 10000,
                headers: { "Content-Type": "application/json" },
            });
            const endTime = perf_hooks_1.performance.now();
            this.recordResponseTime(endTime - startTime);
            if (response.data.success) {
                this.results.successfulPurchases++;
            }
            else {
                this.results.failedPurchases++;
                this.incrementError(response.data.message || "Unknown error");
            }
        }
        catch (error) {
            const endTime = perf_hooks_1.performance.now();
            this.recordResponseTime(endTime - startTime);
            this.results.failedPurchases++;
            const axiosError = error;
            if (axiosError.response) {
                const msg = axiosError.response.data?.message || axiosError.response.statusText;
                this.incrementError(msg);
                if (msg.includes("already purchased") || msg.includes("duplicate")) {
                    this.results.duplicatePurchaseAttempts++;
                }
            }
            else if (axiosError.code === "ECONNABORTED") {
                this.incrementError("Request timeout");
            }
            else {
                this.incrementError(axiosError.message || "Network error");
            }
        }
    }
    recordResponseTime(ms) {
        this.responseTimes.push(ms);
    }
    incrementError(errorMessage) {
        this.results.errors[errorMessage] =
            (this.results.errors[errorMessage] || 0) + 1;
    }
    calculateStatistics() {
        if (this.responseTimes.length > 0) {
            this.results.averageResponseTime =
                this.responseTimes.reduce((a, b) => a + b, 0) /
                    this.responseTimes.length;
            this.results.maxResponseTime = Math.max(...this.responseTimes);
            this.results.minResponseTime = Math.min(...this.responseTimes);
        }
        else {
            this.results.averageResponseTime = 0;
            this.results.maxResponseTime = 0;
            this.results.minResponseTime = 0;
        }
        this.results.requestsPerSecond =
            this.results.duration > 0
                ? this.results.totalRequests / this.results.duration
                : 0;
    }
    printResults() {
        console.log("\nSTRESS TEST RESULTS");
        console.log("========================");
        console.log(`Duration: ${this.results.duration.toFixed(2)} seconds`);
        console.log(`Total Requests: ${this.results.totalRequests}`);
        console.log(`Successful Purchases: ${this.results.successfulPurchases}`);
        console.log(`Failed Purchases: ${this.results.failedPurchases}`);
        console.log(`Duplicate Purchase Attempts: ${this.results.duplicatePurchaseAttempts}`);
        console.log(`Success Rate: ${((this.results.successfulPurchases / this.results.totalRequests) *
            100).toFixed(2)}%`);
        console.log(`Requests per Second: ${this.results.requestsPerSecond.toFixed(2)}`);
        console.log("\nRESPONSE TIME STATISTICS");
        console.log(`Average: ${this.results.averageResponseTime.toFixed(2)}ms`);
        console.log(`Minimum: ${this.results.minResponseTime.toFixed(2)}ms`);
        console.log(`Maximum: ${this.results.maxResponseTime.toFixed(2)}ms`);
        console.log("\nERROR BREAKDOWN");
        Object.entries(this.results.errors).forEach(([error, count]) => {
            console.log(`${error}: ${count}`);
        });
        console.log("\nPERFORMANCE ANALYSIS");
        if (this.results.successfulPurchases > 0 &&
            this.results.duplicatePurchaseAttempts === 0) {
            console.log("No duplicate purchases detected - concurrency control working correctly");
        }
        else if (this.results.duplicatePurchaseAttempts > 0) {
            console.log(`${this.results.duplicatePurchaseAttempts} duplicate purchase attempts detected`);
        }
        if (this.results.averageResponseTime < 500) {
            console.log("Good response times - system performing well under load");
        }
        else if (this.results.averageResponseTime < 1000) {
            console.log("Moderate response times - consider optimization");
        }
        else {
            console.log("Slow response times - system may be overloaded");
        }
        if (this.results.requestsPerSecond > 100) {
            console.log("High throughput achieved");
        }
        else {
            console.log("Consider optimizing for higher throughput");
        }
    }
    sleep(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
}
exports.StressTestRunner = StressTestRunner;
// Run the stress test
async function runStressTest() {
    const config = {
        baseUrl: process.env.API_BASE_URL || "http://localhost:4000",
        flashSaleId: process.env.FLASH_SALE_ID || "default-flash-sale-id",
        totalUsers: parseInt(process.env.TOTAL_USERS || "500"),
        concurrentUsers: parseInt(process.env.CONCURRENT_USERS || "50"),
        requestsPerUser: parseInt(process.env.REQUESTS_PER_USER || "3"),
    };
    const testRunner = new StressTestRunner(config);
    try {
        await testRunner.runStressTest();
        process.exit(0);
    }
    catch (error) {
        console.error("Stress test failed:", error);
        process.exit(1);
    }
}
if (require.main === module) {
    runStressTest();
}
