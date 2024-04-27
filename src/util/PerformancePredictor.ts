import * as tfjs from '@tensorflow/tfjs-node';
import { ExtendedExerciseSet } from '../types/Prediction';

/**
 * Used to predict the next best action for an exercise based on previous sets
 */
class PerformancePredictor {
	private constructor(
		private model: tfjs.LayersModel,
		private readonly labels: string[]
	) {}

	/**
	 * Creates a new PerformancePredictor (factory function)
	 * @returns the new PerformancePredictor
	 */
	static async create() {
		const path = 'file://src/exertrack_model_tfjs/model.json';
		// labels have to be in the same order as in the notebook
		const labels = ['increase reps', 'increase weight', 'increase weight, decrease reps'];
		const model = await tfjs.loadLayersModel(path);
		return new PerformancePredictor(model, labels);
	}

	/**
	 * Predicts the next best action for an exercise based on previous sets
	 * @param sets the previous sets to use for prediction
	 * @returns the labels for the predicted next best action
	 */
	public async predict(sets: ExtendedExerciseSet[]) {
		if (!this.model) {
			throw new Error('Model not loaded');
		}

		const inputData = this.prepareInputData(sets);
		const inputTensor = tfjs.tensor2d(inputData);
		// console.log('Complete Input Features:', inputData);

		const predictions = this.model.predict(inputTensor) as tfjs.Tensor;
		const predictionProbs = (await predictions.array()) as number[][];
		// console.log('Prediction probabilities:', predictionProbs);

		const labels = predictionProbs.map(prediction => this.interpretPrediction(prediction));
		// console.log('Predicted labels:', labels);

		return labels;
	}

	/**
	 * Prepares the input data for the model.
	 * Calculates the percentage change and moving average of the previous sets.
	 * @param sets the previous sets
	 * @returns the prepared input data
	 */
	private prepareInputData(sets: ExtendedExerciseSet[]) {
		return sets.map((set, index, allSets) => {
			const weightChange = this.calculatePercentageChange(set.weight, index > 0 ? allSets[index - 1].weight : undefined);
			const repsChange = this.calculatePercentageChange(set.reps, index > 0 ? allSets[index - 1].reps : undefined);
			const weightMovingAverage = this.calculateMovingAverage(
				allSets.map(s => s.weight),
				index,
				5
			);
			const repsMovingAverage = this.calculateMovingAverage(
				allSets.map(s => s.reps),
				index,
				5
			);

			return [weightChange, repsChange, weightMovingAverage, repsMovingAverage];
		});
	}

	/**
	 * Calculates the percentage change between two numbers
	 * @param current the current number
	 * @param previous the previous number
	 * @returns the percentage change
	 */
	private calculatePercentageChange(current: number, previous?: number): number {
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
	private calculateMovingAverage(allSets: number[], index: number, windowSize: number) {
		const relevantSets = allSets.slice(Math.max(index - windowSize + 1, 0), index + 1);
		const total = relevantSets.reduce((acc, cur) => acc + cur, 0);
		return total / relevantSets.length;
	}

	/**
	 * Interprets the prediction probabilities into labels
	 * @param prediction the prediction probabilities
	 * @returns the interpreted labels
	 */
	private interpretPrediction(prediction: number[]) {
		const maxIndex = prediction.indexOf(Math.max(...prediction));
		return this.labels[maxIndex];
	}
}

export default PerformancePredictor;
