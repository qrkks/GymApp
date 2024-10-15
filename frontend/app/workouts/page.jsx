"use client";
import StartBodyPart from "./[date]/components/StartBodyPart";
import StartWorkout from "./components/StartWorkout";
import {useState} from "react";

function Workouts() {
  // const [trainingStatus, setTrainingStatus] = useState('before');

  // const beforeTraining = () => setTrainingStatus("before");
  // const startTraining = () => setTrainingStatus("training");
  // const endTraining = () => setTrainingStatus("finished");
  // const pauseTraining = () => setTrainingStatus("pause");

  return (
    <div className="flex flex-col gap-4">
      <StartWorkout />
    </div>
  );
}

export default Workouts;
