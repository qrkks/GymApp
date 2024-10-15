from django.db import transaction
from datetime import datetime, date
from typing import Optional
from django.shortcuts import get_object_or_404
from ninja import Router, Schema
from .models import Workout, Exercise, BodyPart,  WorkoutSet


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


class WorkoutSetInSchema(Schema):
    workout_date: date
    exercise_name: str
    reps: Optional[int] = None
    weight: Optional[float] = None


class WorkoutSetOutSchema(Schema):
    id: int
    workout: WorkoutOutSchema
    exercise: ExerciseOutSchema
    reps: Optional[int] = None
    weight: Optional[float] = None
    created: Optional[bool] = None


@router.post('/workoutset', response=WorkoutSetOutSchema)
def create_workoutset(request, data: WorkoutSetInSchema):
    # 获取 workout 和 exercise 对象
    workout = get_object_or_404(Workout, date=data.workout_date)
    exercise = get_object_or_404(Exercise, name=data.exercise_name)

    # 手动查询是否有相同的 workout 和 exercise 的记录
    try:
        workoutset = WorkoutSet.objects.get(workout=workout, exercise=exercise)

        # 如果找到记录，检查是否需要更新
        if workoutset.reps != data.reps or workoutset.weight != data.weight:
            workoutset.reps = data.reps
            workoutset.weight = data.weight
            workoutset.save()  # 更新记录
            created = False  # 不是新创建的，而是更新的
        else:
            created = False  # 没有变化，也不是新创建的

    except WorkoutSet.DoesNotExist:
        # 如果没有找到，创建新的 WorkoutSet
        workoutset = WorkoutSet.objects.create(
            workout=workout,
            exercise=exercise,
            reps=data.reps,
            weight=data.weight
        )
        created = True

    workoutset.created = created
    return workoutset


@router.get('/workoutset', response=list[WorkoutSetOutSchema])
def get_all_workoutset(request):
    workoutsets = WorkoutSet.objects.all()
    return workoutsets