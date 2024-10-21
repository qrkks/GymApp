from django.db import models
from django.contrib.auth.models import User  # 导入Django内置的用户模型
from datetime import date, datetime

# 1. 训练部位表

class BodyPart(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='body_parts')  # 关联用户
    name = models.CharField(max_length=100)  # 训练部位名称，例如 胸部、背部、腿部

    class Meta:
        unique_together = ('user', 'name')

    def __str__(self):
        return self.name
    
    

# 2. 训练动作表

class Exercise(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='exercises')  # 关联用户
    name = models.CharField(max_length=100)  # 训练动作名称
    description = models.TextField(blank=True, null=True)  # 动作描述
    body_part = models.ForeignKey(
        BodyPart, on_delete=models.CASCADE, related_name='exercises')  # 动作所属的部位

    class Meta:
        unique_together = ('user', 'name')

    def __str__(self):
        return self.name

# 3. 训练表

class Workout(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='workouts')  # 关联用户
    date = models.DateField(default=date.today)  # 自动记录当天日期
    start_time = models.DateTimeField(
        default=datetime.now)  # 记录训练开始时间
    end_time = models.DateTimeField(blank=True, null=True)  # 记录训练结束时间，允许为空
    body_parts = models.ManyToManyField(
        BodyPart, related_name='workout', blank=True)  # 训练中涉及的部位

    class Meta:
        unique_together = ('user', 'date')

    def __str__(self):
        return f"Workout on {self.date}"

# 4. 训练组表（记录每次做的动作）
# WorkoutSet 本质上是一个特定训练日（Workout）中针对某个训练动作（Exercise）的记录。如果 Exercise 被移除，那么这条记录就不再有任何价值。

class WorkoutSet(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='workout_sets')  # 关联用户
    workout = models.ForeignKey(
        Workout, on_delete=models.CASCADE, related_name='workout_sets')  # 训练日
    exercise = models.ForeignKey(Exercise, on_delete=models.CASCADE)  # 具体的训练动作

    class Meta:
        unique_together = ('workout', 'exercise')

    def __str__(self):
        return f"{self.exercise.name}: {self.reps} reps at {self.weight} kg"

# 5. 单组训练表

class Set(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sets')  # 关联用户
    workout_set = models.ForeignKey(
        WorkoutSet, related_name='sets', on_delete=models.CASCADE)
    set_number = models.IntegerField()
    weight = models.FloatField()
    reps = models.IntegerField()

    def __str__(self):
        return f"Set {self.set_number}: {self.reps} reps at {self.weight} kg"
