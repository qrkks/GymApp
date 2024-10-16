from django.db import transaction
from datetime import datetime, date
from typing import Optional
from django.shortcuts import get_object_or_404
from ninja import Router, Schema
from .models import Workout, Exercise, BodyPart,  WorkoutSet, Set


router = Router()


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
    workouts = Workout.objects.all()  # 异步查询
    return workouts


@router.post("/workout", response=WorkoutOutSchema)
def create_workout(request, data: WorkoutInSchema):
    workout = Workout.objects.create(**data.dict())
    return workout


class WorkoutCreateSchema(Schema):
    date: date


@router.post('/workout/create', response=WorkoutOutSchema)
def create_or_create_workout_by_date(request, payload: WorkoutCreateSchema):
    workout, created = Workout.objects.get_or_create(date=payload.date)
    workout.created = created
    print(workout.__dict__)
    return workout


@router.get("/workout/{date}", response=WorkoutOutSchema)
def get_workout_by_date(request, date: date):
    workout = get_object_or_404(Workout, date=date)
    return workout


@router.delete('/workout')
def delete_all_workout(request):
    Workout.objects.all().delete()
    return 'ok'

@router.delete('/workout/{date}')
def delete_workout_by_date(request, date: date):
    workout = get_object_or_404(Workout, date=date)
    workout.delete()
    return 'ok'


class ChangeBodyPartInWorkoutSchema(Schema):
    body_part_names: list[str]


@router.put('/workout/add-body-parts/{date}', response=WorkoutOutSchema)
def add_body_parts_to_workout(request, date: str, payload: ChangeBodyPartInWorkoutSchema) -> WorkoutOutSchema:
    # 获取对应的 Workout 对象，找不到则返回 404
    workout: Workout = get_object_or_404(Workout, date=date)

    # 获取要添加的 BodyPart 对象，通过名称过滤
    body_parts: list[BodyPart] = BodyPart.objects.filter(
        name__in=payload.body_part_names)

    # 事务管理，确保写操作的一致性
    with transaction.atomic():
        # 将训练部位添加到 ManyToMany 关系中
        workout.body_parts.add(*body_parts)

    # 更新 workout 对象中的 body_parts_names 列表
    body_part_names: list[str] = workout.body_parts.values_list(
        'name', flat=True)
    workout.body_parts_names = list(body_part_names)

    # 返回更新后的 workout 对象，使用响应模式序列化输出
    return workout


@router.put('/workout/remove-body-parts/{date}', response=WorkoutOutSchema)
def remove_body_parts_from_workout(request, date: str, payload: ChangeBodyPartInWorkoutSchema) -> WorkoutOutSchema:
    # 获取对应的 Workout 对象，找不到则返回 404
    workout: Workout = get_object_or_404(Workout, date=date)

    # 获取要删除的 BodyPart 对象，通过名称过滤
    body_parts: list[BodyPart] = BodyPart.objects.filter(
        name__in=payload.body_part_names)

    # 事务管理，确保写操作的一致性
    with transaction.atomic():
        # 从 ManyToMany 关系中删除指定的 BodyPart 实例
        workout.body_parts.remove(*body_parts)

    # 动态更新 workout 对象中的 body_parts_names 列表
    body_part_names = workout.body_parts.values_list('name', flat=True)
    workout.body_parts_names = list(body_part_names)

    return workout


@router.post('/bodypart', response=BodyPartOutSchema)
def create_bodypart(request, data: BodyPartInSchema):
    bodypart = BodyPart.objects.create(**data.dict())
    return bodypart


@router.get('/bodypart', response=list[BodyPartOutSchema])
def get_bodypart(request):
    bodyparts = BodyPart.objects.all()
    return bodyparts


@router.delete('/bodypart')
def delete_all_bodypart(request):
    BodyPart.objects.all().delete()
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
    # 首先根据 body_part_id 获取 BodyPart 实例
    body_part = get_object_or_404(BodyPart, id=data.body_part_id)

    # 使用 get_or_create 来创建或获取 Exercise 实例
    exercise, created = Exercise.objects.get_or_create(
        name=data.name,
        description=data.description,
        body_part=body_part  # 传递 BodyPart 实例而不是 body_part_id
    )

    return exercise


@router.get('/exercise', response=list[ExerciseOutSchema])
def get_all_exercise(request):
    exercises = Exercise.objects.all()
    return exercises


@router.delete('/exercise')
def delete_all_exercise(request):
    Exercise.objects.all().delete()
    return 'ok'


# Set schema
class SetInSchema(Schema):
    reps: int
    weight: float


class SetOutSchema(Schema):
    id: int
    reps: int
    weight: float

# WorkoutSet schema


class WorkoutSetInSchema(Schema):
    workout_date: date
    exercise_name: str
    sets: list[SetInSchema]  # 引用 SetInSchema


class WorkoutSetOutSchema(Schema):
    id: int
    workout: WorkoutOutSchema
    exercise: ExerciseOutSchema
    sets: list[SetOutSchema]  # 返回时包含多个 SetOutSchema
    created: Optional[bool] = None


@router.post('/workoutset', response=WorkoutSetOutSchema)
def create_workoutset(request, data: WorkoutSetInSchema):
    # 获取 workout 和 exercise 对象
    workout = get_object_or_404(Workout, date=data.workout_date)
    exercise = get_object_or_404(Exercise, name=data.exercise_name)

    # 查找是否有相同的 workout 和 exercise 的 WorkoutSet
    workoutset, created = WorkoutSet.objects.get_or_create(
        workout=workout,
        exercise=exercise
    )

    # 创建或更新每个 Set
    sets_to_return = []
    for set_data in data.sets:
        set_obj, set_created = Set.objects.update_or_create(
            workout_set=workoutset,
            reps=set_data.reps,
            defaults={'weight': set_data.weight}
        )
        sets_to_return.append({
            'id': set_obj.id,
            'reps': set_obj.reps,
            'weight': set_obj.weight
        })

    # 返回创建或更新的 WorkoutSet 和相关的 Sets
    return {
        "id": workoutset.id,
        "workout": workoutset.workout,
        "exercise": workoutset.exercise,
        "sets": sets_to_return,
        "created": created
    }


@router.get('/workoutset', response=list[WorkoutSetOutSchema])
def get_all_workoutset(request):
    workoutsets = WorkoutSet.objects.prefetch_related('sets').all()
    result = []
    for workoutset in workoutsets:
        result.append({
            "id": workoutset.id,
            "workout": workoutset.workout,
            "exercise": workoutset.exercise,
            "sets": [
                {
                    "id": set.id,
                    "reps": set.reps,
                    "weight": set.weight
                } for set in workoutset.sets.all()
            ]
        })
    return result


@router.put('/workoutset', response=WorkoutSetOutSchema)
def update_workout_set(request, payload: WorkoutSetInSchema):
    # 根据日期获取 workout
    workout = get_object_or_404(Workout, date=payload.workout_date)

    # 根据名称获取 exercise
    exercise = get_object_or_404(Exercise, name=payload.exercise_name)

    # 查找现有的 WorkoutSet
    try:
        workout_set = WorkoutSet.objects.get(
            workout=workout, exercise=exercise)
    except WorkoutSet.DoesNotExist:
        return {"error": "WorkoutSet not found"}, 404

    # 更新关联的 sets
    sets_to_return = []
    for set_data in payload.sets:
        set_obj, created = Set.objects.update_or_create(
            workout_set=workout_set,
            reps=set_data.reps,
            defaults={'weight': set_data.weight}
        )
        sets_to_return.append({
            'id': set_obj.id,
            'reps': set_obj.reps,
            'weight': set_obj.weight
        })

    # 返回更新后的 WorkoutSet 对象
    return {
        "id": workout_set.id,
        "workout": workout_set.workout,
        "exercise": workout_set.exercise,
        "sets": sets_to_return,
        "created": False  # 更新操作，设置为 False
    }
