import type { Exercise } from '@/lib/types';

export const EXERCISES: Exercise[] = [
  {
    id: 'push-up',
    name: 'Push-Ups',
    category: 'strength',
    difficulty: 'beginner',
    description: 'Classic upper-body exercise targeting chest, shoulders, and triceps.',
    instructions: [
      'Start in a plank position with hands shoulder-width apart',
      'Keep your body in a straight line from head to heels',
      'Lower your body until your chest nearly touches the floor',
      'Push back up to the starting position',
    ],
    duration: 60,
    equipment: 'No Equipment (Bodyweight)',
    targetMuscles: ['Chest', 'Shoulders', 'Triceps', 'Core'],
    icon: 'push-up',
  },
  {
    id: 'squat',
    name: 'Bodyweight Squats',
    category: 'strength',
    difficulty: 'beginner',
    description: 'Fundamental lower-body exercise building leg and glute strength.',
    instructions: [
      'Stand with feet shoulder-width apart',
      'Lower your hips as if sitting in a chair',
      'Keep your knees behind your toes',
      'Drive through your heels to stand back up',
    ],
    duration: 90,
    equipment: 'No Equipment (Bodyweight)',
    targetMuscles: ['Quadriceps', 'Glutes', 'Hamstrings', 'Core'],
    icon: 'squat',
  },
  {
    id: 'jumping-jacks',
    name: 'Jumping Jacks',
    category: 'cardio',
    difficulty: 'beginner',
    description: 'Full-body cardio exercise to get your heart rate up quickly.',
    instructions: [
      'Start standing with feet together and arms at your sides',
      'Jump while spreading your legs and raising your arms overhead',
      'Jump again to return to the starting position',
      'Maintain a steady rhythm',
    ],
    duration: 60,
    equipment: 'No Equipment (Bodyweight)',
    targetMuscles: ['Full Body', 'Cardiovascular'],
    icon: 'jumping-jacks',
  },
  {
    id: 'mountain-climbers',
    name: 'Mountain Climbers',
    category: 'hiit',
    difficulty: 'intermediate',
    description: 'Dynamic core and cardio exercise that builds endurance.',
    instructions: [
      'Start in a high plank position',
      'Drive one knee toward your chest',
      'Quickly switch legs in a running motion',
      'Keep your core engaged and hips low',
    ],
    duration: 45,
    equipment: 'No Equipment (Bodyweight)',
    targetMuscles: ['Core', 'Shoulders', 'Cardiovascular'],
    icon: 'mountain-climbers',
  },
  {
    id: 'plank',
    name: 'Plank Hold',
    category: 'core',
    difficulty: 'beginner',
    description: 'Isometric core exercise that builds stability and endurance.',
    instructions: [
      'Rest on your forearms and toes',
      'Keep your body in a straight line',
      'Engage your core and glutes',
      'Hold the position without sagging hips',
    ],
    duration: 30,
    equipment: 'No Equipment (Bodyweight)',
    targetMuscles: ['Core', 'Shoulders', 'Back'],
    icon: 'plank',
  },
  {
    id: 'lunge',
    name: 'Forward Lunges',
    category: 'strength',
    difficulty: 'beginner',
    description: 'Unilateral leg exercise improving balance and strength.',
    instructions: [
      'Stand tall with feet hip-width apart',
      'Step forward with one leg, lowering your hips',
      'Keep your front knee at 90 degrees',
      'Push back to standing and repeat on the other side',
    ],
    duration: 90,
    equipment: 'No Equipment (Bodyweight)',
    targetMuscles: ['Quadriceps', 'Glutes', 'Hamstrings'],
    icon: 'lunge',
  },
  {
    id: 'burpee',
    name: 'Burpees',
    category: 'hiit',
    difficulty: 'advanced',
    description: 'Explosive full-body exercise combining strength and cardio.',
    instructions: [
      'Start standing, then drop into a squat with hands on the floor',
      'Kick your feet back into a plank',
      'Do a push-up, then jump your feet back to your hands',
      'Explosively jump up with arms overhead',
    ],
    duration: 60,
    equipment: 'No Equipment (Bodyweight)',
    targetMuscles: ['Full Body', 'Cardiovascular'],
    icon: 'burpee',
  },
  {
    id: 'high-knees',
    name: 'High Knees',
    category: 'cardio',
    difficulty: 'beginner',
    description: 'Energetic cardio exercise that raises heart rate and works legs.',
    instructions: [
      'Stand tall with feet hip-width apart',
      'Run in place, lifting knees to hip level',
      'Pump your arms in rhythm',
      'Land softly on the balls of your feet',
    ],
    duration: 45,
    equipment: 'No Equipment (Bodyweight)',
    targetMuscles: ['Legs', 'Cardiovascular', 'Core'],
    icon: 'high-knees',
  },
  {
    id: 'glute-bridge',
    name: 'Glute Bridges',
    category: 'strength',
    difficulty: 'beginner',
    description: 'Posterior chain exercise targeting glutes and hamstrings.',
    instructions: [
      'Lie on your back with knees bent and feet flat',
      'Lift your hips by squeezing your glutes',
      'Hold briefly at the top',
      'Lower slowly back down',
    ],
    duration: 60,
    equipment: 'No Equipment (Bodyweight)',
    targetMuscles: ['Glutes', 'Hamstrings', 'Core'],
    icon: 'glute-bridge',
  },
  {
    id: 'arm-circles',
    name: 'Arm Circles',
    category: 'flexibility',
    difficulty: 'beginner',
    description: 'Shoulder mobility exercise great for warm-ups.',
    instructions: [
      'Stand with arms extended to the sides at shoulder height',
      'Make small circular motions forward',
      'Gradually increase the circle size',
      'Reverse direction after 30 seconds',
    ],
    duration: 60,
    equipment: 'No Equipment (Bodyweight)',
    targetMuscles: ['Shoulders', 'Upper Back'],
    icon: 'arm-circles',
  },
  {
    id: 'dumbbell-curl',
    name: 'Dumbbell Bicep Curls',
    category: 'strength',
    difficulty: 'beginner',
    description: 'Isolation exercise targeting the biceps with dumbbells.',
    instructions: [
      'Stand with a dumbbell in each hand, palms facing forward',
      'Curl the weights toward your shoulders',
      'Keep your elbows close to your body',
      'Lower slowly with control',
    ],
    duration: 90,
    equipment: 'Dumbbells',
    targetMuscles: ['Biceps', 'Forearms'],
    icon: 'dumbbell-curl',
  },
  {
    id: 'warrior-pose',
    name: 'Warrior Pose',
    category: 'yoga',
    difficulty: 'beginner',
    description: 'Yoga pose building leg strength, stability, and focus.',
    instructions: [
      'Step one foot back, keeping front knee at 90 degrees',
      'Raise both arms overhead',
      'Keep your torso facing forward',
      'Hold and breathe steadily',
    ],
    duration: 60,
    equipment: 'Yoga Mat',
    targetMuscles: ['Legs', 'Core', 'Shoulders'],
    icon: 'warrior-pose',
  },
];

export function getExercisesByCategory(category: string): Exercise[] {
  if (category === 'all') return EXERCISES;
  return EXERCISES.filter((e) => e.category === category);
}

export function getExercisesByEquipment(equipment: string[]): Exercise[] {
  return EXERCISES.filter(
    (e) => equipment.includes(e.equipment) || e.equipment === 'No Equipment (Bodyweight)'
  );
}

export function getRecommendedExercises(
  goal: string | null,
  fitnessLevel: string | null,
  equipment: string[]
): Exercise[] {
  let filtered = getExercisesByEquipment(equipment);

  if (goal === 'weight_loss' || goal === 'endurance') {
    filtered = filtered.filter(
      (e) => e.category === 'cardio' || e.category === 'hiit' || e.category === 'core'
    );
  } else if (goal === 'muscle_gain') {
    filtered = filtered.filter(
      (e) => e.category === 'strength' || e.category === 'core'
    );
  } else if (goal === 'flexibility' || goal === 'stress_relief') {
    filtered = filtered.filter(
      (e) => e.category === 'flexibility' || e.category === 'yoga'
    );
  }

  if (fitnessLevel === 'beginner') {
    filtered = filtered.filter((e) => e.difficulty !== 'advanced');
  } else if (fitnessLevel === 'intermediate') {
    // intermediate sees beginner + intermediate
  }

  if (filtered.length < 3) {
    filtered = getExercisesByEquipment(equipment).filter(
      (e) => fitnessLevel !== 'beginner' || e.difficulty !== 'advanced'
    );
  }

  return filtered.slice(0, 6);
}
