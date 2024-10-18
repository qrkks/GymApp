from django.db.models import Max
from django.http import HttpResponse
from ninja.errors import HttpError
from django.db import transaction
from datetime import datetime, date
from typing import Optional
from django.shortcuts import get_object_or_404
from ninja import Body, Router, Schema
from .models import Workout, Exercise, BodyPart, WorkoutSet, Set
from django.contrib.auth.models import User

router = Router()

# Define schema classes with user context


class BodyPartInSchema(Schema):
    name: str


class BodyPartOutSchema(Schema):
    id: int
    name: str

    class Config:
        model = BodyPart


class WorkoutInSchema(Schema):
    id: Optional[int] = None

    class Config:
        model = Workout


class WorkoutOutSchema(Schema):
    id: int
    date: date
    start_time: datetime
    end_time: Optional[datetime]
    body_parts: Optional[list[BodyPartOutSchema]]
    created: Optional[bool] = None

    class Config:
        model = Workout


@router.get("/workout", response=list[WorkoutOutSchema])
def get_all_workouts(request):
    workouts = Workout.objects.filter(user=request.user)  # Filter by user
    return workouts


@router.post("/workout", response=WorkoutOutSchema)
def create_workout(request, data: WorkoutInSchema):
    workout = Workout.objects.create(
        user=request.user, **data.dict())  # Associate with user
    return workout


class WorkoutCreateSchema(Schema):
    date: date


@router.post('/workout/create', response=WorkoutOutSchema)
def create_or_create_workout_by_date(request, payload: WorkoutCreateSchema):
    workout, created = Workout.objects.get_or_create(
        user=request.user, date=payload.date)  # Associate with user
    workout.created = created
    return workout


@router.get("/workout/{date}", response=WorkoutOutSchema)
def get_workout_by_date(request, date: date):
    workout = get_object_or_404(
        Workout, user=request.user, date=date)  # Filter by user
    return workout


@router.delete('/workout')
def delete_all_workout(request):
    # Delete only user's workouts
    Workout.objects.filter(user=request.user).delete()
    return 'ok'


@router.delete('/workout/{date}')
def delete_workout_by_date(request, date: date):
    workout = get_object_or_404(
        Workout, user=request.user, date=date)  # Filter by user
    workout.delete()
    return 'ok'


class ChangeBodyPartInWorkoutSchema(Schema):
    body_part_names: list[str]


@router.put('/workout/add-body-parts/{date}', response=WorkoutOutSchema)
def add_body_parts_to_workout(request, date: str, payload: ChangeBodyPartInWorkoutSchema) -> WorkoutOutSchema:
    workout = get_object_or_404(
        Workout, user=request.user, date=date)  # Filter by user
    body_parts = BodyPart.objects.filter(
        user=request.user, name__in=payload.body_part_names)  # Filter by user

    with transaction.atomic():
        workout.body_parts.add(*body_parts)

    return workout


@router.put('/workout/remove-body-parts/{date}', response=WorkoutOutSchema)
def remove_body_parts_from_workout(request, date: str, payload: ChangeBodyPartInWorkoutSchema) -> WorkoutOutSchema:
    workout = get_object_or_404(
        Workout, user=request.user, date=date)  # Filter by user
    body_parts = BodyPart.objects.filter(
        user=request.user, name__in=payload.body_part_names)  # Filter by user

    with transaction.atomic():
        workout.body_parts.remove(*body_parts)
        exercises = Exercise.objects.filter(
            body_part__in=body_parts, user=request.user)
        for exercise in exercises:
            WorkoutSet.objects.filter(
                workout=workout, exercise=exercise).delete()

    return workout


@router.post('/bodypart', response=BodyPartOutSchema)
def create_bodypart(request, data: BodyPartInSchema):
    bodypart = BodyPart.objects.create(
        user=request.user, **data.dict())  # Associate with user
    return bodypart


class BodyPartPatchSchema(Schema):
    bodypart_name: str


@router.patch('/bodypart/{id}', response=BodyPartOutSchema)
def patch_bodypart_name(request, id: int, payload: BodyPartPatchSchema):
    bodypart = get_object_or_404(
        BodyPart, user=request.user, id=id)  # Filter by user
    bodypart.name = payload.bodypart_name
    bodypart.save()
    return bodypart


@router.get('/bodypart', response=list[BodyPartOutSchema])
def get_bodypart(request):
    bodyparts = BodyPart.objects.filter(user=request.user)  # Filter by user
    return bodyparts


@router.delete('/bodypart')
def delete_all_bodypart(request):
    # Delete only user's body parts
    BodyPart.objects.filter(user=request.user).delete()
    return 'ok'


class ExerciseInSchema(Schema):
    name: str
    description: str
    body_part_id: int


class ExerciseOutSchema(Schema):
    id: int
    name: str
    description: str
    body_part: BodyPartOutSchema


@router.post('/exercise', response=ExerciseOutSchema)
def create_exercise(request, data: ExerciseInSchema):
    body_part = get_object_or_404(
        BodyPart, user=request.user, id=data.body_part_id)  # Filter by user
    exercise, created = Exercise.objects.get_or_create(
        user=request.user, name=data.name, description=data.description, body_part=body_part)
    return exercise


class ExercisePatchSchema(Schema):
    exercise_name: str


@router.patch('/exercise/{exercise_id}', response=ExerciseOutSchema)
def update_exercise_name(request, exercise_id: int, payload: ExercisePatchSchema):
    exercise = get_object_or_404(
        Exercise, user=request.user, id=exercise_id)  # Filter by user
    exercise.name = payload.exercise_name
    exercise.save()
    return exercise


@router.get('/exercise', response=list[ExerciseOutSchema])
def get_exercise(request, body_part_name: str = None):
    if body_part_name:
        body_part = get_object_or_404(
            BodyPart, user=request.user, name=body_part_name)  # Filter by user
        exercises = Exercise.objects.filter(
            user=request.user, body_part=body_part)
    else:
        exercises = Exercise.objects.filter(user=request.user)

    return exercises


@router.get('/exercise/{body_part_name}', response=ExerciseOutSchema)
def get_exercise_by_body_part(request, body_part_name: str):
    body_part = get_object_or_404(
        BodyPart, user=request.user, name=body_part_name)  # Filter by user
    exercise = get_object_or_404(
        Exercise, user=request.user, body_part=body_part)
    return exercise


@router.delete('/exercise')
def delete_all_exercise(request):
    # Delete only user's exercises
    Exercise.objects.filter(user=request.user).delete()
    return 'ok'


class SetInSchema(Schema):
    weight: float
    reps: int


class SetOutSchema(Schema):
    id: int
    set_number: int
    weight: float
    reps: int


class WorkoutSetInSchema(Schema):
    workout_date: date
    exercise_name: str
    sets: Optional[list[SetInSchema]] = None


class WorkoutSetOutSchema(Schema):
    id: int
    workout: WorkoutOutSchema
    exercise: ExerciseOutSchema
    sets: Optional[list[SetOutSchema]]
    created: Optional[bool] = None


@router.get('/workoutset', response=list[WorkoutSetOutSchema])
def get_workoutsets(request, workout_date: date = None, exercise_name: str = None, body_part_name: str = None):
    workoutsets = WorkoutSet.objects.filter(workout__user=request.user).prefetch_related(
        'sets').select_related('workout', 'exercise')

    if workout_date:
        workoutsets = workoutsets.filter(workout__date=workout_date)

    if exercise_name:
        workoutsets = workoutsets.filter(exercise__name=exercise_name)

    if body_part_name:
        workoutsets = workoutsets.filter(
            exercise__body_part__name=body_part_name)

    return workoutsets


@router.post('/workoutset', response=WorkoutSetOutSchema)
def create_workoutset(request, data: WorkoutSetInSchema):
    # 获取用户的 workout 和 exercise 对象
    workout = get_object_or_404(Workout, user=request.user, date=data.workout_date)
    exercise = get_object_or_404(Exercise, user=request.user, name=data.exercise_name)

    # 创建或获取 WorkoutSet 对象，确保关联到用户
    workoutset, created = WorkoutSet.objects.get_or_create(
        workout=workout,
        exercise=exercise,
        user=request.user  # 确保 WorkoutSet 与用户关联
    )

    sets_to_return = []
    if data.sets:
        for set_data in data.sets:
            # 获取该 WorkoutSet 中当前最大的 set_number
            max_set_number = Set.objects.filter(workout_set=workoutset).aggregate(Max('set_number'))['set_number__max']
            next_set_number = (max_set_number or 0) + 1

            # 创建新的 Set 对象并将其关联到用户
            set_obj = Set.objects.create(
                workout_set=workoutset,
                set_number=next_set_number,
                reps=set_data.reps,
                weight=set_data.weight,
                user=request.user  # 确保关联到正确的用户
            )
            sets_to_return.append({
                'id': set_obj.id,
                'reps': set_obj.reps,
                'weight': set_obj.weight,
                'set_number': set_obj.set_number
            })

    return {
        "id": workoutset.id,
        "workout": workoutset.workout,
        "exercise": workoutset.exercise,
        "sets": sets_to_return,
        "created": created
    }


@router.put('/workoutset', response=WorkoutSetOutSchema)
def update_workout_set(request, payload: WorkoutSetInSchema):
    workout = get_object_or_404(
        Workout, user=request.user, date=payload.workout_date)
    exercise = get_object_or_404(
        Exercise, user=request.user, name=payload.exercise_name)

    try:
        workout_set = WorkoutSet.objects.get(
            workout=workout, exercise=exercise)
    except WorkoutSet.DoesNotExist:
        raise HttpError(404, "WorkoutSet not found")

    sets_to_return = []
    for set_data in payload.sets:
        set_obj, created = Set.objects.update_or_create(
            workout_set=workout_set, reps=set_data.reps, defaults={'weight': set_data.weight})
        sets_to_return.append({
            'id': set_obj.id,
            'reps': set_obj.reps,
            'weight': set_obj.weight
        })

    return {
        "id": workout_set.id,
        "workout": workout_set.workout,
        "exercise": workout_set.exercise,
        "sets": sets_to_return,
        "created": False
    }


@router.delete('/workoutset')
def delete_all_workoutset(request):
    WorkoutSet.objects.filter(workout__user=request.user).delete()
    return HttpResponse(status=204)


@router.delete('/workoutset/{workout_date}/{exercise_name}')
def delete_workout_set_by_exercise(request, workout_date: date, exercise_name: str):
    workoutset = get_object_or_404(
        WorkoutSet, workout__user=request.user, workout__date=workout_date, exercise__name=exercise_name)
    workoutset.delete()
    return HttpResponse(status=204)


@router.get('/sets', response=list[SetOutSchema])
def get_sets_by_workout_and_exercise(request, workout_date: date, exercise_name: str):
    workout = get_object_or_404(Workout, user=request.user, date=workout_date)
    exercise = get_object_or_404(
        Exercise, user=request.user, name=exercise_name)

    workoutset = get_object_or_404(
        WorkoutSet, workout=workout, exercise=exercise)
    sets = Set.objects.filter(workout_set=workoutset)

    result = []
    for set_obj in sets:
        result.append({
            "id": set_obj.id,
            "reps": set_obj.reps,
            "weight": set_obj.weight,
        })

    return result


@router.delete("/set/{set_id}")
def delete_set(request, set_id: int):
    set_to_delete = get_object_or_404(
        Set, workout_set__workout__user=request.user, id=set_id)
    workout_set = set_to_delete.workout_set
    set_to_delete.delete()

    remaining_sets = workout_set.sets.order_by('set_number')

    for i, set_obj in enumerate(remaining_sets):
        set_obj.set_number = i + 1
        set_obj.save()

    return {"success": True, "message": "Set deleted and numbers reordered"}


@router.put("/set/{set_id}", response=SetOutSchema)
def update_set(request, set_id: int, payload: SetInSchema):
    set_obj = get_object_or_404(
        Set, workout_set__workout__user=request.user, id=set_id)
    set_obj.reps = payload.reps
    set_obj.weight = payload.weight
    set_obj.save()
    return set_obj
