export interface BMIResult {
  value: number;
  category: string;
  color: string;
  interpretation: string;
}

export function calculateBMI(heightCm: number, weightKg: number): BMIResult | null {
  if (!heightCm || !weightKg || heightCm <= 0 || weightKg <= 0) return null;

  const heightM = heightCm / 100;
  const bmi = weightKg / (heightM * heightM);
  const rounded = Math.round(bmi * 10) / 10;

  let category: string;
  let color: string;
  let interpretation: string;

  if (rounded < 18.5) {
    category = 'Underweight';
    color = 'text-blue-400';
    interpretation =
      'Your BMI is below the typical adult range. Consider consulting a nutritionist or campus health service for balanced nutrition guidance.';
  } else if (rounded < 25) {
    category = 'Normal Weight';
    color = 'text-emerald-400';
    interpretation =
      'Your BMI falls within the typical healthy adult range. Keep maintaining your balanced lifestyle and regular exercise.';
  } else if (rounded < 30) {
    category = 'Overweight';
    color = 'text-amber-400';
    interpretation =
      'Your BMI is slightly above the typical range. Regular exercise and mindful nutrition can help — focus on consistency, not extreme changes.';
  } else {
    category = 'Obese';
    color = 'text-rose-400';
    interpretation =
      'Your BMI is above the typical range. Consider gradually increasing physical activity and consulting a healthcare professional for personalized guidance.';
  }

  return { value: rounded, category, color, interpretation };
}

export function getBMIColorHex(value: number): string {
  if (value < 18.5) return '#60a5fa';
  if (value < 25) return '#34d399';
  if (value < 30) return '#fbbf24';
  return '#fb7185';
}
