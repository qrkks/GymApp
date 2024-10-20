# 使用阿里云的 Python 镜像作为基础镜像
FROM registry.cn-beijing.aliyuncs.com/ciye/python:3.12-slim

# 设置工作目录
WORKDIR /app

# 复制项目依赖配置文件
COPY requirements.txt ./

# 安装 Python 依赖包，并包括 Gunicorn
RUN pip install --upgrade pip \
    && pip install -r requirements.txt \
    && pip install gunicorn

# 复制项目代码到容器中
COPY . .

# 设置环境变量，确保 Python 输出无缓存
ENV PYTHONUNBUFFERED=1

# 运行 Django 迁移命令
# RUN python manage.py migrate
RUN python manage.py collectstatic --noinput

# 暴露端口
EXPOSE 8000

# 使用 Gunicorn 启动应用
CMD ["gunicorn", "--bind", "0.0.0.0:8000", "core.wsgi:application"]
