from django.db.models import Max
from django.http import HttpResponse
from ninja.errors import HttpError
from django.db import transaction
from datetime import datetime, date
from typing import Optional
from django.shortcuts import get_object_or_404
from ninja import Body, Router, Schema
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

        # 查找与这些 BodyPart 相关的 Exercise
        exercises = Exercise.objects.filter(body_part__in=body_parts)

        # 遍历每个 Exercise，删除与当前 Workout 关联的 WorkoutSet
        for exercise in exercises:
            WorkoutSet.objects.filter(
                workout=workout, exercise=exercise).delete()

    # 动态更新 workout 对象中的 body_parts_names 列表
    body_part_names = workout.body_parts.values_list('name', flat=True)
    workout.body_parts_names = list(body_part_names)

    return workout


@router.post('/bodypart', response=BodyPartOutSchema)
def create_bodypart(request, data: BodyPartInSchema):
    bodypart = BodyPart.objects.create(**data.dict())
    return bodypart


class BodyPartPatchSchema(Schema):
    bodypart_name: str

@router.patch('/bodypart/{id}', response=BodyPartOutSchema)
def patch_bodypart_name(request, id: int, payload: BodyPartPatchSchema):
    bodypart = get_object_or_404(BodyPart, id=id)
    bodypart.name = payload.bodypart_name
    bodypart.save()
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

class ExercisePatchSchema(Schema):
    exercise_name: str

@router.patch('/exercise/{exercise_id}', response=ExerciseOutSchema)
def update_exercise_name(request, exercise_id: int, payload: ExercisePatchSchema):
    exercise = get_object_or_404(Exercise, id=exercise_id)
    exercise.name = payload.exercise_name
    exercise.save()
    return exercise


@router.get('/exercise', response=list[ExerciseOutSchema])
def get_exercise(request, body_part_name: str = None):
    if body_part_name:
        # 如果提供了查询参数 body_part_name，则进行过滤
        body_part = get_object_or_404(BodyPart, name=body_part_name)
        exercises = Exercise.objects.filter(body_part=body_part)
    else:
        # 否则，返回所有的 Exercise
        exercises = Exercise.objects.all()

    return exercises


@router.get('/exercise/{body_part_name}', response=ExerciseOutSchema)
def get_exercise_by_body_part(request, body_part_name: str):
    body_part = get_object_or_404(BodyPart, name=body_part_name)
    exercise = get_object_or_404(Exercise, body_part=body_part)
    return exercise


@router.delete('/exercise')
def delete_all_exercise(request):
    Exercise.objects.all().delete()
    return 'ok'


# Set schema
class SetInSchema(Schema):
    weight: float
    reps: int


class SetOutSchema(Schema):
    id: int
    set_number: int
    weight: float
    reps: int

# WorkoutSet schema


class WorkoutSetInSchema(Schema):
    workout_date: date
    exercise_name: str
    sets: Optional[list[SetInSchema]] = None   # 引用 SetInSchema


class WorkoutSetOutSchema(Schema):
    id: int
    workout: WorkoutOutSchema
    exercise: ExerciseOutSchema
    sets: Optional[list[SetOutSchema]]  # 返回时包含多个 SetOutSchema
    created: Optional[bool] = None


@router.get('/workoutset', response=list[WorkoutSetOutSchema])
def get_workoutsets(request, workout_date: date = None, exercise_name: str = None, body_part_name: str = None):
    # 初始化 queryset，并进行相关的预加载
    workoutsets = WorkoutSet.objects.prefetch_related(
        'sets').select_related('workout', 'exercise')

    # 根据日期过滤（如果提供了 date）
    if workout_date:
        workoutsets = workoutsets.filter(workout__date=workout_date)

    # 根据训练动作名称过滤（如果提供了 exercise_name）
    if exercise_name:
        workoutsets = workoutsets.filter(exercise__name=exercise_name)

    # 根据身体部位名称过滤（如果提供了 body_part_name）
    if body_part_name:
        workoutsets = workoutsets.filter(
            exercise__body_part__name=body_part_name)

    # Ninja 和 Pydantic 将会根据你的 Schema 自动转换结果，不需要手动构造 JSON
    return workoutsets


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

    # 创建每个 Set
    sets_to_return = []
    if data.sets:
        for set_data in data.sets:
            # 获取当前 workoutset 中最大的 set_number
            max_set_number = Set.objects.filter(workout_set=workoutset).aggregate(
                Max('set_number'))['set_number__max']
            next_set_number = (max_set_number or 0) + 1  # 如果没有 set，默认为 1

            # 直接创建 set
            set_obj = Set.objects.create(
                workout_set=workoutset,
                set_number=next_set_number,  # 自动计算 set_number
                reps=set_data.reps,
                weight=set_data.weight
            )
            sets_to_return.append({
                'id': set_obj.id,
                'reps': set_obj.reps,
                'weight': set_obj.weight,
                'set_number': set_obj.set_number  # 返回 set_number
            })

    # 返回创建或更新的 WorkoutSet 和相关的 Sets
    return {
        "id": workoutset.id,
        "workout": workoutset.workout,
        "exercise": workoutset.exercise,
        "sets": sets_to_return,
        "created": created
    }


@router.put('/workoutset', response=WorkoutSetOutSchema)
def update_workout_set(request, payload: WorkoutSetInSchema):
    # 根据日期获取 workout
    workout = get_object_or_404(Workout, date=payload.workout_date)
    if not workout:
        # Raise a 404 error in a way that Django Ninja can handle
        raise HttpError(404, "Workout not found")

    # 根据名称获取 exercise
    exercise = get_object_or_404(Exercise, name=payload.exercise_name)
    if not exercise:
        # Raise a 404 error in a way that Django Ninja can handle
        raise HttpError(404, "Exercise not found")

    # 查找现有的 WorkoutSet
    try:
        workout_set = WorkoutSet.objects.get(
            workout=workout, exercise=exercise)
    except WorkoutSet.DoesNotExist:
        # Raise a 404 error in a way that Django Ninja can handle
        raise HttpError(404, "WorkoutSet not found")

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


@router.delete('/workoutset')
def delete_all_workoutset(request):
    WorkoutSet.objects.all().delete()
    return HttpResponse(status=204)


@router.delete('/workoutset/{workout_date}/{exercise_name}')
def delete_workout_set_by_exercise(request, workout_date: date, exercise_name: str):
    try:
        workoutset = WorkoutSet.objects.get(
            workout__date=workout_date, exercise__name=exercise_name)
        workoutset.delete()
    except WorkoutSet.DoesNotExist:
        raise HttpError(404, "WorkoutSet not found")

    return HttpResponse(status=204)


@router.get('/sets', response=list[SetOutSchema])
def get_sets_by_workout_and_exercise(request, workout_date: date, exercise_name: str):
    # 根据 workout_date 和 exercise_name 过滤 WorkoutSet
    workout = get_object_or_404(Workout, date=workout_date)
    exercise = get_object_or_404(Exercise, name=exercise_name)

    # 根据 workout 和 exercise 获取对应的 WorkoutSet
    workoutset = get_object_or_404(
        WorkoutSet, workout=workout, exercise=exercise)

    # 获取与该 WorkoutSet 相关的所有 Set
    sets = Set.objects.filter(workout_set=workoutset)

    # 构造返回结果
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
    # 1. 获取要删除的Set对象并删除
    set_to_delete = get_object_or_404(Set, id=set_id)
    workout_set = set_to_delete.workout_set  # 获取所属的workout_set
    set_to_delete.delete()  # 删除该组

    # 2. 获取剩余的组并按set_number重排
    remaining_sets = workout_set.sets.order_by('set_number')

    # 重新更新 set_number
    for i, set_obj in enumerate(remaining_sets):
        set_obj.set_number = i + 1
        set_obj.save()

    return {"success": True, "message": "Set deleted and numbers reordered"}

@router.put("/set/{set_id}", response=SetOutSchema)
def update_set(request, set_id: int, payload: SetInSchema):
    set_obj = get_object_or_404(Set, id=set_id)
    set_obj.reps = payload.reps
    set_obj.weight = payload.weight
    set_obj.save()
    return set_obj