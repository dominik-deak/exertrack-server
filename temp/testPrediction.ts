import PerformancePredictor from '../src/util/PerformancePredictor';

/**
 * Tests the performance predictor using a controlled example
 */
async function testPrediction() {
	const testSets = [
		{ weight: 100, reps: 10 }, // no changes
		{ weight: 100, reps: 10 },
		{ weight: 100, reps: 10 },
		{ weight: 100, reps: 20 }, // increased reps, weight steady
		{ weight: 100, reps: 30 },
		{ weight: 120, reps: 10 }, // increased weight, reps drop
		{ weight: 130, reps: 8 }
	];

	const predictor = await PerformancePredictor.create();
	const predictions = await predictor.predict(testSets);
	console.log('Test Predictions:', predictions);
}

testPrediction();
