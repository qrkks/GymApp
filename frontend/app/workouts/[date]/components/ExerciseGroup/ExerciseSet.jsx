import AddButton from "./AddButton"
import ExerciseItem from "./ExerciseItem"

function ExerciseSet({set}) {
    return (<>
        <div className="flex items-center gap-2">
            {set.exercise.name}
            <AddButton/>
        </div>
        <ExerciseItem/>
    </>
    )
}

export default ExerciseSet
