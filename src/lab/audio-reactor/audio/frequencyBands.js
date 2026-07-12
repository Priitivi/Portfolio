export const frequencyRanges = {
  subBass: [20, 60],
  bass: [60, 250],
  lowMid: [250, 500],
  mid: [500, 2000],
  highMid: [2000, 4000],
  treble: [4000, 12000],
};

function averageRange(data, sampleRate, fftSize, [minimum, maximum]) {
  const binWidth = sampleRate / fftSize;
  const start = Math.max(0, Math.floor(minimum / binWidth));
  const end = Math.min(data.length - 1, Math.ceil(maximum / binWidth));
  if (end < start) return 0;

  let total = 0;
  for (let index = start; index <= end; index += 1) total += data[index];
  return total / (end - start + 1) / 255;
}

export function calculateAmplitude(timeData) {
  let energy = 0;
  for (let index = 0; index < timeData.length; index += 1) {
    const normalised = (timeData[index] - 128) / 128;
    energy += normalised * normalised;
  }
  return Math.min(1, Math.sqrt(energy / timeData.length) * 1.8);
}

export function calculateSpectralCentroid(data, sampleRate, fftSize) {
  const binWidth = sampleRate / fftSize;
  let magnitude = 0;
  let weightedFrequency = 0;
  for (let index = 0; index < data.length; index += 1) {
    const value = data[index] / 255;
    magnitude += value;
    weightedFrequency += index * binWidth * value;
  }
  if (!magnitude) return 0;
  return Math.min(1, weightedFrequency / magnitude / 12000);
}

export function calculateFrequencyBands(data, sampleRate, fftSize) {
  return Object.fromEntries(
    Object.entries(frequencyRanges).map(([name, range]) => [name, averageRange(data, sampleRate, fftSize, range)]),
  );
}

export function calculateStereoBalance(leftData, rightData) {
  const average = (data) => {
    let total = 0;
    for (let index = 0; index < data.length; index += 1) total += data[index];
    return total / data.length / 255;
  };
  const left = average(leftData);
  const right = average(rightData);
  const total = left + right;
  return total > 0.001 ? (right - left) / total : 0;
}
