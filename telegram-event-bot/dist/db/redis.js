"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.processQueue = exports.addToQueue = exports.deleteCache = exports.getCache = exports.setCache = void 0;
const redis_1 = require("redis");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const redisClient = (0, redis_1.createClient)({
    url: process.env.REDIS_URL || 'redis://localhost:6379',
});
redisClient.on('error', (err) => {
    console.error('Redis Client Error', err);
});
redisClient.on('connect', () => {
    console.log('Redis Client Connected');
});
// Connect to Redis
redisClient.connect().catch(console.error);
// Helper functions
const setCache = async (key, value, expireSeconds) => {
    try {
        const stringValue = JSON.stringify(value);
        await redisClient.set(key, stringValue);
        if (expireSeconds) {
            await redisClient.expire(key, expireSeconds);
        }
        return true;
    }
    catch (error) {
        console.error('Redis Set Error:', error);
        return false;
    }
};
exports.setCache = setCache;
const getCache = async (key) => {
    try {
        const value = await redisClient.get(key);
        return value ? JSON.parse(value) : null;
    }
    catch (error) {
        console.error('Redis Get Error:', error);
        return null;
    }
};
exports.getCache = getCache;
const deleteCache = async (key) => {
    try {
        await redisClient.del(key);
        return true;
    }
    catch (error) {
        console.error('Redis Delete Error:', error);
        return false;
    }
};
exports.deleteCache = deleteCache;
// Background job queue helpers
const addToQueue = async (queueName, data) => {
    try {
        await redisClient.lPush(queueName, JSON.stringify(data));
        return true;
    }
    catch (error) {
        console.error('Redis Queue Add Error:', error);
        return false;
    }
};
exports.addToQueue = addToQueue;
const processQueue = async (queueName) => {
    try {
        const data = await redisClient.rPop(queueName);
        return data ? JSON.parse(data) : null;
    }
    catch (error) {
        console.error('Redis Queue Process Error:', error);
        return null;
    }
};
exports.processQueue = processQueue;
exports.default = redisClient;
