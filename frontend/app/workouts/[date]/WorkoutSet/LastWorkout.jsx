import React from "react";

function LastWorkout({ selectedExercise, lastWorkoutData }) {
  // 计算天数差距
  let daysAgo = null;

  if (lastWorkoutData?.date) {
    const workoutDate = new Date(lastWorkoutData.date);
    const today = new Date();
    
    // 设置今天的日期到零点，避免时区误差
    today.setHours(0, 0, 0, 0);
    workoutDate.setHours(0, 0, 0, 0);

    const timeDiff = today - workoutDate; // 获取时间差，以毫秒为单位
    daysAgo = Math.floor(timeDiff / (1000 * 60 * 60 * 24)); // 转换为天数
  }

  // 解构 lastWorkoutData 的 sets
  const sets = lastWorkoutData?.sets || [];

  return (
    <>
      {/* 调试信息，开发中可以保留 */}
      {/* <pre>{JSON.stringify(selectedExercise, null, 2)}</pre>
      <pre>{JSON.stringify(lastWorkoutData, null, 2)}</pre> */}

      {/* 显示上次训练的数据 */}
      {selectedExercise && sets.length > 0 ? (
        <div className="w-full">
          <h4>
            上次 {selectedExercise} 训练数据 ({lastWorkoutData.date}，{daysAgo} 天前):
          </h4>
          <ul>
            {sets.map((set, index) => (
              <li key={index}>
                组 {set.set_number} - 重量: {set.weight}, 次数: {set.reps}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        selectedExercise && <p>没有上次训练数据</p>
      )}
    </>
  );
}

export default LastWorkout;
