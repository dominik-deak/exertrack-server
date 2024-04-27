"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const tfjs = __importStar(require("@tensorflow/tfjs-node"));
/**
 * Used to predict the next best action for an exercise based on previous sets
 */
class PerformancePredictor {
    constructor(model, labels) {
        this.model = model;
        this.labels = labels;
    }
    /**
     * Creates a new PerformancePredictor (factory function)
     * @returns the new PerformancePredictor
     */
    static create() {
        return __awaiter(this, void 0, void 0, function* () {
            const path = 'file://src/exertrack_model_tfjs/model.json';
            // labels have to be in the same order as in the notebook
            const labels = ['increase reps', 'increase weight', 'increase weight, decrease reps'];
            const model = yield tfjs.loadLayersModel(path);
            return new PerformancePredictor(model, labels);
        });
    }
    /**
     * Predicts the next best action for an exercise based on previous sets
     * @param sets the previous sets to use for prediction
     * @returns the labels for the predicted next best action
     */
    predict(sets) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.model) {
                throw new Error('Model not loaded');
            }
            const inputData = this.prepareInputData(sets);
            const inputTensor = tfjs.tensor2d(inputData);
            // console.log('Complete Input Features:', inputData);
            const predictions = this.model.predict(inputTensor);
            const predictionProbs = (yield predictions.array());
            // console.log('Prediction probabilities:', predictionProbs);
            const labels = predictionProbs.map(prediction => this.interpretPrediction(prediction));
            // console.log('Predicted labels:', labels);
            return labels;
        });
    }
    /**
     * Prepares the input data for the model.
     * Calculates the percentage change and moving average of the previous sets.
     * @param sets the previous sets
     * @returns the prepared input data
     */
    prepareInputData(sets) {
        return sets.map((set, index, allSets) => {
            const weightChange = this.calculatePercentageChange(set.weight, index > 0 ? allSets[index - 1].weight : undefined);
            const repsChange = this.calculatePercentageChange(set.reps, index > 0 ? allSets[index - 1].reps : undefined);
            const weightMovingAverage = this.calculateMovingAverage(allSets.map(s => s.weight), index, 5);
            const repsMovingAverage = this.calculateMovingAverage(allSets.map(s => s.reps), index, 5);
            return [weightChange, repsChange, weightMovingAverage, repsMovingAverage];
        });
    }
    /**
     * Calculates the percentage change between two numbers
     * @param current the current number
     * @param previous the previous number
     * @returns the percentage change
     */
    calculatePercentageChange(current, previous) {
        if (previous === undefined || previous === 0) {
            return 0;
        }
        const percentageChange = ((current - previous) / previous) * 100;
        return percentageChange;
    }
    /**
     * Calculates the moving average of the previous sets
     * @param allSets the whole list of sets
     * @param index the index of the current set
     * @param windowSize the size of the window for the moving average calculation
     * @returns the moving average
     */
    calculateMovingAverage(allSets, index, windowSize) {
        const relevantSets = allSets.slice(Math.max(index - windowSize + 1, 0), index + 1);
        const total = relevantSets.reduce((acc, cur) => acc + cur, 0);
        return total / relevantSets.length;
    }
    /**
     * Interprets the prediction probabilities into labels
     * @param prediction the prediction probabilities
     * @returns the interpreted labels
     */
    interpretPrediction(prediction) {
        const maxIndex = prediction.indexOf(Math.max(...prediction));
        return this.labels[maxIndex];
    }
}
exports.default = PerformancePredictor;
